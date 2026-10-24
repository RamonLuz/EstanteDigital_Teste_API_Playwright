import { test, expect } from './fixtures/api.fixture';
import { makeBook, makeCustomer, makeEmployee, mutatePayload } from '../src/data/factories';
import type {
  ApiError,
  BookResponse,
  CustomerResponse,
  EmployeeResponse,
  SaleRequest,
  SaleResponse,
} from '../src/types/api';

test.describe('Vendas', () => {
  test('registra e consulta uma venda com seus relacionamentos @smoke', async ({ api }) => {
    const bookPayload = makeBook();
    const customerPayload = makeCustomer();
    const employeePayload = makeEmployee();
    let book: BookResponse | undefined;
    let customer: CustomerResponse | undefined;
    let employee: EmployeeResponse | undefined;
    let saleCreated = false;

    try {
      const bookResponse = await api.books.create(bookPayload);
      expect(bookResponse.status()).toBe(201);
      book = (await bookResponse.json()) as BookResponse;

      const customerResponse = await api.customers.create(customerPayload);
      expect(customerResponse.status()).toBe(201);
      customer = (await customerResponse.json()) as CustomerResponse;

      const employeeResponse = await api.employees.create(employeePayload);
      expect(employeeResponse.status()).toBe(201);
      employee = (await employeeResponse.json()) as EmployeeResponse;

      const salePayload: SaleRequest = {
        customerCpf: customer.cpf,
        employeeRegistrationNumber: employee.registrationNumber,
        bookTitle: book.title,
        bookAuthor: book.author,
        saleDate: new Date().toISOString().slice(0, 10),
      };
      const createResponse = await api.sales.create(salePayload);

      saleCreated = createResponse.status() === 201;
      expect(createResponse.status()).toBe(201);
      const sale = (await createResponse.json()) as SaleResponse;
      expect(sale).toMatchObject({
        saleDate: salePayload.saleDate,
        customer: { id: customer.id, cpf: customer.cpf },
        employee: {
          id: employee.id,
          registrationNumber: employee.registrationNumber,
        },
        book: { id: book.id, title: book.title, author: book.author },
      });

      const getResponse = await api.sales.get(sale.id);
      expect(getResponse.status()).toBe(200);
      expect(await getResponse.json()).toMatchObject({ id: sale.id, book: { id: book.id } });

      const listResponse = await api.sales.list();
      expect(listResponse.status()).toBe(200);
      const sales = (await listResponse.json()) as SaleResponse[];
      expect(sales.some((item) => item.id === sale.id)).toBe(true);

      const bookId = book.id;
      const persistedCustomerResponse = await api.customers.get(customer.id);
      expect(persistedCustomerResponse.status()).toBe(200);
      const persistedCustomer = (await persistedCustomerResponse.json()) as CustomerResponse;
      expect(persistedCustomer.purchases?.some((purchase) => purchase.id === bookId)).toBe(true);
    } finally {
      if (!saleCreated) {
        if (employee) {
          const employeeCleanup = await api.employees.delete(employee.id);
          expect([204, 404]).toContain(employeeCleanup.status());
        }

        if (customer) {
          const customerCleanup = await api.customers.delete(customer.id);
          expect([204, 404]).toContain(customerCleanup.status());
        }

        if (book) {
          const bookCleanup = await api.books.delete(book.id);
          expect([204, 404]).toContain(bookCleanup.status());
        }
      }
    }
  });

  test('rejeita venda para cliente inexistente', async ({ api }) => {
    const payload: SaleRequest = {
      customerCpf: `9${Math.floor(Math.random() * 9_000_000_000 + 1_000_000_000)}`,
      employeeRegistrationNumber: 999_999,
      bookTitle: 'Nonexistent QA book',
      bookAuthor: 'Nonexistent QA author',
      saleDate: new Date().toISOString().slice(0, 10),
    };

    const response = await api.sales.create(payload);

    expect(response.status()).toBe(400);
    const error = (await response.json()) as ApiError;
    expect(error).toMatchObject({ status: 400, message: 'Customer does not exist' });
  });

  const invalidFields = [
    ...(['customerCpf', 'bookTitle', 'bookAuthor'] as const).flatMap((field) =>
      (['blank', 'null', 'missing'] as const).map((mutation) => ({ field, mutation })),
    ),
    ...(['zero', 'negative', 'null', 'missing', 'wrong-type'] as const).map((mutation) => ({
      field: 'employeeRegistrationNumber',
      mutation,
    })),
    ...(['invalid-date', 'null', 'missing'] as const).map((mutation) => ({
      field: 'saleDate',
      mutation,
    })),
  ];

  for (const { field, mutation } of invalidFields) {
    test(`rejeita ${field}=${mutation} no contrato de criação @regression`, async ({ api }) => {
      const book = makeBook();
      const payload: SaleRequest = {
        customerCpf: makeCustomer().cpf,
        employeeRegistrationNumber: makeEmployee().registrationNumber,
        bookTitle: book.title,
        bookAuthor: book.author,
        saleDate: new Date().toISOString().slice(0, 10),
      };
      const response = await api.requestApi(
        'POST',
        '/sales',
        mutatePayload(payload, field, mutation),
      );

      expect(response.status()).toBe(400);
      expect(await response.json()).toMatchObject({ status: 400, field: 'Body' });
    });
  }
});
