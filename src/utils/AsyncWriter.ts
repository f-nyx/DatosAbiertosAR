import { Optional } from '@datosar/src/utils/Optional'
import { createLogger } from '@datosar/src/utils/log'

export type AsyncWriterConfig = {
  /** Name for this async writer. */
  name: string
  /** Time between each flush event, in milliseconds. */
  flushIntervalMs: number
}

const logger = createLogger('AsyncWriter')

export class AsyncWriter {
  constructor(
    /** Async writer configuration. */
    private readonly config: AsyncWriterConfig
  ) {}

  private writeCallback: Optional<() => Promise<void>> = undefined
  private running: boolean = false
  private dirty: boolean = false

  start(writeCallback: () => Promise<void>) {
    logger.info(`[${this.config.name}] starting async writer`)
    this.writeCallback = writeCallback
    this.running = true
    this.nextTick()
  }

  async stop() {
    logger.info(`[${this.config.name}] stopping async writer`)
    this.running = false
    this.dirty = true
    await this.flush()
    logger.info(`[${this.config.name}] shutdown completed`)
  }

  async flush(): Promise<void> {
    if (this.dirty) {
      logger.info(`[${this.config.name}] writing`)
      await this.writeCallback!!()
      this.dirty = false
    }
  }

  markDirty() {
    this.dirty = true
  }

  private nextTick() {
    if (!this.running) {
      return
    }
    if (!this.writeCallback) {
      throw new Error('write callback not defined')
    }
    setTimeout(() => {
      this.flush()
        .then(() => {
          this.nextTick()
        })
        .catch((error) => {
          logger.error(error)
        })
    }, this.config.flushIntervalMs)
  }
}
