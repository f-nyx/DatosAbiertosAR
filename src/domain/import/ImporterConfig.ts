export type ImporterConfig = {
  readonly outputDir: string
  readonly jobs: number
  readonly resume: boolean
  /** If true, it will sync process files with the file system. */
  readonly syncFiles: boolean
  /** Indicates whether the import is enabled for this dataset. */
  readonly enabled: boolean
  /** Enables cache strategies. */
  readonly cache: boolean
  /** True to retry failed imports. */
  readonly retry: boolean
}
