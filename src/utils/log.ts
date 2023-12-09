import { Logger, pino } from 'pino'
import pretty from 'pino-pretty'
import { AppConfig } from '@datosar/src/AppConfig'

/** Creates a logger with the specified prefix.
 *
 * The log lever is configured using the SERVER_LOG_LEVEL environment variable.
 *
 * @param prefix {string} Prefix to prepend to all messages.
 * @param options Pino logger additional options.
 * @returns the new logger.
 */
export function createLogger(prefix: string, options: any = {}): Logger {
  const prettyStream = pretty({
    colorize: true,
    sync: true,
    singleLine: true,
  })

  return pino(
    {
      name: prefix,
      timestamp: pino.stdTimeFunctions.isoTime,
      level: AppConfig.get()?.logLevel || 'info',
      ...options,
    },
    prettyStream
  )
}
