export class Organization {

  static create(
    name: string,
    url: string
  ): Organization {
    return new Organization(name, url)
  }

  static restore(organization: any): Organization {
    return new Organization(organization.name, organization.url)
  }

  constructor(
    /** Organization name. */
    readonly name: string,
    /** Site with information about the organization. */
    readonly url: string
  ) {}
}
