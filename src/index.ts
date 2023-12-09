import { program } from 'commander'
import { AppConfig } from '@datosar/src/AppConfig'
import { createLogger } from '@datosar/src/utils/log'
import { createContext } from '@datosar/src/bootstrap'
import { Project } from '@datosar/src/domain/import/model/Project'
import { existsSync } from 'fs'
import path from 'path'
import fs from 'node:fs/promises'

const logger = createLogger('init')

async function run(configFile: string) {
  logger.info('loading configuration')
  const config = AppConfig.initFromFile(configFile)
  const context = await createContext(config)
  const project =
    (await context.projectRepository.findByName(config.projectName)) ??
    (await context.projectRepository.saveOrUpdate(Project.create(config.projectName, config.outputDir)))

  for (const importer of context.ckanImporters) {
    if (importer.config.enabled) {
      logger.info(`running importer: ${importer.name}`)
      await importer.importData(project)
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
