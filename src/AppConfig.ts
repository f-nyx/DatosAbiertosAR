import * as fs from 'fs'
import { CkanConfig } from '@datosar/src/domain/ckan/CkanConfig'
import * as path from 'path'
import { ImporterConfig } from '@datosar/src/domain/import/ImporterConfig'
import { ProviderConfig } from '@datosar/src/domain/import/ProviderConfig'

export class AppConfig {
  private static instance: AppConfig

  static initFromFile(jsonFile: string): AppConfig {
    const jsonConfig = JSON.parse(fs.readFileSync(jsonFile).toString())
    const outputDir = AppConfig.requireNotNull('outputDir', jsonConfig.outputDir)
    AppConfig.instance = new AppConfig(
      AppConfig.requireNotNull('projectName', jsonConfig.projectName),
      outputDir,
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
    /** Data output directory. */
    readonly outputDir: string,
    /** Application log level, default is INFO. */
    readonly logLevel: string,
    /** List of all the supported providers. */
    readonly providers: ProviderConfig[]
  ) {}
}
