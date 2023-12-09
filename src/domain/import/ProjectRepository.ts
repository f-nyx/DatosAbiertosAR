import { Project } from '@datosar/src/domain/import/model/Project'
import { Optional } from '@datosar/src/utils/Optional'
import { ProcessStatus } from '@datosar/src/domain/import/model/ProcessStatus'
import { createLogger } from '@datosar/src/utils/log'
import { FileStore } from '@datosar/src/utils/FileStore'

const logger = createLogger('ImportRepository')

const COLLECTION: string = 'projects'

export class ProjectRepository {
  constructor(
    /** Data source to store and read import information. */
    private readonly store: FileStore
  ) {}

  async findByName(name: string): Promise<Optional<Project>> {
    logger.debug(`finding project by name: name=${name}`)
    return await this.store.find(COLLECTION, (item: any) =>
      (item.name === name) ? Project.restore(item) : undefined
    )
  }

  async findById(id: string): Promise<Optional<Project>> {
    logger.debug(`finding project by id: id=${id}`)
    return await this.store.get(COLLECTION, id)
  }

  async saveOrUpdate(project: Project): Promise<Project> {
    return await this.store.write(COLLECTION, project)
  }
}
