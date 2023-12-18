import { createHash } from 'crypto'
import { Readable, Transform } from 'stream'
import crc32 from 'crc/crc32'
import { Optional } from '@datosar/src/utils/Optional'
import { createReadStream } from 'fs'

export type FileCrc32 = {
  sourceFile: string,
  crc32Hash: string
}

export type Crc32Transformer = {
  transform: Transform,
  crc32Hash: string
}

/** Calculates the SHA-1 hash for the specific data.
 * @param data Data to calculate the SHA-1 hash.
 */
export function sha1(data: string): string {
  return createHash('sha1').update(data).digest('hex')
}

export async function crc32File(sourceFile: string): Promise<FileCrc32> {
  const crc32Hash = await crc32Stream(createReadStream(sourceFile))
  return {
    sourceFile,
    crc32Hash
  }
}

export async function crc32Stream(source: Readable): Promise<string> {
  return new Promise((resolve, reject) => {
    let checksumResult: Optional<number> = undefined

    source.on('data', (chunk) => {
      if (chunk) {
        if (checksumResult === undefined) {
          checksumResult = crc32(chunk)
        } else {
          checksumResult = crc32(chunk, checksumResult)
        }
      }
    })
    source.on('end', () =>
      resolve(checksumResult?.toString(16) ?? '')
    )
    source.on('error', (err) => reject(err))
  })
}

export function crc32Transformer(): Crc32Transformer {
  let checksumResult: Optional<number> = undefined

  const transform = new Transform({
    transform(chunk, encoding, callback) {
      if (chunk) {
        if (checksumResult === undefined) {
          checksumResult = crc32(chunk)
        } else {
          checksumResult = crc32(chunk, checksumResult)
        }
      }

      callback(null, chunk);
    },
  })

  return {
    transform,
    get crc32Hash(): string {
      return checksumResult?.toString(16) ?? ''
    }
  }
}

export function stringHashCode(value: string): number {
  let hash = 0,
    i, chr;
  if (value.length === 0) return hash;
  for (i = 0; i < value.length; i++) {
    chr = value.charCodeAt(i);
    hash = ((hash << 5) - hash) + chr;
    hash |= 0; // Convert to 32bit integer
  }
  return hash;
}
