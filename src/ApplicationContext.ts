import { CkanImporter } from '@datosar/src/domain/ckan/CkanImporter'
import { createLogger } from '@datosar/src/utils/log'
import { ImportRepository } from '@datosar/src/domain/import/ImportRepository'
import { ProjectRepository } from '@datosar/src/domain/import/ProjectRepository'
import { FileStore } from '@datosar/src/utils/FileStore'
import { FileIndexManager } from '@datosar/src/domain/import/FileIndexManager'

const logger = createLogger('ApplicationContext')

export class ApplicationContext {
  constructor(
    /** Repository to manage projects. */
    readonly projectRepository: ProjectRepository,
    /** Repository to manage import processes. */
    readonly importRepository: ImportRepository,
    readonly fileStore: FileStore,
    readonly fileIndexManager: FileIndexManager
  ) {}

  readonly ckanImporters: CkanImporter[] = []

  async initialize() {
    logger.info('initializing application context')
  }

  async close() {
    logger.info('closing application context')
    await this.fileStore.flush()
  }
}
