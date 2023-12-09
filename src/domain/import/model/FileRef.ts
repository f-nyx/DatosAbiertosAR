export class FileRef {
  static create(
    name: string,
    path: string,
    updatedAt: Date
  ): FileRef {
    return new FileRef(name, path, updatedAt)
  }

  static restore(fileRef: any): FileRef {
    return new FileRef(fileRef.name, fileRef.path, new Date(fileRef.updatedAt))
  }

  constructor(
    /** File name. */
    readonly name: string,
    /** File full path. */
    readonly path: string,
    /** Modification date. */
    readonly updatedAt: Date
  ) {}


  touch(updatedAt: Date): FileRef {
    return new FileRef(this.name, this.path, updatedAt)
  }
}
