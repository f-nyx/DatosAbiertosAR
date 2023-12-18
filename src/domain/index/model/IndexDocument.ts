import { Entity } from '@datosar/src/utils/types/EntityClass'

@Entity<string>()
export class IndexDocument {
  static create(id: string, metadata: any): IndexDocument {
    return new IndexDocument(id, metadata, new Date())
  }

  static restore(entry: any): IndexDocument {
    return new IndexDocument(entry.id, entry.metadata, new Date(entry.updatedAt))
  }

  constructor(
    /** Unique id for this entry. */
    readonly id: string,
    /** Custom metadata. */
    readonly metadata: any,
    /** Last modification date. */
    readonly updatedAt: Date
  ) {}

  update(metadata: any): IndexDocument {
    return this.copy({ ...this, metadata, updatedAt: new Date() })
  }

  copy(instance: IndexDocument): IndexDocument {
    return new IndexDocument(instance.id, instance.metadata, instance.updatedAt)
  }
}
