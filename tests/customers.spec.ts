import { test, expect } from './fixtures/api.fixture';
import { makeCustomer, mutatePayload } from '../src/data/factories';
import type { ApiError, CustomerResponse } from '../src/types/api';

test.describe('Clientes', () => {
  test('cria, consulta, atualiza status e remove um cliente @smoke', async ({ api }) => {
    const payload = makeCustomer();
    const createResponse = await api.customers.create(payload);
    const created = (await createResponse.json()) as CustomerResponse;
    let deleted = false;

    try {
      expect(createResponse.status()).toBe(201);
      expect(created).toEqual(expect.objectContaining({ ...payload }));

      const getResponse = await api.customers.get(created.id);
      expect(getResponse.status()).toBe(200);
      expect(await getResponse.json()).toMatchObject({ id: created.id, ...payload });

      const listResponse = await api.customers.list();
      expect(listResponse.status()).toBe(200);
      const customers = (await listResponse.json()) as CustomerResponse[];
      expect(customers.some((customer) => customer.id === created.id)).toBe(true);

      const updateResponse = await api.customers.update(created.id, {
        ...payload,
        status: 'INACTIVE',
      });
      expect(updateResponse.status()).toBe(200);
      expect(await updateResponse.json()).toMatchObject({
        id: created.id,
        name: payload.name,
        status: 'INACTIVE',
      });

      const persistedResponse = await api.customers.get(created.id);
      expect(persistedResponse.status()).toBe(200);
      expect(await persistedResponse.json()).toMatchObject({ status: 'INACTIVE' });

      const deleteResponse = await api.customers.delete(created.id);
      expect(deleteResponse.status()).toBe(204);
      deleted = true;

      expect((await api.customers.get(created.id)).status()).toBe(404);
    } finally {
      if (!deleted && Number.isSafeInteger(created.id)) {
        const cleanup = await api.customers.delete(created.id);
        expect([204, 404]).toContain(cleanup.status());
      }
    }
  });

  test('rejeita CPF fora do formato mínimo esperado', async ({ api }) => {
    const response = await api.customers.create(makeCustomer({ cpf: '123' }));

    expect(response.status()).toBe(400);
    const error = (await response.json()) as ApiError;
    expect(error).toMatchObject({ status: 400, message: 'CPF must have 11 digits' });
  });

  const invalidFields = (['name', 'cpf', 'status'] as const).flatMap((field) =>
    (['blank', 'whitespace', 'null', 'missing'] as const).map((mutation) => ({
      field,
      mutation,
    })),
  );

  for (const { field, mutation } of invalidFields) {
    test(`rejeita ${field}=${mutation} no contrato de criação @regression`, async ({ api }) => {
      const payload = mutatePayload(makeCustomer(), field, mutation);
      const response = await api.requestApi('POST', '/customers', payload);

      expect(response.status()).toBe(400);
      expect(await response.json()).toMatchObject({ status: 400, field: 'Body' });
    });
  }

  for (const mutation of ['empty-array', 'null', 'missing'] as const) {
    test(`aceita purchases=${mutation} @regression`, async ({ api }) => {
      const payload = mutatePayload({ ...makeCustomer(), purchases: [] }, 'purchases', mutation);
      const response = await api.requestApi('POST', '/customers', payload);
      expect(response.status()).toBe(201);

      const customer = (await response.json()) as CustomerResponse;
      const deleted = await api.customers.delete(customer.id);
      expect(deleted.status()).toBe(204);
    });
  }

  test('rejeita purchases com formato inválido @regression', async ({ api }) => {
    const payload = mutatePayload({ ...makeCustomer(), purchases: [] }, 'purchases', 'wrong-type');
    const response = await api.requestApi('POST', '/customers', payload);

    expect(response.status()).toBe(400);
    expect(await response.json()).toMatchObject({ status: 400, field: 'Body' });
  });
});
