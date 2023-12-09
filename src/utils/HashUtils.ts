import { createHash } from 'crypto'

/** Calculates the SHA-1 hash for the specific data.
 * @param data Data to calculate the SHA-1 hash.
 */
export function sha1(data: string): string {
  return createHash('sha1').update(data).digest('hex')
}
