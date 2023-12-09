import { Catalog } from '@datosar/src/domain/ckan/model/Catalog'
import { existsSync } from 'fs'
import fs from 'node:fs/promises'
import { XmlReader } from '@datosar/src/utils/xml/XmlReader'
import { Node } from '@datosar/src/utils/xml/Node'
import { Resource } from '@datosar/src/domain/ckan/model/Resource'
import { sha1 } from '@datosar/src/utils/HashUtils'
import { Organization } from '@datosar/src/domain/ckan/model/Organization'
import { Dataset } from '@datosar/src/domain/ckan/model/Dataset'
import { Contact } from '@datosar/src/domain/ckan/model/Contact'
import axios, { AxiosInstance } from 'axios'
import { CkanClient } from '@datosar/src/domain/ckan/CkanClient'
import { createLogger } from '@datosar/src/utils/log'
import { CkanConfig } from '@datosar/src/domain/ckan/CkanConfig'
import path from 'path'
import https from 'https'

const logger = createLogger('XmlCatalogReader')

export class CatalogReader {
  /** HTTP client. */
  private readonly client: AxiosInstance

  constructor() {
    this.client = axios.create()
    this.client.defaults.httpsAgent = new https.Agent({
      rejectUnauthorized: false,
    })
  }

  async fromConfig(config: CkanConfig): Promise<Catalog> {
    logger.info(`resolving catalog using config: cache=${config.cache},update=${config.updateCatalog}`)
    const catalogFile = path.join(config.outputDir, 'catalog.json')

    if (config.cache && existsSync(catalogFile) && !config.updateCatalog) {
      const jsonCatalog = (await fs.readFile(catalogFile)).toString()
      return Catalog.restore(JSON.parse(jsonCatalog))
    }

    let catalog: Catalog
    if (config.catalogFile && existsSync(config.catalogFile)) {
      catalog = await this.fromFile(config.catalogFile)
    } else if (config.catalogUrl) {
      catalog = await this.fromUrl(config.catalogUrl)
    } else {
      catalog = await this.fromApi(config.apiUrl)
    }

    if (config.cache) {
      await fs.mkdir(config.outputDir, { recursive: true })
      await fs.writeFile(catalogFile, JSON.stringify(catalog, null, 2))
    }

    return catalog
  }

  async fromUrl(url: string): Promise<Catalog> {
    logger.info(`loading catalog from url: ${url}`)
    const catalogData = (await this.client.get(url)).data
    return this.fromXml(catalogData)
  }

  async fromFile(path: string): Promise<Catalog> {
    logger.info(`loading catalog from file: ${path}`)
    const catalogData = (await fs.readFile(path)).toString()
    return this.fromXml(catalogData)
  }

  async fromApi(apiUrl: string): Promise<Catalog> {
    logger.info(`loading catalog from API: apiUrl=${apiUrl}`)
    const ckanClient = new CkanClient(apiUrl)
    const datasets = await ckanClient.listDatasets()
    return Catalog.create(datasets, [], new Date())
  }

  private fromXml(catalogData: string): Catalog {
    logger.info('reading XML catalog')
    const reader = XmlReader.read(catalogData)
    const distributions =
      reader
        .find('RDF.Distribution')
        ?.children()
        .map((distribution: Node) => {
          const landingUrl = distribution.attribute('about')
          if (!landingUrl) {
            throw new Error('cannot resolve landingUrl for resource')
          }

          return Resource.create(
            sha1(landingUrl),
            distribution.find('accessURL')?.attribute('resource')!!,
            distribution.text('title')!,
            distribution.text('format')!,
            new Date(),
            distribution.text('description')!,
            landingUrl
          )
        }) ?? []
    const organizations =
      reader
        .find('RDF.Organization')
        ?.children()
        .map((organization: Node) =>
          Organization.create(organization.text('name')!!, organization.attribute('about')!!)
        ) ?? []
    const datasets =
      reader
        .find('RDF.Catalog.dataset')
        ?.children()
        .map((dataset) => {
          const node = dataset.find('Dataset') as Node
          const contactPoint = node.find('contactPoint')
          const distributionNode = node.find('distribution')
          let distributionsRefs: Node[] = []

          if (distributionNode && Array.isArray(distributionNode.value)) {
            distributionsRefs = distributionNode.children()
          } else if (distributionNode) {
            distributionsRefs = [distributionNode]
          }

          return Dataset.create(
            node.text('identifier')!!,
            node.text('identifier')!!,
            node.text('title')!!,
            (node
              .find('keyword')
              ?.children()
              .map((keyword) => keyword.text()) as string[]) ?? [],
            node.find('landingPage')?.attribute('resource')!!,
            distributionsRefs
              .map((distributionRef) => {
                const landingUrl = distributionRef.attribute('resource')
                if (!landingUrl) {
                  throw new Error('cannot resolve landingUrl for resource')
                }
                return distributions.find((distribution: Resource) => distribution.id === sha1(landingUrl))
              })
              .flat() as Resource[],
            new Date(node.text('issued')!!),
            new Date(node.text('modified')!!),
            contactPoint
              ? Contact.create(
                contactPoint.find('Organization')?.text('fn')!!,
                contactPoint.find('Organization')?.text('hasEmail')
              )
              : undefined
          )
        }) ?? []
    const updatedAt = new Date(reader.find('RDF.Catalog.modified')?.text()!!)
    return Catalog.create(datasets, organizations, updatedAt)
  }
}
