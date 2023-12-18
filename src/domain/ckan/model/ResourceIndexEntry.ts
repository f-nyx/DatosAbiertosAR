export class ResourceIndexEntry {
  static create(resourceId: string, fileId: string, updatedAt: Date): ResourceIndexEntry {
    return new ResourceIndexEntry(resourceId, fileId, updatedAt)
  }

  static restore(resourceId: string, instance: any): ResourceIndexEntry {
    return new ResourceIndexEntry(resourceId, instance.fileId, new Date(instance.updatedAt))
  }

  constructor(
    /** Id of the related resource. */
    readonly resourceId: string,
    /** Unique id of this file. */
    readonly fileId: string,
    /** Resource last modification date. */
    readonly updatedAt: Date
  ) {}

  touch(updatedAt: Date): ResourceIndexEntry {
    return this.copy({ ...this, updatedAt })
  }

  toMetadata(): any {
    return { fileId: this.fileId, updatedAt: this.updatedAt }
  }

  copy(instance: ResourceIndexEntry): ResourceIndexEntry {
    return new ResourceIndexEntry(instance.resourceId, instance.fileId, instance.updatedAt)
  }
}
