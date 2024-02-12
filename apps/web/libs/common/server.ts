import type { BaseRequest } from '@divine-bridge/common';
import axios, { AxiosInstance } from 'axios';

import { publicEnv } from './public-env';

class ServerAPI {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: `${publicEnv.NEXT_PUBLIC_WEB_URL}/server`,
      withCredentials: true,
    });
  }

  async get<P extends BaseRequest>(url: string, params: P['query'] = {}) {
    return await this.api.get<P['res']>(url, {
      params,
    });
  }

  async post<P extends BaseRequest>(url: string, payload: P['body'], params: P['query'] = {}) {
    return await this.api.post<P['res']>(url, payload, {
      params,
    });
  }

  async put<P extends BaseRequest>(url: string, payload: P['body'], params: P['query'] = {}) {
    return await this.api.put<P['res']>(url, payload, {
      params,
      withCredentials: true,
    });
  }

  async delete<P extends BaseRequest>(url: string, params: P['query'] = {}) {
    return await this.api.delete<P['res']>(url, {
      params,
    });
  }

  async patch<P extends BaseRequest>(url: string, payload: P['body'], params: P['query'] = {}) {
    return await this.api.patch<P['res']>(url, payload, {
      params,
    });
  }
}

export const serverApi = new ServerAPI();
