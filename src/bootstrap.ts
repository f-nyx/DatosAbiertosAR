import { CkanImporter } from '@datosar/src/domain/ckan/CkanImporter'
import * as fs from 'node:fs/promises'
import { createLogger } from '@datosar/src/utils/log'
import { AppConfig } from '@datosar/src/AppConfig'
import { ApplicationContext } from '@datosar/src/ApplicationContext'
import * as path from 'path'
import { ImportRepository } from '@datosar/src/domain/import/ImportRepository'
import { FileIndexManager } from '@datosar/src/domain/import/FileIndexManager'
import { CkanConfig } from '@datosar/src/domain/ckan/CkanConfig'
import { CatalogReader } from '@datosar/src/domain/ckan/CatalogReader'
import { FileStore } from '@datosar/src/utils/FileStore'
import { ProjectRepository } from '@datosar/src/domain/import/ProjectRepository'

const logger = createLogger('bootstrap')

export async function createContext(config: AppConfig): Promise<ApplicationContext> {
  const { outputDir, providers } = config
  logger.info(`creating output dir if not exists: outputFile=${outputDir}`)
  await fs.mkdir(outputDir, { recursive: true })

  const importerDbFile = path.join(outputDir, 'importer.db')
  logger.info(`opening importer database: ${importerDbFile}`)

  const fileStore = new FileStore(path.join(outputDir, 'db.json'), 20000)
  const fileIndexManager = new FileIndexManager()
  const importRepository = new ImportRepository(fileStore)
  const projectRepository = new ProjectRepository(fileStore)
  const context = new ApplicationContext(
    projectRepository,
    importRepository,
    fileStore,
    fileIndexManager
  )

  await Promise.all(
    providers
      .filter((datasetConfig) => datasetConfig.type === 'ckan')
      .map(async (datasetConfig) => {
        const datasetOutputDir = path.join(outputDir, datasetConfig.name)
        await fs.mkdir(datasetOutputDir, { recursive: true })

        logger.info(`creating ckan importer: name=${datasetConfig.name},outputDir=${datasetOutputDir}`)

        const options = {
          ...datasetConfig.options,
          outputDir: datasetOutputDir,
        } as CkanConfig

        context.ckanImporters.push(
          new CkanImporter(
            `ckan-${datasetConfig.name}`,
            options,
            new CatalogReader(),
            context
          )
        )
      })
  )

  await context.initialize()
  return context
}
