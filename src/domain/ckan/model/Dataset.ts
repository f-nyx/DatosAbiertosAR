import { Contact } from '@datosar/src/domain/ckan/model/Contact'
import { Resource } from '@datosar/src/domain/ckan/model/Resource'

export class Dataset {
  static create(
    id: string,
    name: string,
    title: string,
    keywords: string[],
    landingPage: string,
    resources: Resource[],
    createdAt: Date,
    updatedAt: Date,
    contact?: Contact
  ): Dataset {
    return new Dataset(id, name, title, keywords, landingPage, resources, createdAt, updatedAt, contact)
  }

  static restore(dataset: any): Dataset {
    return new Dataset(
      dataset.id,
      dataset.name,
      dataset.title,
      dataset.keywords,
      dataset.landingPage,
      dataset.resources.map(Resource.restore),
      new Date(dataset.createdAt),
      new Date(dataset.updatedAt),
      dataset.contact ? Contact.restore(dataset.contact) : undefined
    )
  }

  constructor(
    readonly id: string,
    readonly name: string,
    readonly title: string,
    readonly keywords: string[],
    readonly landingPage: string,
    readonly resources: Resource[],
    readonly createdAt: Date,
    readonly updatedAt: Date,
    readonly contact?: Contact
  ) {}
}
