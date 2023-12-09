import { Optional } from '@datosar/src/utils/Optional'

export class Node {
  static find(parentNode: Node, path: string): Optional<Node> {
    const parts = path.split('.')
    let node = parentNode.value

    while (parts.length) {
      const name = parts.shift() as string
      const property = Object.keys(node).find((key) => key === name || key.substring(key.indexOf(':') + 1) === name)
      if (!property) {
        break
      }
      node = node[property]
    }

    return node === parentNode.value ? undefined : new Node(node)
  }

  constructor(readonly value: any) {}

  find(path: string): Optional<Node> {
    return Node.find(this, path)
  }

  text(path?: string): Optional<string> {
    if (path === undefined) {
      return this.value['#text'] || this.value
    }

    const node = this.find(path)
    if (!node) {
      return undefined
    }
    if (Array.isArray(node.value)) {
      return undefined
    }
    return node.value['#text'] || node.value
  }

  children(): Node[] {
    if (Array.isArray(this.value)) {
      return this.value.map((node) => new Node(node))
    } else {
      return []
    }
  }

  attribute(name: string): Optional<string> {
    if (!Array.isArray(this.value) && this.value.attributes) {
      const property = Object.keys(this.value.attributes).find((key) =>
        key === name || key.substring(key.indexOf(':') + 1) === name
      )
      return this.value.attributes[property as string]
    }

    return undefined
  }
}
