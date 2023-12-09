import { Catalog } from '@datosar/src/domain/ckan/model/Catalog'
import { ImportItem } from '@datosar/src/domain/ckan/model/ImportItem'
import { Resource } from '@datosar/src/domain/ckan/model/Resource'
import { Optional } from '@datosar/src/utils/Optional'
import { Dataset } from '@datosar/src/domain/ckan/model/Dataset'

export class ImportContext {
  static create(catalog: Catalog, items: ImportItem[]): ImportContext {
    return new ImportContext(catalog, items)
  }

  static restore(context: any): ImportContext {
    return new ImportContext(Catalog.restore(context.catalog), context.items.map(ImportItem.restore))
  }

  constructor(
    /** Catalog used in this import process. */
    readonly catalog: Catalog,
    /** Items to import. */
    readonly items: ImportItem[]
  ) {}

  findResource(id: string): Optional<Resource> {
    return this.catalog.datasets.flatMap((dataset) => dataset.resources).find((resource) => resource.id === id)
  }

  findDatasetByResource(resourceId: string): Optional<Dataset> {
    return this.catalog.datasets.find((dataset) => dataset.resources.some((resource) => resource.id === resourceId))
  }

  updateItem(processedItem: ImportItem): ImportContext {
    const index = this.items.findIndex((item) => item.resourceId === processedItem.resourceId)
    if (index === -1) {
      throw new Error(`item does not belong to this process: resourceId=${processedItem.resourceId}`)
    }
    this.items[index] = processedItem
    return this
  }
}
