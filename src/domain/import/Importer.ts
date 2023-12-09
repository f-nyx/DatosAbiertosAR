import { ImporterConfig } from '@datosar/src/domain/import/ImporterConfig'
import { ImportRepository } from '@datosar/src/domain/import/ImportRepository'
import { Process } from '@datosar/src/domain/import/model/Process'
import { ProcessStatus } from '@datosar/src/domain/import/model/ProcessStatus'
import { FileIndexManager } from '@datosar/src/domain/import/FileIndexManager'
import { FileRef } from '@datosar/src/domain/import/model/FileRef'
import { Optional } from '@datosar/src/utils/Optional'
import { Project } from '@datosar/src/domain/import/model/Project'
import { IdManager } from '@datosar/src/utils/IdManager'
import fs from 'node:fs/promises'
import path from 'path'
import { ProjectRepository } from '@datosar/src/domain/import/ProjectRepository'
import { ApplicationContext } from '@datosar/src/ApplicationContext'

export abstract class Importer {
  abstract get config(): ImporterConfig
  abstract get name(): string
  protected abstract get applicationContext(): ApplicationContext
  protected abstract run(): Promise<void>

  private activeProcessInternal?: Process
  activeProject?: Project

  async importData(project?: Project) {
    this.activeProject =
      project ??
      (await this.projectRepository.saveOrUpdate(Project.create(IdManager.randomId(), this.config.outputDir)))

    if (this.config.resume) {
      this.activeProcessInternal =
        (await this.importRepository.findByStatus(this.name, ProcessStatus.RUNNING)) ??
        (await this.importRepository.findByStatus(this.name, ProcessStatus.ERROR)) ??
        (await this.importRepository.saveOrUpdate(Process.create(this.name, {}).run()))
    } else {
      this.activeProcessInternal = await this.importRepository.saveOrUpdate(Process.create(this.name, {}).run())
    }

    if (this.config.syncFiles) {
      const nextIndex = await this.fileIndexManager.updateIndex(this.config.outputDir, this.activeProcessInternal.files)
      await this.saveProcess(this.activeProcessInternal.addFiles([...nextIndex.values()]))
    }

    await this.run()
  }

  async runJobs(callback: () => Promise<void>) {
    await Promise.all(new Array(this.config.jobs).fill(0).map(callback))
    await this.applicationContext.fileStore.flush()
  }

  protected get activeProcess(): Process {
    if (!this.activeProcessInternal) {
      throw new Error('process for this importer is not loaded, please start the import using importData()')
    }
    return this.activeProcessInternal
  }

  findFileByPath(path: string): Optional<FileRef> {
    return this.activeProcess.files.find((file) => file.path === path)
  }

  protected async saveProcess(process: Process): Promise<Process> {
    await this.importRepository.saveOrUpdate(process)
    this.activeProcessInternal = process
    return process
  }

  protected hasResource(resourceId: string): boolean {
    return this.activeProject?.hasResource(resourceId) ?? false
  }

  protected addResource(resourceId: string) {
    return this.activeProject?.addResource(resourceId)
  }

  protected async saveProject() {
    if (!this.activeProject) {
      throw new Error('no active project found')
    }
    await this.projectRepository.saveOrUpdate(this.activeProject)
  }

  private get projectRepository(): ProjectRepository {
    return this.applicationContext.projectRepository
  }

  private get importRepository(): ImportRepository {
    return this.applicationContext.importRepository
  }

  private get fileIndexManager(): FileIndexManager {
    return this.applicationContext.fileIndexManager
  }
}
