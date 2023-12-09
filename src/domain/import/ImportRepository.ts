import { Process } from '@datosar/src/domain/import/model/Process'
import { Optional } from '@datosar/src/utils/Optional'
import { ProcessStatus } from '@datosar/src/domain/import/model/ProcessStatus'
import { createLogger } from '@datosar/src/utils/log'
import { FileStore } from '@datosar/src/utils/FileStore'

const logger = createLogger('ImportRepository')

const COLLECTION: string = 'processes'

export class ImportRepository {
  constructor(
    /** Data source to store and read import information. */
    private readonly store: FileStore
  ) {}

  async findByStatus(name: string, status: ProcessStatus): Promise<Optional<Process>> {
    logger.debug(`finding process by status: name=${name},status=${status}`)
    return await this.store.find(COLLECTION, (item: any) =>
      (item.name === name && item.status === status) ? Process.restore(item) : undefined
    )
  }

  async findById(id: string): Promise<Optional<Process>> {
    logger.debug(`finding process by id: id=${id}`)
    return await this.store.get(COLLECTION, id)
  }

  async saveOrUpdate(process: Process): Promise<Process> {
    return await this.store.write(COLLECTION, process)
  }
}
