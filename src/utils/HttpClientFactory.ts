import axios, { AxiosInstance, CreateAxiosDefaults } from 'axios'
import https from 'https'

export class HttpClientFactory {
  static createInsecureClient(config?: CreateAxiosDefaults): AxiosInstance {
    const client = axios.create(config)

    client.defaults.httpsAgent = new https.Agent({
      rejectUnauthorized: false,
    })

    return client
  }
}
