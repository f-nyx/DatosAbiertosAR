import { Readable } from 'stream'
import fs from 'node:fs/promises'
import { createReadStream, existsSync } from 'fs'
import path from 'path'

export class FileSystemStore {
  constructor(
    /** Directory to store files. */
    private readonly dataDir: string
  ) {}

  async put(id: string, file: string): Promise<void> {
    const itemFile = await this.resolveFile(id)
    if (path.resolve(itemFile) !== path.resolve(file)) {
      await fs.rename(file, itemFile)
    }
  }

  async read(id: string): Promise<Readable> {
    const itemFile = await this.resolveFile(id)
    if (!existsSync(itemFile)) {
      throw new Error(`file not found: ${itemFile}`)
    }
    return createReadStream(itemFile)
  }

  async symlink(targetId: string, linkPath: string): Promise<void> {
    const itemFile = await this.resolveFile(targetId)
    const resolvedTarget = path.resolve(itemFile)
    const resolvedLink = path.resolve(linkPath)
    if (resolvedTarget !== resolvedLink) {
      await fs.symlink(path.resolve(itemFile), linkPath)
    }
  }

  async delete(id: string): Promise<void> {
    const itemFile = await this.resolveFile(id)
    if (existsSync(itemFile)) {
      await fs.rm(itemFile, { force: true })
    }
  }

  async isStored(file: string): Promise<boolean> {
    const id = path.basename(file)
    const itemPath = `${this.dataDir}/${id.substring(0, 2)}/${id.substring(2, 4)}`
    return existsSync(itemPath)
  }

  private async resolveFile(id: string): Promise<string> {
    const itemPath = `${this.dataDir}/${id.substring(0, 2)}/${id.substring(2, 4)}`
    await fs.mkdir(itemPath, { recursive: true })
    return `${itemPath}/${id}`
  }
}
