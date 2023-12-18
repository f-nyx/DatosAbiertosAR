export type IndexManagerConfig = {
  /** Index directory. */
  indexDir: string
  /** Time between each flush event, in milliseconds. */
  flushIntervalMs: number
  /** Max amount of estimated memory to use, in bytes. 0 means no limit. */
  memoryLimit: number
  /** Number of total partitions in this index. */
  numberOfPartitions: number
}
