import { World, setWorldConstructor } from '@cucumber/cucumber';
import type { APIRequestContext, APIResponse } from '@playwright/test';

import type { EstanteApi } from '../../src/clients/estante-api';
import type {
  BookRequest,
  BookResponse,
  CustomerRequest,
  CustomerResponse,
  EmployeeRequest,
  EmployeeResponse,
  SaleRequest,
  SaleResponse,
} from '../../src/types/api';

export class ApiWorld extends World {
  requestContext?: APIRequestContext;
  api?: EstanteApi;
  response?: APIResponse;
  bookPayload?: BookRequest;
  book?: BookResponse;
  customerPayload?: CustomerRequest;
  customer?: CustomerResponse;
  employeePayload?: EmployeeRequest;
  employee?: EmployeeResponse;
  salePayload?: SaleRequest;
  sale?: SaleResponse;
  saleCreated = false;

  get client(): EstanteApi {
    if (!this.api) {
      throw new Error('O cliente da API ainda não foi inicializado para este cenário.');
    }

    return this.api;
  }
}

setWorldConstructor(ApiWorld);
