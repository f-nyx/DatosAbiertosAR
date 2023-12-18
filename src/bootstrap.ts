import { CkanImporter } from '@datosar/src/domain/ckan/CkanImporter'
import * as fs from 'node:fs/promises'
import { createLogger } from '@datosar/src/utils/log'
import { AppConfig } from '@datosar/src/AppConfig'
import { ApplicationContext } from '@datosar/src/ApplicationContext'
import * as path from 'path'
import { ImportRepository } from '@datosar/src/domain/import/ImportRepository'
import { CkanConfig } from '@datosar/src/domain/ckan/CkanConfig'
import { CatalogReader } from '@datosar/src/domain/ckan/CatalogReader'
import { IndexManager } from '@datosar/src/domain/index/IndexManager'
import { DatasetManager } from '@datosar/src/domain/ckan/DatasetManager'
import { FileSystemStore } from '@datosar/src/domain/store/FileSystemStore'
import { CollectionStore } from '@datosar/src/domain/store/CollectionStore'

const logger = createLogger('bootstrap')
const FLUSH_INTERVAL_MS = 20000

export async function createContext(config: AppConfig): Promise<ApplicationContext> {
  const { providers, indexDir, storageDir, dataDir, collectionsFile } = config
  logger.info(`creating index dir if not exists: outputFile=${indexDir}`)
  await fs.mkdir(path.join(indexDir), { recursive: true })
  logger.info(`creating storage dir if not exists: outputFile=${storageDir}`)
  await fs.mkdir(path.join(storageDir), { recursive: true })

  const collectionStore = new CollectionStore(collectionsFile, FLUSH_INTERVAL_MS)
  const importRepository = new ImportRepository(collectionStore)
  const indexManager = new IndexManager({
    indexDir,
    flushIntervalMs: FLUSH_INTERVAL_MS,
    memoryLimit: 3000 * 1024 * 1024,
    numberOfPartitions: 3
  })
  const fileSystemStore = new FileSystemStore(storageDir)
  const datasetManager = new DatasetManager(indexManager, fileSystemStore)
  const context = new ApplicationContext(
    importRepository,
    collectionStore,
    indexManager,
    datasetManager,
    fileSystemStore
  )

  await Promise.all(
    providers
      .filter((providerConfig) => providerConfig.type === 'ckan')
      .map(async (providerConfig) => {
        const providerOutputDir = path.join(dataDir, providerConfig.outputDir)
        await fs.mkdir(providerOutputDir, { recursive: true })

        logger.info(`creating ckan importer: name=${providerConfig.name},outputDir=${providerOutputDir}`)

        const options = {
          ...providerConfig.options,
          outputDir: providerOutputDir,
        } as CkanConfig

        context.ckanImporters.push(
          new CkanImporter(
            `ckan-${providerConfig.name}`,
            options,
            new CatalogReader(),
            context
          )
        )
      })
  )

  await context.initialize()
  return context
}
