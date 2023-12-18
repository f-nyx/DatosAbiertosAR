import { existsSync } from 'fs'
import path from 'path'
import { IndexDocument } from '@datosar/src/domain/index/model/IndexDocument'
import { createLogger } from '@datosar/src/utils/log'
import { Partition } from '@datosar/src/domain/index/model/Partition'
import { Optional } from '@datosar/src/utils/Optional'
import { IndexManagerConfig } from '@datosar/src/domain/index/IndexManagerConfig'
import { stringHashCode } from '@datosar/src/utils/HashUtils'

const logger = createLogger('IndexManager')

export class IndexManager {
  constructor(
    /** Index configuration. */
    private readonly config: IndexManagerConfig
  ) {
    if (!existsSync(path.dirname(config.indexDir))) {
      throw new Error(`directory does not exist: ${config.indexDir}`)
    }
  }

  private partitions: Partition[] = []
  private totalSize: number = 0

  async write(document: IndexDocument): Promise<IndexDocument> {
    const partitionKey = await this.ensurePartition(document.id)
    return await this.partitions[partitionKey]!!.write(document)
  }

  async read(id: string): Promise<Optional<IndexDocument>> {
    const partitionKey = await this.ensurePartition(id)
    return await this.partitions[partitionKey]!!.read(id)
  }

  async remove(id: string): Promise<Optional<IndexDocument>> {
    const partitionKey = await this.ensurePartition(id)
    return await this.partitions[partitionKey]!!.remove(id)
  }

  async close() {
    logger.info('closing')
    for (const partition of this.partitions) {
      await partition.close()
    }
  }

  async flush() {
    logger.info('flushing all partitions')
    for (const partition of this.partitions) {
      await partition.flush()
    }
  }

  private async ensurePartition(id: string): Promise<number> {
    const partitionId = Math.abs(stringHashCode(id) % this.config.numberOfPartitions)
    if (!this.partitions[partitionId]) {
      this.partitions[partitionId] = new Partition(this.config.indexDir, partitionId, this.config.flushIntervalMs)
    }

    if (this.config.memoryLimit > 0) {
      const partitionSize = await this.partitions[partitionId]!!.estimateSize()
      if (this.totalSize + partitionSize > this.config.memoryLimit) {
        const sorted = Array.from(this.partitions)
          .filter((partition) => partition.isOpened)
          .sort((partition1, partition2) => partition2.lastAccessAt.getTime() - partition1.lastAccessAt.getTime())
        let totalSize = this.totalSize

        while (totalSize + partitionSize > this.config.memoryLimit) {
          const partitionToEvict = sorted.shift() as Partition
          totalSize -= partitionToEvict.size
          await partitionToEvict.close()
        }
      }
    }

    return partitionId
  }
}
