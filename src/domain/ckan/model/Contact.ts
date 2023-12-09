export class Contact {
  static create(
    name: string,
    email?: string
  ): Contact {
    return new Contact(name, email)
  }

  static restore(contact: any): Contact {
    return new Contact(contact.name, contact.email)
  }

  constructor(
    /** Contact display name. */
    readonly name: string,
    /** Contact email, if any. */
    readonly email?: string
  ) {}
}
