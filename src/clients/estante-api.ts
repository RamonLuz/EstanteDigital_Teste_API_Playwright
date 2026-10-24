import type { APIRequestContext, APIResponse } from '@playwright/test';

import { validateApiResponse } from '../contracts/response-contract-validator';
import type { BookRequest, CustomerRequest, EmployeeRequest, SaleRequest } from '../types/api';

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE';

export class EstanteApi {
  constructor(private readonly request: APIRequestContext) {}

  async requestApi(method: HttpMethod, path: string, body?: unknown): Promise<APIResponse> {
    const response = await this.request.fetch(path, {
      method,
      ...(body === undefined ? {} : { data: body }),
    });
    await validateApiResponse(method, path, response);
    return response;
  }

  readonly books = {
    list: (): Promise<APIResponse> => this.requestApi('GET', '/books'),
    get: (id: number): Promise<APIResponse> => this.requestApi('GET', `/books/${id}`),
    create: (body: BookRequest): Promise<APIResponse> => this.requestApi('POST', '/books', body),
    update: (id: number, body: BookRequest): Promise<APIResponse> =>
      this.requestApi('PUT', `/books/${id}`, body),
    delete: (id: number): Promise<APIResponse> => this.requestApi('DELETE', `/books/${id}`),
  };

  readonly customers = {
    list: (): Promise<APIResponse> => this.requestApi('GET', '/customers'),
    get: (id: number): Promise<APIResponse> => this.requestApi('GET', `/customers/${id}`),
    create: (body: CustomerRequest): Promise<APIResponse> =>
      this.requestApi('POST', '/customers', body),
    update: (id: number, body: CustomerRequest): Promise<APIResponse> =>
      this.requestApi('PUT', `/customers/${id}`, body),
    delete: (id: number): Promise<APIResponse> => this.requestApi('DELETE', `/customers/${id}`),
  };

  readonly employees = {
    list: (): Promise<APIResponse> => this.requestApi('GET', '/employees'),
    get: (id: number): Promise<APIResponse> => this.requestApi('GET', `/employees/${id}`),
    create: (body: EmployeeRequest): Promise<APIResponse> =>
      this.requestApi('POST', '/employees', body),
    update: (id: number, body: EmployeeRequest): Promise<APIResponse> =>
      this.requestApi('PUT', `/employees/${id}`, body),
    delete: (id: number): Promise<APIResponse> => this.requestApi('DELETE', `/employees/${id}`),
  };

  readonly sales = {
    list: (): Promise<APIResponse> => this.requestApi('GET', '/sales'),
    get: (id: number): Promise<APIResponse> => this.requestApi('GET', `/sales/${id}`),
    create: (body: SaleRequest): Promise<APIResponse> => this.requestApi('POST', '/sales', body),
  };
}
