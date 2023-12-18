import { ImporterConfig } from '@datosar/src/domain/import/ImporterConfig'
import { ImportRepository } from '@datosar/src/domain/import/ImportRepository'
import { Process } from '@datosar/src/domain/import/model/Process'
import { ApplicationContext } from '@datosar/src/ApplicationContext'

export abstract class Importer {
  abstract get config(): ImporterConfig
  abstract get name(): string
  protected abstract get applicationContext(): ApplicationContext
  protected abstract run(process: Process): Promise<void>

  private processId?: string
  private cancelled: boolean = false

  async importData() {
    let process
    if (this.config.resume) {
      process =
        (await this.importRepository.findByName(this.name)) ??
        (await this.importRepository.saveOrUpdate(Process.create(this.name, {}).run()))
    } else {
      process = await this.importRepository.saveOrUpdate(Process.create(this.name, {}).run())
    }
    this.processId = process.id

    await this.run(process)
  }

  async close(): Promise<void> {
    this.cancelled = true
  }

  protected async runJobs(callback: () => Promise<void>) {
    await Promise.all(new Array(this.config.jobs).fill(0).map(callback))
  }

  protected get isCancelled(): boolean {
    return this.cancelled
  }

  protected async saveProcess(updateCallback: (process: Process) => Promise<Process>): Promise<Process> {
    const process = await this.importRepository.findById(this.processId!!)
    if (!process) {
      throw new Error('process not found')
    }
    const nextProcess = await updateCallback(process)
    return await this.importRepository.saveOrUpdate(nextProcess)
  }

  private get importRepository(): ImportRepository {
    return this.applicationContext.importRepository
  }
}
