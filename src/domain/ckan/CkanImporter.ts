import { AxiosInstance } from 'axios'
import { Process } from '@datosar/src/domain/import/model/Process'
import { CkanConfig } from '@datosar/src/domain/ckan/CkanConfig'
import { Catalog } from '@datosar/src/domain/ckan/model/Catalog'
import { ImportContext } from '@datosar/src/domain/ckan/model/ImportContext'
import { ImportItem } from '@datosar/src/domain/ckan/model/ImportItem'
import { createLogger } from '@datosar/src/utils/log'
import { Importer } from '@datosar/src/domain/import/Importer'
import { CatalogReader } from '@datosar/src/domain/ckan/CatalogReader'
import { ApplicationContext } from '@datosar/src/ApplicationContext'
import { HttpClientFactory } from '@datosar/src/utils/HttpClientFactory'
import { DatasetManager } from '@datosar/src/domain/ckan/DatasetManager'

const logger = createLogger('CkanImporter')

export class CkanImporter extends Importer {
  /** HTTP client. */
  private readonly downloadClient: AxiosInstance = HttpClientFactory.createInsecureClient()

  constructor(
    readonly name: string,
    /** Importer configuration. */
    readonly config: CkanConfig,
    private readonly catalogReader: CatalogReader,
    protected readonly applicationContext: ApplicationContext
  ) {
    super()
  }

  protected async run(process: Process) {
    const context = await this.resolveContext(process)
    const candidates = context.items.filter((item) => !item.processed)

    logger.info('importing datasets')
    await this.runJobs(async () => {
      while (candidates.length && !this.isCancelled) {
        const item = candidates.shift() as ImportItem
        try {
          await this.process(context, item)
          await this.updateContext(context.updateItem(item.success()))
        } catch (cause: any) {
          logger.error(`cannot download resource: resourceId=${item.resourceId},error=${cause}`)
          await this.updateContext(context.updateItem(item.fail(cause)))
        }
      }
    })
  }

  private async readCatalog(): Promise<Catalog> {
    logger.info('reading catalog')
    return await this.catalogReader.fromConfig(this.config)
  }

  private async resolveContext(process: Process): Promise<ImportContext> {
    const catalog = await this.readCatalog()
    const context = process.data.context ? ImportContext.restore(process.data.context) : undefined

    logger.info('creating import context')

    const items = []

    for (const dataset of catalog.datasets) {
      for (const resource of dataset.resources) {
        const item = context?.items?.find((item: ImportItem) => item.resourceId === resource.id)
        const resourceEntry = await this.datasetManager.findResource(resource.id)

        if (resourceEntry && resourceEntry.updatedAt < resource.updatedAt) {
          // updates existing resource
          items.push(item?.reset() ?? ImportItem.create(resource.id))
        } else if (!resourceEntry) {
          if (this.config.retry) {
            items.push(item?.reset() ?? ImportItem.create(resource.id))
          } else {
            items.push(item?.success() ?? ImportItem.create(resource.id))
          }
        }
      }
    }

    return await this.updateContext(ImportContext.create(catalog, items as ImportItem[]))
  }

  private async updateContext(context: ImportContext): Promise<ImportContext> {
    const total = context.items.length
    const completed = context.items.filter((item) => item.processed).length
    const progress = (completed * 100) / total

    await this.saveProcess(async (process) => process.updateData({ context }).reportProgress(progress))

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
      await this.datasetManager.saveResource(dataset, resource, this.config.outputDir, data)
    }
  }

  private get datasetManager(): DatasetManager {
    return this.applicationContext.datasetManager
  }
}
