export class FileIndexEntry {
  static create(
    fileId: string,
    resourcesIds: string[],
    datasetsIds: string[],
    meta: any,
    updatedAt: Date
  ): FileIndexEntry {
    return new FileIndexEntry(fileId, resourcesIds, datasetsIds, meta, updatedAt)
  }

  static restore(fileId: string, instance: any): FileIndexEntry {
    return new FileIndexEntry(
      fileId,
      instance.resourcesIds,
      instance.datasetsIds,
      instance.meta ?? {},
      new Date(instance.updatedAt)
    )
  }

  constructor(
    /** Id of the resource's file. */
    readonly fileId: string,
    /** Resource unique identifier. */
    readonly resourcesIds: string[],
    /** Dataset this resource belongs to. */
    readonly datasetsIds: string[],
    /** File metadata. */
    readonly meta: any,
    /** File last modification date. */
    readonly updatedAt: Date
  ) {}

  addDataSets(datasetsIds: string[]): FileIndexEntry {
    return this.copy({ ...this, datasetsIds: [...this.datasetsIds, ...datasetsIds] })
  }

  addResources(resourcesIds: string[]): FileIndexEntry {
    return this.copy({ ...this, resourcesIds: [...this.resourcesIds, ...resourcesIds] })
  }

  updateMetadata(meta: any): FileIndexEntry {
    return this.copy({ ...this, meta })
  }

  toMetadata(): any {
    return {
      resourcesIds: this.resourcesIds,
      datasetsIds: this.datasetsIds,
      meta: this.meta,
      updatedAt: this.updatedAt,
    }
  }

  copy(instance: FileIndexEntry): FileIndexEntry {
    return new FileIndexEntry(
      instance.fileId,
      Array.from(new Set(instance.resourcesIds)),
      Array.from(new Set(instance.datasetsIds)),
      this.meta,
      instance.updatedAt
    )
  }
}
