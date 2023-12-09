export class ImportItem {
  static create(resourceId: string): ImportItem {
    return new ImportItem(resourceId, false, undefined)
  }

  static restore(item: any): ImportItem {
    return new ImportItem(item.resourceId, item.processed, item.error)
  }

  constructor(
    /** Resource id related to this result. */
    readonly resourceId: string,
    /** Indicates if this result was already processed. */
    readonly processed: boolean,
    /** Import error, if any. */
    readonly error?: string
  ) {}

  success(): ImportItem {
    return new ImportItem(this.resourceId, true, undefined)
  }

  reset(): ImportItem {
    return new ImportItem(this.resourceId, false, undefined)
  }

  fail(error: string): ImportItem {
    return new ImportItem(this.resourceId, true, error)
  }
}
