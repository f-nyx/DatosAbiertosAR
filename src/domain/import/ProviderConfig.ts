import { ImporterConfig } from '@datosar/src/domain/import/ImporterConfig'
import os from 'os'

export class ProviderConfig {
  static restore(config: any): ProviderConfig {
    const options = {
      ...config.options,
      jobs: config.options.jobs || os.availableParallelism(),
      resume: config.options.resume === undefined ? true : config.options.resume,
      syncFiles: config.options.syncFiles === undefined ? true : config.options.syncFiles,
      enabled: config.options.enabled === undefined ? true : config.options.enabled,
      cache: config.options.cache === undefined ? true : config.options.cache,
      retry: config.options.retry === undefined ? true : config.options.retry,
    } as ImporterConfig
    return new ProviderConfig(config.name, config.type, options)
  }

  constructor(
    /** Dataset name. */
    readonly name: string,
    /** Dataset platform type. */
    readonly type: string,
    /** Import configuration. */
    readonly options: ImporterConfig
  ) {}
}
