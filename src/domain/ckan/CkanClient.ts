import axios, { AxiosInstance } from 'axios'
import { Dataset } from '@datosar/src/domain/ckan/model/Dataset'
import { Contact } from '@datosar/src/domain/ckan/model/Contact'
import { Resource } from '@datosar/src/domain/ckan/model/Resource'
import { createLogger } from '@datosar/src/utils/log'
import https from 'https'

const logger = createLogger('CkanClient')

export class CkanClient {
  /** HTTP client. */
  private readonly client: AxiosInstance

  constructor(
    apiUrl: string
  ) {
    this.client = axios.create({ baseURL: apiUrl })
    this.client.defaults.httpsAgent = new https.Agent({
      rejectUnauthorized: false,
    })
  }

  async listDatasets(): Promise<Dataset[]> {
    logger.info('retrieving package list')
    const { data } = await this.client.get('/api/3/action/package_list')
    const packageNames = data.result
    const datasets: Dataset[] = []

    for (const packageName of packageNames) {
      logger.info(`reading package: ${packageName}`)
      const { data } = await this.client.get(`/api/3/action/package_show?id=${packageName}`)
      const packageInfo = data.result
      const resources = packageInfo.resources.map((resource: any) =>
        Resource.create(
          resource.id,
          resource.url,
          resource.name,
          resource.format,
          new Date(resource.last_modified),
          resource.description,
          resource.accessURL
        )
      )

      datasets.push(Dataset.create(
        packageInfo.id,
        packageInfo.name,
        packageInfo.title,
        [...new Set(packageInfo.tags.map((tag: any) => tag.name.toLowerCase()))] as string[],
        packageInfo.url,
        resources,
        new Date(packageInfo.metadata_created),
        new Date(packageInfo.metadata_modified),
        Contact.create(packageInfo.author, packageInfo.author_email)
      ))
    }

    return datasets
  }
}
