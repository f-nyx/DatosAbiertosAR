import fs from 'node:fs/promises'
import path from 'path'
import { existsSync } from 'fs'
import { IndexDocument } from '@datosar/src/domain/index/model/IndexDocument'
import { createLogger } from '@datosar/src/utils/log'
import { Optional } from '@datosar/src/utils/Optional'
import { AsyncWriter } from '@datosar/src/utils/AsyncWriter'

const logger = createLogger('Partition')

export class Partition {
  private readonly writer: AsyncWriter

  constructor(
    /** Directory to write partition to. */
    readonly indexDir: string,
    /** Id of this partition. */
    readonly partitionId: number,
    /** Time between each flush event, in milliseconds. */
    readonly flushIntervalMs: number
  ) {
    this.writer = new AsyncWriter({ name: `Partition ${partitionId}`, flushIntervalMs })
    this.writer.start(this.writeToFile.bind(this))
  }

  entries: Map<string, IndexDocument> = new Map()
  size: number = 0
  lastAccessAt: Date = new Date()
  private indexFileName: string = path.join(this.indexDir, `index_${this.partitionId}.json`)

  async write(document: IndexDocument): Promise<IndexDocument> {
    await this.openIfRequired()

    const update: boolean =
      !this.entries.has(document.id) || this.entries.get(document.id)!!.updatedAt < document.updatedAt

    if (update) {
      this.entries.set(document.id, document)
      this.writer.markDirty()
      this.lastAccessAt = new Date()
    }
    return document
  }

  async read(id: string): Promise<Optional<IndexDocument>> {
    await this.openIfRequired()

    // If the document is missing we don't count it as access.
    if (this.entries.has(id)) {
      this.lastAccessAt = new Date()
    }

    return this.entries.get(id)
  }

  async remove(id: string): Promise<Optional<IndexDocument>> {
    const document = await this.read(id)
    if (document) {
      this.entries.delete(id)
      this.writer.markDirty()
      this.lastAccessAt = new Date()
    }
    return document
  }

  async flush() {
    await this.writer.flush()
  }

  async openIfRequired() {
    if (this.size === 0 && existsSync(this.indexFileName)) {
      logger.info(`[Partition ${this.partitionId}] opening partition from file: ${this.indexFileName}`)
      // TODO(f-nyx): use JSONStream
      const jsonIndex = JSON.parse((await fs.readFile(this.indexFileName)).toString())
      const entries = Object.entries(jsonIndex).reduce((result: any, [key, value]) => {
        result[key] = IndexDocument.restore(value)
        return result
      }, {})
      this.entries = new Map(Object.entries(entries))
      this.size = await this.estimateSize()
    }
  }

  async close() {
    this.entries = new Map()
    this.size = 0
    await this.writer.stop()
  }

  async estimateSize(): Promise<number> {
    if (existsSync(this.indexFileName)) {
      const stats = await fs.stat(this.indexFileName)
      return stats.size
    } else {
      return 0
    }
  }

  get isOpened(): boolean {
    return this.size > 0
  }

  private async writeToFile() {
    await this.openIfRequired()

    logger.info(`[Partition ${this.partitionId}] writing partition to file: ${this.indexFileName}`)
    // TODO(f-nyx): use JSONStream
    await fs.writeFile(this.indexFileName, JSON.stringify(Object.fromEntries(this.entries)))

    this.size = await this.estimateSize()
  }
}
