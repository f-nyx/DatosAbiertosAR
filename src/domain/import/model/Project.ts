import { Entity } from '@datosar/src/utils/types/EntityClass'
import { IdManager } from '@datosar/src/utils/IdManager'

@Entity<string>()
export class Project {
  static create(name: string, outputDir: string): Project {
    return new Project(IdManager.randomId(), name, outputDir, new Set())
  }

  static restore(project: any): Project {
    return new Project(project.id, project.name, project.outputDir, new Set())
  }

  constructor(
    readonly id: string,
    /** Project's name. */
    readonly name: string,
    readonly outputDir: string,
    readonly resourcesIds: Set<string>
  ) {}

  addResource(resourceId: string): Project {
    this.resourcesIds.add(resourceId)
    return this
  }

  hasResource(resourceId: string): boolean {
    return this.resourcesIds.has(resourceId)
  }

  copy(instance: Project): Project {
    return new Project(instance.id, instance.name, instance.outputDir, instance.resourcesIds)
  }
}
