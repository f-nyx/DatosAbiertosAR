import path from 'path'
import fs from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { createWriteStream, existsSync, mkdirSync, lstatSync } from 'fs'
import { IndexManager } from '@datosar/src/domain/index/IndexManager'
import { IndexDocument } from '@datosar/src/domain/index/model/IndexDocument'
import { FileIndexEntry } from '@datosar/src/domain/ckan/model/FileIndexEntry'
import { Optional } from '@datosar/src/utils/Optional'
import { CatalogReader } from '@datosar/src/domain/ckan/CatalogReader'
import { crc32File, crc32Transformer, FileCrc32 } from '@datosar/src/utils/HashUtils'
import { ResourceIndexEntry } from '@datosar/src/domain/ckan/model/ResourceIndexEntry'
import { createLogger } from '@datosar/src/utils/log'
import { Dataset } from '@datosar/src/domain/ckan/model/Dataset'
import { Resource } from '@datosar/src/domain/ckan/model/Resource'
import { Readable } from 'stream'
import { FileSystemStore } from '@datosar/src/domain/store/FileSystemStore'
import { DirectoryTree } from '@datosar/src/utils/DirectoryTree'
import { Catalog } from '@datosar/src/domain/ckan/model/Catalog'
import * as constants from 'constants'

const logger = createLogger('DatasetIndexManager')
const tempDir = `${tmpdir()}${path.sep}dataset-manager`

type CatalogEntry = { catalog: Catalog; file: string }
type ResourceEntry = { catalog: CatalogEntry; dataset: Dataset; resource: Resource; file: string }

export class DatasetManager {
  constructor(
    /** Index manager to manage Dataset entries. */
    private readonly indexManager: IndexManager,
    private readonly fileSystemStore: FileSystemStore
  ) {
    if (!existsSync(tempDir)) {
      mkdirSync(tempDir)
    }
  }

  private cancelled: boolean = false

  async indexResources(dataDir: string) {
    const catalogs = await this.findCatalogs(dataDir)
    const resourceEntries: ResourceEntry[] = catalogs.flatMap((catalogEntry) =>
      catalogEntry.catalog.datasets.flatMap((dataset) =>
        dataset.resources
          .map((resource) => {
            const datasetDir = path.join(path.dirname(catalogEntry.file), dataset.name)
            const resourceFile = path.join(datasetDir, resource.fileName)
            return {
              catalog: catalogEntry,
              dataset: dataset,
              resource,
              file: resourceFile,
            }
          })
          .filter((resourceEntry: ResourceEntry) => {
            try {
              lstatSync(resourceEntry.file)
              return true
            } catch (e) {
              return false
            }
          })
      )
    )

    const existingResources = await this.removeBrokenSymlinks(resourceEntries)

    for (const resourceEntry of existingResources) {
      if (this.cancelled) {
        return
      }

      const stats = await fs.lstat(resourceEntry.file)
      const entry = await this.findResource(resourceEntry.resource.id)

      if (!entry && (stats.isFile() || stats.isSymbolicLink())) {
        const catalogDir = path.dirname(resourceEntry.catalog.file)
        let sourceFile: string = resourceEntry.file

        if (stats.isSymbolicLink()) {
          sourceFile = await fs.readlink(resourceEntry.file)
        }

        let fileCrc32
        if (await this.fileSystemStore.isStored(sourceFile)) {
          fileCrc32 = {
            crc32Hash: path.basename(sourceFile),
            sourceFile
          }
        } else {
          const tempFile = path.join(tempDir, resourceEntry.resource.fileName)
          await fs.rename(sourceFile, tempFile)
          fileCrc32 = await crc32File(tempFile)
        }
        await this.saveResourceFromFile(resourceEntry.dataset, resourceEntry.resource, catalogDir, fileCrc32)
      }
    }
  }

  async findResource(id: string): Promise<Optional<ResourceIndexEntry>> {
    const entry = await this.indexManager.read(`resource_${id}`)
    return entry ? ResourceIndexEntry.restore(id, entry.metadata) : undefined
  }

  async close(): Promise<void> {
    logger.info('closing')
    this.cancelled = true
  }

  async saveResource(dataset: Dataset, resource: Resource, catalogDir: string, content: Readable) {
    const sourceFile = path.join(tempDir, resource.fileName)
    const writeStream = createWriteStream(sourceFile)
    const transformer = crc32Transformer()
    const crc32Hash: string = await new Promise((resolve, reject) =>
      content
        .pipe(transformer.transform)
        .pipe(writeStream)
        .on('close', () => resolve(transformer.crc32Hash))
        .on('error', reject)
    )

    await this.saveResourceFromFile(dataset, resource, catalogDir, { sourceFile, crc32Hash })
  }

  private async saveResourceFromFile(dataset: Dataset, resource: Resource, catalogDir: string, fileCrc32: FileCrc32) {
    logger.info('indexing resource')
    await this.indexResourceIfRequired(ResourceIndexEntry.create(resource.id, fileCrc32.crc32Hash, resource.updatedAt))

    logger.info('indexing file')
    const stats = await fs.stat(fileCrc32.sourceFile)
    await this.indexFileIfRequired(
      FileIndexEntry.create(
        fileCrc32.crc32Hash,
        [resource.id],
        [dataset.id],
        { size: stats.size, format: resource.format },
        stats.mtime
      )
    )

    logger.info('storing file')
    await this.fileSystemStore.put(fileCrc32.crc32Hash, fileCrc32.sourceFile)

    const datasetDir = path.join(catalogDir, dataset.name)
    const targetFile = path.join(datasetDir, resource.fileName)

    if (!existsSync(datasetDir)) {
      logger.info('writing dataset file')
      await this.writeDatasetToFile(catalogDir, dataset)
    }

    try {
      await fs.access(targetFile, constants.F_OK)
      logger.info(`target file exists, removing: targetFile=${targetFile}`)
      await fs.rm(targetFile)
    } catch (e) {
    }

    logger.info(`creating symlink: fileId=${fileCrc32.crc32Hash},target=${targetFile}`)
    await this.fileSystemStore.symlink(fileCrc32.crc32Hash, targetFile)
  }

  private async indexFileIfRequired(entry: FileIndexEntry) {
    const existingEntry = await this.findFile(entry.fileId)
    let document: IndexDocument

    if (existingEntry) {
      document = IndexDocument.create(
        `file_${entry.fileId}`,
        existingEntry
          .updateMetadata(entry.meta)
          .addDataSets(entry.datasetsIds)
          .addResources(entry.resourcesIds)
          .toMetadata()
      )
    } else {
      document = IndexDocument.create(`file_${entry.fileId}`, entry.toMetadata())
    }
    await this.indexManager.write(document)
  }

  private async indexResourceIfRequired(entry: ResourceIndexEntry) {
    let existingEntry = await this.findResource(entry.resourceId)
    let document: IndexDocument

    if (existingEntry) {
      document = IndexDocument.create(`resource_${entry.resourceId}`, entry.touch(entry.updatedAt).toMetadata())
    } else {
      document = IndexDocument.create(`resource_${entry.resourceId}`, entry.toMetadata())
    }
    await this.indexManager.write(document)
  }

  private async findFile(id: string): Promise<Optional<FileIndexEntry>> {
    const entry = await this.indexManager.read(`file_${id}`)
    return entry ? FileIndexEntry.restore(id, entry.metadata) : undefined
  }

  private async writeDatasetToFile(catalogDir: string, dataset: Dataset) {
    const outputDir = path.join(catalogDir, dataset.name)
    await fs.mkdir(outputDir, { recursive: true })
    await fs.writeFile(path.join(outputDir, 'dataset.json'), JSON.stringify(dataset))
  }

  private async findCatalogs(dataDir: string): Promise<CatalogEntry[]> {
    logger.info(`searching for catalogs: path=${dataDir}`)
    const catalogsFiles = await DirectoryTree.search(path.resolve(dataDir), /catalog\.json$/)
    const catalogs: CatalogEntry[] = []
    for (const catalogFile of catalogsFiles) {
      catalogs.push({
        catalog: await new CatalogReader().fromFile(path.join(dataDir, catalogFile)),
        file: path.join(dataDir, catalogFile),
      })
    }
    return catalogs
  }

  private async removeBrokenSymlinks(entries: ResourceEntry[]): Promise<ResourceEntry[]> {
    const existingResources: ResourceEntry[] = []

    for (const resourceEntry of entries) {
      const stats = await fs.lstat(resourceEntry.file)

      // We remove index entries from broken symlinks
      if (stats.isSymbolicLink() && !existsSync(resourceEntry.file)) {
        await fs.rm(resourceEntry.file)
        await this.indexManager.remove(`resource_${resourceEntry.resource.id}`)
      } else {
        existingResources.push(resourceEntry)
      }
    }

    return existingResources
  }
}
