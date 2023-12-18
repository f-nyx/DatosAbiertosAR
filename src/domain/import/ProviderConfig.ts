import { ImporterConfig } from '@datosar/src/domain/import/ImporterConfig'
import os from 'os'
import { AppConfig } from '@datosar/src/AppConfig'

export class ProviderConfig {
  static restore(config: any): ProviderConfig {
    const options = {
      ...config.options,
      jobs: config.options.jobs || os.availableParallelism(),
      resume: config.options.resume ?? true,
      syncFiles: config.options.syncFiles ?? true,
      enabled: config.options.enabled ?? true,
      cache: config.options.cache ?? true,
      retry: config.options.retry ?? true,
    } as ImporterConfig
    return new ProviderConfig(
      AppConfig.requireNotNull('name', config.name),
      AppConfig.requireNotNull('type', config.type),
      AppConfig.requireNotNull('outputDir', config.outputDir),
      options
    )
  }

  constructor(
    /** Dataset name. */
    readonly name: string,
    /** Dataset platform type. */
    readonly type: string,
    /** Output directory. */
    readonly outputDir: string,
    /** Import configuration. */
    readonly options: ImporterConfig
  ) {}
}
