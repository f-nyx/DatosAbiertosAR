import ShortUniqueId from 'short-unique-id'

/** Unique id generator. */
const { randomUUID } = new ShortUniqueId({ length: 10 })

/** The IdManager generates and parses application identifiers.
 * The implementation uses KSUID global unique identifiers.
 */
export const IdManager = {
  /** Generates a random identifier.
   */
  randomId(): string {
    return randomUUID()
  },
}
