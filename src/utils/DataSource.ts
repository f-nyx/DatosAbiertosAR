import { Database } from 'sqlite'

export class DataSource {
  constructor(private readonly db: Database) {}

  async exec(query: string, params?: any): Promise<any> {
    return await this.db.exec(query, params)
  }

  async write(query: string, params?: any): Promise<any> {
    return await this.db.run(query, params)
  }

  async find(query: string, params?: any): Promise<any> {
    return await this.db.all(query, params)
  }

  async close() {
    await this.db.close()
  }
}
