import { Process } from '@datosar/src/domain/import/model/Process'
import { Optional } from '@datosar/src/utils/Optional'
import { ProcessStatus } from '@datosar/src/domain/import/model/ProcessStatus'
import { createLogger } from '@datosar/src/utils/log'
import { CollectionStore } from '@datosar/src/domain/store/CollectionStore'

const logger = createLogger('ImportRepository')

const COLLECTION: string = 'processes'

export class ImportRepository {
  constructor(
    /** Data source to store and read import information. */
    private readonly store: CollectionStore
  ) {}

  async findByName(name: string): Promise<Optional<Process>> {
    logger.debug(`finding process by status: name=${name}`)
    return await this.store.find(COLLECTION, (item: any) =>
      item.name === name ? Process.restore(item) : undefined
    )
  }

  async findById(id: string): Promise<Optional<Process>> {
    logger.debug(`finding process by id: id=${id}`)
    return Process.restore(await this.store.get(COLLECTION, id))
  }

  async saveOrUpdate(process: Process): Promise<Process> {
    return await this.store.write(COLLECTION, process)
  }
}
