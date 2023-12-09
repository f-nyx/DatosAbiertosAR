import { ImporterConfig } from '@datosar/src/domain/import/ImporterConfig'

export type CkanConfig = ImporterConfig & {
  /** CKAN API url. */
  readonly apiUrl: string

  /** Standard CKAN catalog.xml URL.
   */
  readonly catalogUrl?: string

  /** catalog.xml file.
   * If set, it overrides catalogUrl. If the file does not exist, it fallbacks to catalogUrl.
   */
  readonly catalogFile?: string

  /** If true, it forces the catalog update. */
  readonly updateCatalog: boolean
}
