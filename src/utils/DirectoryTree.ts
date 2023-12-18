import { existsSync } from 'fs'
import * as fs from 'node:fs/promises'
import * as path from 'path'
import { createLogger } from '@datosar/src/utils/log'

const logger = createLogger('DirectoryTree')

export class DirectoryTree {
  static async search(dir: string, pattern: RegExp): Promise<string[]> {
    if (!existsSync(dir)) {
      throw new Error(`directory does not exist: ${dir}`)
    }

    logger.info(`searching for files: dir=${dir},pattern=${pattern}`)
    const results: Set<string> = new Set()

    // traverse the directory tree using a queue to avoid recursion.
    const queue: string[] = await fs.readdir(dir)

    while (queue.length) {
      const current = queue.shift() as string
      const absolutePath = path.join(dir, current)

      if (existsSync(absolutePath)) {
        const stats = await fs.stat(absolutePath)

        if (stats.isDirectory()) {
          const nextFiles = (await fs.readdir(absolutePath)).map((file) => `${current}/${file}`)
          queue.push(...nextFiles)
        } else {
          if (current.match(pattern)) {
            results.add(current)
          }
        }
      }
    }

    logger.info(`${results.size} files found`)

    return Array.from(results)
  }
}
