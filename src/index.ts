import { exit } from 'node:process'
import { program } from 'commander'
import { AppConfig } from '@datosar/src/AppConfig'
import { createLogger } from '@datosar/src/utils/log'
import { createContext } from '@datosar/src/bootstrap'
import { ApplicationContext } from '@datosar/src/ApplicationContext'

const logger = createLogger('init')

function gracefulExit(context: ApplicationContext) {
  context
    .close()
    .then(() => exit(0))
    .catch((err) => {
      logger.error(err)
      exit(1)
    })
}

async function run(configFile: string) {
  logger.info('loading configuration')
  const config = AppConfig.initFromFile(configFile)
  const context = await createContext(config)

  process.on('SIGINT', () => gracefulExit(context))
  process.on('SIGTERM', () => gracefulExit(context))

  for (const importer of context.ckanImporters) {
    logger.info('indexing existing files if required')
    await context.datasetManager.indexResources(importer.config.outputDir)

    if (importer.config.enabled) {
      logger.info(`running importer: ${importer.name}`)
      await importer.importData()
    } else {
      logger.info(`importer is disabled, skipping: ${importer.name}`)
    }
  }

  await context.close()
}

const options = program.requiredOption('--config-file <file>', 'Configuration file.').parse().opts()

run(options.configFile)
  .then(() => logger.info('bye'))
  .catch((err) => logger.error(err))
