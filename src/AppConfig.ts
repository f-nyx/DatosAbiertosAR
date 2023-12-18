import * as fs from 'fs'
import { ProviderConfig } from '@datosar/src/domain/import/ProviderConfig'

export class AppConfig {
  private static instance: AppConfig

  static initFromFile(jsonFile: string): AppConfig {
    const jsonConfig = JSON.parse(fs.readFileSync(jsonFile).toString())
    AppConfig.instance = new AppConfig(
      AppConfig.requireNotNull('projectName', jsonConfig.projectName),
      AppConfig.requireNotNull('indexDir', jsonConfig.indexDir),
      AppConfig.requireNotNull('storageDir', jsonConfig.storageDir),
      AppConfig.requireNotNull('dataDir', jsonConfig.dataDir),
      AppConfig.requireNotNull('collectionsFile', jsonConfig.collectionsFile),
      jsonConfig.logLevel || 'info',
      jsonConfig.providers.map((providersConfig: any) => ProviderConfig.restore(providersConfig))
    )

    return AppConfig.get()
  }

  static requireNotNull(name: string, value?: string) {
    const resolvedValue = value ?? process.env[name]
    if (!resolvedValue) {
      throw new Error(`required variable ${name} not defined`)
    }
    return resolvedValue
  }

  static get(): AppConfig {
    return AppConfig.instance
  }

  private constructor(
    /** A name for this project. */
    readonly projectName: string,
    /** Index output directory. */
    readonly indexDir: string,
    /** Files output directory. */
    readonly storageDir: string,
    /** Directory to store the datasets. */
    readonly dataDir: string,
    /** File to store the collections DB. */
    readonly collectionsFile: string,
    /** Application log level, default is INFO. */
    readonly logLevel: string,
    /** List of all the supported providers. */
    readonly providers: ProviderConfig[]
  ) {}
}
