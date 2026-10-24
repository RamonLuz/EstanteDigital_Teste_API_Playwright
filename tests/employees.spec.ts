import { test, expect } from './fixtures/api.fixture';
import { makeEmployee, mutatePayload } from '../src/data/factories';
import type { PayloadMutation } from '../src/data/factories';
import type { ApiError, EmployeeResponse } from '../src/types/api';

test.describe('Funcionários', () => {
  test('cria, consulta, atualiza status e remove um funcionário @smoke', async ({ api }) => {
    const payload = makeEmployee();
    const createResponse = await api.employees.create(payload);
    const created = (await createResponse.json()) as EmployeeResponse;
    let deleted = false;

    try {
      expect(createResponse.status()).toBe(201);
      expect(created).toEqual(expect.objectContaining({ ...payload }));

      const getResponse = await api.employees.get(created.id);
      expect(getResponse.status()).toBe(200);
      expect(await getResponse.json()).toMatchObject({ id: created.id, ...payload });

      const listResponse = await api.employees.list();
      expect(listResponse.status()).toBe(200);
      const employees = (await listResponse.json()) as EmployeeResponse[];
      expect(employees.some((employee) => employee.id === created.id)).toBe(true);

      const updateResponse = await api.employees.update(created.id, {
        ...payload,
        status: 'INACTIVE',
      });
      expect(updateResponse.status()).toBe(200);
      expect(await updateResponse.json()).toMatchObject({
        id: created.id,
        name: payload.name,
        status: 'INACTIVE',
      });

      const persistedResponse = await api.employees.get(created.id);
      expect(persistedResponse.status()).toBe(200);
      expect(await persistedResponse.json()).toMatchObject({ status: 'INACTIVE' });

      const deleteResponse = await api.employees.delete(created.id);
      expect(deleteResponse.status()).toBe(204);
      deleted = true;

      expect((await api.employees.get(created.id)).status()).toBe(404);
    } finally {
      if (!deleted && Number.isSafeInteger(created.id)) {
        const cleanup = await api.employees.delete(created.id);
        expect([204, 404]).toContain(cleanup.status());
      }
    }
  });

  test('rejeita campos obrigatórios ausentes', async ({ api }) => {
    const response = await api.employees.create(makeEmployee({ name: '', position: '' }));

    expect(response.status()).toBe(400);
    const error = (await response.json()) as ApiError;
    expect(error).toMatchObject({ status: 400, field: 'Body' });
  });

  const invalidFields: Array<{ field: string; mutation: PayloadMutation }> = (
    ['name', 'position', 'status'] as const
  ).flatMap((field) =>
    (['blank', 'whitespace', 'null', 'missing'] as const).map((mutation) => ({
      field,
      mutation,
    })),
  );

  invalidFields.push(
    ...(['zero', 'negative', 'null', 'missing', 'wrong-type'] as const).map((mutation) => ({
      field: 'registrationNumber' as const,
      mutation,
    })),
  );

  for (const { field, mutation } of invalidFields) {
    test(`rejeita ${field}=${mutation} no contrato de criação @regression`, async ({ api }) => {
      const payload = mutatePayload(makeEmployee(), field, mutation);
      const response = await api.requestApi('POST', '/employees', payload);

      expect(response.status()).toBe(400);
      expect(await response.json()).toMatchObject({ status: 400, field: 'Body' });
    });
  }
});
