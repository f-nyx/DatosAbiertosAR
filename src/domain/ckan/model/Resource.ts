export class Resource {
  static create(
    id: string,
    downloadUrl: string,
    name: string,
    format: string,
    updatedAt: Date,
    description?: string,
    landingUrl?: string
  ): Resource {
    return new Resource(id, downloadUrl, name, format, updatedAt, description, landingUrl)
  }

  static restore(resource: any): Resource {
    return new Resource(
      resource.id,
      resource.downloadUrl,
      resource.name,
      resource.format,
      new Date(resource.updatedAt),
      resource.description,
      resource.landingUrl
    )
  }

  constructor(
    /** Unique resource id. */
    readonly id: string,
    /** Resource download URL. */
    readonly downloadUrl: string,
    /** Resource name. */
    readonly name: string,
    /** Resource format. */
    readonly format: string,
    /** Last modification date. */
    readonly updatedAt: Date,
    /** Resource description. */
    readonly description?: string,
    /** URL of the resource landing page, if any. */
    readonly landingUrl?: string
  ) {}

  get fileName(): string {
    return this.downloadUrl.substring(this.downloadUrl.lastIndexOf('/') + 1)
  }
}
