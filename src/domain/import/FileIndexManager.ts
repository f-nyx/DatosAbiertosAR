import { existsSync } from 'fs'
import * as fs from 'node:fs/promises'
import * as path from 'path'
import { createLogger } from '@datosar/src/utils/log'
import { FileIndex } from '@datosar/src/domain/import/model/FileIndex'
import { FileRef } from '@datosar/src/domain/import/model/FileRef'

const logger = createLogger('FileIndexManager')

export class FileIndexManager {
  async buildIndex(files: FileRef[]): Promise<FileIndex> {
    logger.info('building files index')
    return files.reduce((index, file) => index.set(file.path, file), new Map())
  }

  async updateIndex(dataDir: string, files: FileRef[]): Promise<FileIndex> {
    if (!existsSync(dataDir)) {
      throw new Error(`index directory does not exist: ${dataDir}`)
    }

    logger.info('updating files index')
    const index: FileIndex = await this.buildIndex(files)

    // traverse the directory tree using a queue to avoid recursion.
    const queue: string[] = await fs.readdir(dataDir)

    while (queue.length) {
      const current = queue.shift() as string
      const absolutePath = path.join(dataDir, current)
      const stats = await fs.stat(absolutePath)

      if (stats.isDirectory()) {
        const nextFiles = (await fs.readdir(absolutePath)).map((file) => `${current}/${file}`)
        queue.push(...nextFiles)
      } else {
        if (index.has(current)) {
          const file = index.get(current) as FileRef
          if (stats.mtime > file.updatedAt) {
            logger.info(`updating: ${current}`)
            index.set(current, file.touch(stats.mtime))
          }
        } else {
          logger.info(`indexing: ${current}`)
          index.set(
            current,
            FileRef.create(path.basename(current), current, stats.mtime)
          )
        }
      }
    }

    return index
  }
}
