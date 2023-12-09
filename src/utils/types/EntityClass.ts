import { DataClass } from '@datosar/src/utils/types/DataClass'

export interface EntityClass<T, K> extends DataClass<T> {
  /** Unique id for this entity. */
  get id(): K
}

export function Entity<K>() {
  return <U extends {
    new (...args: any[]): EntityClass<any, K>
    restore(instance: any): any
  }>(constructor: U) => {
    constructor
  }
}
