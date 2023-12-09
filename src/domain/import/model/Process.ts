import { ProcessStatus } from '@datosar/src/domain/import/model/ProcessStatus'
import { IdManager } from '@datosar/src/utils/IdManager'
import { FileRef } from '@datosar/src/domain/import/model/FileRef'
import { Entity } from '@datosar/src/utils/types/EntityClass'

/** Represents an import process.
 */
@Entity<string>()
export class Process {
  static create(name: string, data: any): Process {
    return new Process(IdManager.randomId(), name, ProcessStatus.CREATED, data, 0.0, [], new Date(), new Date(), null)
  }

  public static restore(process: any): Process {
    return new Process(
      process.id,
      process.name,
      process.status,
      process.data,
      process.progress,
      process.files ? process.files.map(FileRef.restore) : [],
      new Date(process.createdAt || process.created_at),
      new Date(process.updatedAt || process.updated_at),
      process.error
    )
  }

  constructor(
    readonly id: string,
    readonly name: string,
    readonly status: ProcessStatus,
    readonly data: any,
    readonly progress: number,
    readonly files: FileRef[],
    readonly createdAt: Date,
    readonly updatedAt: Date,
    readonly error?: any
  ) {}

  run(): Process {
    return this.copy({ ...this, status: ProcessStatus.RUNNING, updatedAt: new Date() })
  }

  success(): Process {
    return this.copy({ ...this, status: ProcessStatus.FINISHED, updatedAt: new Date() })
  }

  fail(error: any): Process {
    return this.copy({ ...this, status: ProcessStatus.ERROR, error, updatedAt: new Date() })
  }

  updateData(data: any): Process {
    return this.copy({ ...this, data, updatedAt: new Date() })
  }

  reportProgress(progress: number): Process {
    return this.copy({ ...this, progress, updatedAt: new Date() })
  }

  addFile(file: FileRef): Process {
    const files = [...this.files]
    const index = files.findIndex((existingFile) => existingFile.path === file.path)

    if (index > -1) {
      files[index] = file
    } else {
      files.push(file)
    }

    return this.copy({ ...this, files, updatedAt: new Date() })
  }

  addFiles(files: FileRef[]): Process {
    return files.reduce((process: Process, file: FileRef) => process.addFile(file), this)
  }

  copy(instance: Process): Process {
    return new Process(
      instance.id,
      instance.name,
      instance.status,
      instance.data,
      instance.progress,
      instance.files,
      instance.createdAt,
      instance.updatedAt,
      instance.error
    )
  }
}
