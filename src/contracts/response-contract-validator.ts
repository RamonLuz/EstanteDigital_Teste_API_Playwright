import Ajv, { type AnySchema, type ErrorObject } from 'ajv';
import addFormats from 'ajv-formats';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import type { APIResponse } from '@playwright/test';

const schemaRoot = join(__dirname, 'schemas');
const schemaFiles = [
  'books/book.schema.json',
  'books/book-list.schema.json',
  'customers/customer.schema.json',
  'customers/customer-list.schema.json',
  'employees/employee.schema.json',
  'employees/employee-list.schema.json',
  'sales/sale.schema.json',
  'sales/sale-list.schema.json',
  'common/api-error.schema.json',
  'health/health.schema.json',
];

const resourceSchemas: Record<string, { list: string; item: string }> = {
  books: { list: 'books/book-list', item: 'books/book' },
  customers: { list: 'customers/customer-list', item: 'customers/customer' },
  employees: { list: 'employees/employee-list', item: 'employees/employee' },
  sales: { list: 'sales/sale-list', item: 'sales/sale' },
};

const validator = new Ajv({ allErrors: true, strict: true });
addFormats(validator);

for (const file of schemaFiles) {
  const schema = JSON.parse(readFileSync(join(schemaRoot, file), 'utf-8')) as AnySchema;
  validator.addSchema(schema);
}

const emptyResponseStatuses = new Set([204, 404]);

class ResponseContractError extends Error {
  constructor(method: string, path: string, status: number, message: string) {
    super(`Contrato de resposta inválido para ${method} ${path} (HTTP ${status}): ${message}`);
    this.name = 'ResponseContractError';
  }
}

export async function validateApiResponse(
  method: string,
  path: string,
  response: APIResponse,
): Promise<void> {
  const status = response.status();

  if (emptyResponseStatuses.has(status)) {
    const body = await response.text();
    if (body.trim()) {
      throw new ResponseContractError(method, path, status, 'era esperado um corpo vazio.');
    }
    return;
  }

  const schemaId = resolveSchema(method, path, status);
  let body: unknown;
  try {
    body = await response.json();
  } catch (error) {
    throw new ResponseContractError(
      method,
      path,
      status,
      `a resposta não contém JSON válido (${error instanceof Error ? error.message : String(error)}).`,
    );
  }

  const validate = validator.getSchema(schemaId);
  if (!validate) {
    throw new Error(`O schema ${schemaId} não foi carregado para ${method} ${path}.`);
  }

  if (!validate(body)) {
    throw new ResponseContractError(method, path, status, formatErrors(validate.errors));
  }
}

function resolveSchema(method: string, path: string, status: number): string {
  const normalizedMethod = method.toUpperCase();
  const segments = path.split('?')[0].split('/').filter(Boolean);

  if (status === 400) {
    return 'https://estantedigital.test/schemas/common/api-error.schema.json';
  }

  const isHealthCheck =
    segments.length === 1 &&
    segments[0] === 'health' &&
    normalizedMethod === 'GET' &&
    status === 200;
  if (isHealthCheck) {
    return 'https://estantedigital.test/schemas/health/health.schema.json';
  }

  if (segments.length === 0 || segments.length > 2) {
    throw unsupportedResponse(method, path, status);
  }

  const schemas = resourceSchemas[segments[0]];
  if (!schemas) {
    throw unsupportedResponse(method, path, status);
  }

  const isCollection = segments.length === 1;
  let schemaName: string | undefined;

  if (normalizedMethod === 'GET' && status === 200) {
    schemaName = isCollection ? schemas.list : schemas.item;
  } else if (normalizedMethod === 'POST' && isCollection && status === 201) {
    schemaName = schemas.item;
  } else if (normalizedMethod === 'PUT' && !isCollection && status === 200) {
    schemaName = schemas.item;
  }

  if (!schemaName) {
    throw unsupportedResponse(method, path, status);
  }

  return `https://estantedigital.test/schemas/${schemaName}.schema.json`;
}

function unsupportedResponse(method: string, path: string, status: number): Error {
  return new Error(
    `Nenhum contrato de resposta configurado para ${method} ${path} com status ${status}.`,
  );
}

function formatErrors(errors: ErrorObject[] | null | undefined): string {
  if (!errors?.length) {
    return 'a resposta não corresponde ao JSON Schema esperado.';
  }

  return errors
    .map((error) => {
      const location = error.instancePath || '/';
      return `${location} ${error.message ?? 'violou o schema'}`;
    })
    .join('; ');
}
