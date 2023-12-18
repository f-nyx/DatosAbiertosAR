import { existsSync } from 'fs'
import path from 'path'
import fs from 'node:fs/promises'
import { EntityClass } from '@datosar/src/utils/types/EntityClass'
import { Optional } from '@datosar/src/utils/Optional'
import { createLogger } from '@datosar/src/utils/log'
import { AsyncWriter } from '@datosar/src/utils/AsyncWriter'

const logger = createLogger('CollectionStore')

export class CollectionStore {
  private readonly writer: AsyncWriter

  constructor(
    /** File to store the data. */
    private readonly collectionFile: string,
    /** Time between each flush event, in milliseconds. */
    flushIntervalMs: number
  ) {
    if (!existsSync(path.dirname(collectionFile))) {
      throw new Error(`directory does not exist: ${path.dirname(collectionFile)}`)
    }
    this.writer = new AsyncWriter({ name: 'CollectionStore', flushIntervalMs })
    this.writer.start(this.writeToFile.bind(this))
  }

  private cache: Map<string, Map<any, any>> = new Map()

  async write<T, K>(collection: string, entity: EntityClass<T, K>): Promise<T> {
    this.ensureCache(collection)
    this.cache.get(collection)?.set(entity.id, entity)
    this.writer.markDirty()
    return entity as T
  }

  async get<T extends EntityClass<T, K>, K>(collection: string, id: string): Promise<Optional<T>> {
    await this.loadIfRequired()

    if (!this.cache.has(collection)) {
      return undefined
    }

    return this.cache.get(collection)?.get(id) as T
  }

  async find<T extends EntityClass<T, K>, K>(
    collection: string,
    predicate: (instance: any) => Optional<T>
  ): Promise<Optional<T>> {
    const items = await this.filter(collection, predicate)
    return items.shift()
  }

  async filter<T extends EntityClass<T, K>, K>(
    collection: string,
    predicate: (instance: any) => Optional<T>
  ): Promise<T[]> {
    await this.loadIfRequired()

    if (!this.cache.has(collection)) {
      return []
    }

    const results = []

    for (const instance of this.cache.get(collection)!!.values()) {
      const item = predicate(instance)
      if (item) {
        results.push(item)
      }
    }

    return results
  }

  async flush() {
    await this.writer.flush()
  }

  async close(): Promise<void> {
    await this.writer.stop()
  }

  private ensureCache(collection: string) {
    if (!this.cache.has(collection)) {
      this.cache.set(collection, new Map())
    }
  }

  private async writeToFile() {
    await this.loadIfRequired()
    logger.info('writing collections to file')
    const jsonCache = Object.entries(Object.fromEntries(this.cache.entries())).reduce((result: any, [collection, data]) => {
      result[collection] = Object.fromEntries(data)
      return result
    }, {})
    await fs.writeFile(this.collectionFile, JSON.stringify(jsonCache))
  }

  private async loadFromFile() {
    const jsonCache = JSON.parse((await fs.readFile(this.collectionFile)).toString())
    this.cache = new Map(Object.entries(jsonCache))
    for (const [key, value] of this.cache.entries()) {
      this.cache.set(key, new Map(Object.entries(value)))
    }
  }

  private async loadIfRequired() {
    if (this.cache.size === 0 && existsSync(this.collectionFile)) {
      await this.loadFromFile()
    }
  }
}
