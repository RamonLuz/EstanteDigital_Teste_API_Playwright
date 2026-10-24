import { test, expect } from './fixtures/api.fixture';
import { makeBook, mutatePayload } from '../src/data/factories';
import type { ApiError, BookResponse } from '../src/types/api';

test.describe('Livros', () => {
  test('cria, consulta, atualiza e remove um livro @smoke', async ({ api }) => {
    const payload = makeBook();
    const createResponse = await api.books.create(payload);
    const created = (await createResponse.json()) as BookResponse;
    let deleted = false;

    try {
      expect(createResponse.status()).toBe(201);
      expect(created).toEqual(expect.objectContaining({ ...payload }));
      expect(created.id).toEqual(expect.any(Number));

      const getResponse = await api.books.get(created.id);
      expect(getResponse.status()).toBe(200);
      expect(await getResponse.json()).toMatchObject({ id: created.id, ...payload });

      const listResponse = await api.books.list();
      expect(listResponse.status()).toBe(200);
      const books = (await listResponse.json()) as BookResponse[];
      expect(books.some((book) => book.id === created.id)).toBe(true);

      const updatedPayload = { ...payload, title: `${payload.title} updated`, price: 35.5 };
      const updateResponse = await api.books.update(created.id, updatedPayload);
      expect(updateResponse.status()).toBe(200);
      expect(await updateResponse.json()).toMatchObject(updatedPayload);

      const persistedResponse = await api.books.get(created.id);
      expect(persistedResponse.status()).toBe(200);
      expect(await persistedResponse.json()).toMatchObject(updatedPayload);

      const deleteResponse = await api.books.delete(created.id);
      expect(deleteResponse.status()).toBe(204);
      deleted = true;

      expect((await api.books.get(created.id)).status()).toBe(404);
    } finally {
      if (!deleted && Number.isSafeInteger(created.id)) {
        const cleanup = await api.books.delete(created.id);
        expect([204, 404]).toContain(cleanup.status());
      }
    }
  });

  test('rejeita preço inválido com erro de validação', async ({ api }) => {
    const response = await api.books.create(makeBook({ price: 0 }));

    expect(response.status()).toBe(400);
    const error = (await response.json()) as ApiError;
    expect(error).toMatchObject({ status: 400, field: 'Body' });
  });

  const invalidFields = [
    ...(['title', 'author'] as const).flatMap((field) =>
      (['blank', 'whitespace', 'null', 'missing'] as const).map((mutation) => ({
        field,
        mutation,
      })),
    ),
    ...(['zero', 'negative', 'null', 'missing', 'wrong-type'] as const).map((mutation) => ({
      field: 'price',
      mutation,
    })),
  ];

  for (const { field, mutation } of invalidFields) {
    test(`rejeita ${field}=${mutation} no contrato de criação @regression`, async ({ api }) => {
      const payload = mutatePayload(makeBook(), field, mutation);
      const response = await api.requestApi('POST', '/books', payload);

      expect(response.status()).toBe(400);
      const error = (await response.json()) as ApiError;
      expect(error).toMatchObject({ status: 400, field: 'Body' });
    });
  }

  test('rejeita criação sem corpo e valida o contrato de erro @regression', async ({ api }) => {
    const response = await api.requestApi('POST', '/books');

    expect(response.status()).toBe(400);
    expect(await response.json()).toMatchObject({
      status: 400,
      message: 'Request body is required',
      field: 'Body',
    });
  });

  test('respostas 404 não contêm corpo e IDs inválidos retornam erro padronizado @regression', async ({
    api,
  }) => {
    const missing = await api.books.get(999_999_999);
    expect(missing.status()).toBe(404);
    expect(await missing.text()).toBe('');

    const malformed = await api.requestApi('GET', '/books/not-numeric');
    expect(malformed.status()).toBe(400);
    expect(await malformed.json()).toMatchObject({
      status: 400,
      message: 'ID must be numeric',
      field: 'ID',
    });
  });
});
