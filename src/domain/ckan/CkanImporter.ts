import * as fs from 'node:fs/promises'
import axios, { AxiosInstance } from 'axios'
import { Dataset } from '@datosar/src/domain/ckan/model/Dataset'
import { Process } from '@datosar/src/domain/import/model/Process'
import { CkanConfig } from '@datosar/src/domain/ckan/CkanConfig'
import { Resource } from '@datosar/src/domain/ckan/model/Resource'
import { Catalog } from '@datosar/src/domain/ckan/model/Catalog'
import { ImportContext } from '@datosar/src/domain/ckan/model/ImportContext'
import { ImportItem } from '@datosar/src/domain/ckan/model/ImportItem'
import { createLogger } from '@datosar/src/utils/log'
import * as path from 'path'
import { Importer } from '@datosar/src/domain/import/Importer'
import { FileRef } from '@datosar/src/domain/import/model/FileRef'
import * as https from 'https'
import { CatalogReader } from '@datosar/src/domain/ckan/CatalogReader'
import { ApplicationContext } from '@datosar/src/ApplicationContext'
import { existsSync } from 'fs'

const logger = createLogger('CkanImporter')

export class CkanImporter extends Importer {
  /** HTTP client. */
  private readonly downloadClient: AxiosInstance = axios.create()

  constructor(
    readonly name: string,
    /** Importer configuration. */
    readonly config: CkanConfig,
    private readonly catalogReader: CatalogReader,
    protected readonly applicationContext: ApplicationContext
  ) {
    super()
    this.downloadClient.defaults.httpsAgent = new https.Agent({
      rejectUnauthorized: false,
    })
  }

  protected async run() {
    const context = await this.resolveContext(this.activeProcess)
    const candidates = context.items.filter((item) => !item.processed)

    logger.info('importing datasets')
    await this.runJobs(async () => {
      while (candidates.length) {
        const item = candidates.shift() as ImportItem
        try {
          await this.process(context, item)
          await this.updateContext(context.updateItem(item.success()), item.resourceId)
        } catch (cause: any) {
          logger.error(`cannot download resource: resourceId=${item.resourceId},error=${cause}`)
          await this.updateContext(context.updateItem(item.fail(cause)), item.resourceId)
        }
      }
    })

    if (context.items.some((item) => item.error)) {
      logger.info('finish with errors')
      await this.saveProcess(this.activeProcess.fail('there are errors processing resources'))
    } else {
      logger.info('finish without errors')
      await this.saveProcess(this.activeProcess.success())
    }
  }

  private async readCatalog(): Promise<Catalog> {
    logger.info('reading catalog')
    return await this.catalogReader.fromConfig(this.config)
  }

  private async resolveContext(process: Process): Promise<ImportContext> {
    const catalog = await this.readCatalog()
    const context = process.data.context ? ImportContext.restore(process.data.context) : undefined
    const resourcesIds = [...this.activeProject!!.resourcesIds]

    logger.info('creating import context')

    const items = catalog.datasets.flatMap((dataset) =>
        dataset.resources.map((resource) => {
          const hasResource = resourcesIds.some(
            (resourceId: string) => resourceId === resource.id || resource.id.includes(resourceId)
          )
          if (hasResource) {
            logger.info(`resource already in project, skipping: resourceId=${resource.id}`)
            return undefined
          }

          const item = context?.items?.find((item: ImportItem) => item.resourceId === resource.id)
          const file = this.findFileByPath(this.resourcePath(dataset, resource))

          if (file && file.updatedAt >= resource.updatedAt) {
            this.addResource(resource.id)
            return item?.success() ?? ImportItem.create(resource.id).success()
          } else {
            if (this.config.retry) {
              return item?.reset() ?? ImportItem.create(resource.id)
            } else {
              return item ?? ImportItem.create(resource.id)
            }
          }
        })
      )
      .filter((item) => item !== undefined)

    return await this.updateContext(ImportContext.create(catalog, items as ImportItem[]))
  }

  private async updateContext(context: ImportContext, resourceId?: string): Promise<ImportContext> {
    const total = context.items.length
    const completed = context.items.filter((item) => item.processed).length
    const progress = (completed * 100) / total

    await this.saveProcess(this.activeProcess.updateData({ context }).reportProgress(progress))

    if (resourceId) {
      this.addResource(resourceId)
      await this.saveProject()
    }

    return context
  }

  private async process(context: ImportContext, item: ImportItem) {
    logger.info(`processing item: resourceId=${item.resourceId}`)
    const resource = context.findResource(item.resourceId)
    const dataset = context.findDatasetByResource(item.resourceId)

    if (!resource || !dataset) {
      throw new Error(`dataset or resource not found: ${item.resourceId}`)
    }

    if (resource.downloadUrl) {
      logger.info(
        `downloading resource: resourceId=${item.resourceId},name=${resource.name},downloadUrl=${resource.downloadUrl}`
      )
      const { data, status, statusText } = await this.downloadClient.get(resource.downloadUrl, {
        responseType: 'stream',
        validateStatus: () => true,
      })
      if (status !== 200) {
        throw new Error(
          `error downloading resource: resourceId=${resource.id},downloadUrl=${resource.downloadUrl},status=${status},statusText=${statusText}`
        )
      }
      await this.writeResourceToFile(dataset, resource, data)
    }
  }

  private async writeDatasetToFile(dataset: Dataset) {
    const outputDir = path.join(this.config.outputDir, dataset.name)
    await fs.mkdir(outputDir, { recursive: true })
    await fs.writeFile(path.join(outputDir, 'dataset.json'), JSON.stringify(dataset))
  }

  private async writeResourceToFile(dataset: Dataset, resource: Resource, data: any) {
    const outputDir = path.join(this.config.outputDir, dataset.name)
    const fileName = resource.downloadUrl.substring(resource.downloadUrl.lastIndexOf('/') + 1)
    const filePath = path.join(outputDir, fileName)

    if (!existsSync(outputDir)) {
      await this.writeDatasetToFile(dataset)
    }

    await fs.writeFile(filePath, data)
    await this.saveProcess(this.activeProcess.addFile(FileRef.create(fileName, filePath, resource.updatedAt)))
  }

  private resourcePath(dataset: Dataset, resource: Resource): string {
    const fileName = resource.downloadUrl.substring(resource.downloadUrl.lastIndexOf('/') + 1)
    return path.join(dataset.name, fileName)
  }
}
