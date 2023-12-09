import { XMLParser } from 'fast-xml-parser'
import { Optional } from '@datosar/src/utils/Optional'
import { Node } from '@datosar/src/utils/xml/Node'

export class XmlReader {
  static read(xml: string): XmlReader {
    const parser = new XMLParser({
      ignoreAttributes: false,
      attributesGroupName: 'attributes',
    })

    return new XmlReader(parser.parse(xml))
  }

  constructor(
    readonly document: any
  ) {}

  find(path: string): Optional<Node> {
    return new Node(this.document).find(path)
  }
}
