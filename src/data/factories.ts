import { randomInt, randomUUID } from 'node:crypto';

import type { BookRequest, CustomerRequest, EmployeeRequest } from '../types/api';

export type PayloadMutation =
  | 'blank'
  | 'whitespace'
  | 'null'
  | 'missing'
  | 'wrong-type'
  | 'zero'
  | 'negative'
  | 'invalid-date'
  | 'empty-array';

export function mutatePayload(
  payload: object,
  field: string,
  mutation: PayloadMutation,
): Record<string, unknown> {
  const result = structuredClone(payload) as Record<string, unknown>;

  if (!(field in result)) {
    throw new Error(`Campo "${field}" não encontrado no payload de teste.`);
  }

  if (mutation === 'missing') {
    delete result[field];
    return result;
  }

  const mutations: Record<Exclude<PayloadMutation, 'missing'>, unknown> = {
    blank: '',
    whitespace: '   ',
    null: null,
    'wrong-type': 'not-a-number',
    zero: 0,
    negative: -1,
    'invalid-date': 'not-a-date',
    'empty-array': [],
  };

  result[field] = mutations[mutation];
  return result;
}

export function makeBook(overrides: Partial<BookRequest> = {}): BookRequest {
  const suffix = randomUUID().slice(0, 8);

  return {
    title: `Playwright book ${suffix}`,
    author: `QA author ${suffix}`,
    price: 29.9,
    ...overrides,
  };
}

export function makeCustomer(overrides: Partial<CustomerRequest> = {}): CustomerRequest {
  return {
    name: `Playwright customer ${randomUUID().slice(0, 8)}`,
    cpf: `9${randomInt(1_000_000_000, 9_999_999_999)}`,
    status: 'ACTIVE',
    ...overrides,
  };
}

export function makeEmployee(overrides: Partial<EmployeeRequest> = {}): EmployeeRequest {
  return {
    name: `Playwright employee ${randomUUID().slice(0, 8)}`,
    cpf: `9${randomInt(1_000_000_000, 9_999_999_999)}`,
    registrationNumber: randomInt(100_000, 999_999),
    position: 'QA Seller',
    status: 'ACTIVE',
    ...overrides,
  };
}
