import { Dataset } from '@datosar/src/domain/ckan/model/Dataset'
import { Organization } from '@datosar/src/domain/ckan/model/Organization'
import { Entity } from '@datosar/src/utils/types/EntityClass'
import { IdManager } from '@datosar/src/utils/IdManager'

@Entity<string>()
export class Catalog {
  static create(datasets: Dataset[], organizations: Organization[], updatedAt: Date): Catalog {
    return new Catalog(IdManager.randomId(), datasets, organizations, updatedAt)
  }

  static restore(catalog: any): Catalog {
    return new Catalog(
      catalog.id,
      catalog.datasets.map(Dataset.restore),
      catalog.organizations.map(Organization.restore),
      new Date(catalog.updatedAt)
    )
  }

  constructor(
    /** Unique id for this entity. */
    readonly id: string,
    /** Datasets in this catalog. */
    readonly datasets: Dataset[],
    /** List of all organizations that publish datasets in this catalog. */
    readonly organizations: Organization[],
    /** Last modification date. */
    readonly updatedAt: Date
  ) {}

  copy(instance: Catalog): Catalog {
    return new Catalog(instance.id, instance.datasets, instance.organizations, instance.updatedAt)
  }
}
