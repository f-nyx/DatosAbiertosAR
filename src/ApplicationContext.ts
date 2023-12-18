import { CkanImporter } from '@datosar/src/domain/ckan/CkanImporter'
import { createLogger } from '@datosar/src/utils/log'
import { ImportRepository } from '@datosar/src/domain/import/ImportRepository'
import { IndexManager } from '@datosar/src/domain/index/IndexManager'
import { DatasetManager } from '@datosar/src/domain/ckan/DatasetManager'
import { CollectionStore } from '@datosar/src/domain/store/CollectionStore'
import { FileSystemStore } from '@datosar/src/domain/store/FileSystemStore'

const logger = createLogger('ApplicationContext')

export class ApplicationContext {
  constructor(
    /** Repository to manage import processes. */
    readonly importRepository: ImportRepository,
    readonly collectionStore: CollectionStore,
    readonly indexManager: IndexManager,
    readonly datasetManager: DatasetManager,
    readonly fileSystemStore: FileSystemStore
  ) {}

  readonly ckanImporters: CkanImporter[] = []

  async initialize() {
    logger.info('initializing application context')
  }

  async close() {
    logger.info('closing application context')
    await this.collectionStore.close()
    await this.indexManager.close()
    await this.datasetManager.close()
    for (const importer of this.ckanImporters) {
      await importer.close()
    }
  }
}
