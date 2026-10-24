import { Given, Then, When } from '@cucumber/cucumber';
import { expect } from '@playwright/test';

import { makeBook, makeCustomer, makeEmployee } from '../../../src/data/factories';
import type {
  BookResponse,
  CustomerResponse,
  EmployeeResponse,
  SaleResponse,
} from '../../../src/types/api';
import type { ApiWorld } from '../../support/world';

Given(
  'que tenho um livro, um cliente e um funcionário cadastrados',
  async function (this: ApiWorld) {
    this.bookPayload = makeBook();
    this.customerPayload = makeCustomer();
    this.employeePayload = makeEmployee();

    const bookResponse = await this.client.books.create(this.bookPayload);
    expect(bookResponse.status()).toBe(201);
    this.book = (await bookResponse.json()) as BookResponse;

    const customerResponse = await this.client.customers.create(this.customerPayload);
    expect(customerResponse.status()).toBe(201);
    this.customer = (await customerResponse.json()) as CustomerResponse;

    const employeeResponse = await this.client.employees.create(this.employeePayload);
    expect(employeeResponse.status()).toBe(201);
    this.employee = (await employeeResponse.json()) as EmployeeResponse;
  },
);

When('registro a venda desses recursos', async function (this: ApiWorld) {
  this.salePayload = {
    customerCpf: this.customer!.cpf,
    employeeRegistrationNumber: this.employee!.registrationNumber,
    bookTitle: this.book!.title,
    bookAuthor: this.book!.author,
    saleDate: new Date().toISOString().slice(0, 10),
  };
  this.response = await this.client.sales.create(this.salePayload);
  if (this.response.status() === 201) {
    this.sale = (await this.response.json()) as SaleResponse;
    this.saleCreated = true;
  }
});

When('consulto a venda cadastrada', async function (this: ApiWorld) {
  this.response = await this.client.sales.get(this.sale!.id);
});

Then('a resposta contém a venda e seus relacionamentos', function (this: ApiWorld) {
  expect(this.sale).toMatchObject({
    customer: { id: this.customer!.id, cpf: this.customer!.cpf },
    employee: {
      id: this.employee!.id,
      registrationNumber: this.employee!.registrationNumber,
    },
    book: { id: this.book!.id, title: this.book!.title },
    saleDate: this.salePayload!.saleDate,
  });
});

Then('a resposta contém a venda consultada', async function (this: ApiWorld) {
  const persistedSale = (await this.response!.json()) as SaleResponse;
  expect(persistedSale).toMatchObject({
    id: this.sale!.id,
    customer: { id: this.customer!.id },
    employee: { id: this.employee!.id },
    book: { id: this.book!.id },
  });
});

Then('as compras do cliente contêm o livro vendido', async function (this: ApiWorld) {
  const response = await this.client.customers.get(this.customer!.id);
  expect(response.status()).toBe(200);
  const customer = (await response.json()) as CustomerResponse;
  expect(customer.purchases?.some((purchase) => purchase.id === this.book!.id)).toBe(true);
});

Given('que preparo uma venda para um cliente inexistente', function (this: ApiWorld) {
  this.salePayload = {
    customerCpf: `9${Math.floor(Math.random() * 9_000_000_000 + 1_000_000_000)}`,
    employeeRegistrationNumber: 999_999,
    bookTitle: 'Nonexistent QA book',
    bookAuthor: 'Nonexistent QA author',
    saleDate: new Date().toISOString().slice(0, 10),
  };
});

When('registro a venda', async function (this: ApiWorld) {
  this.response = await this.client.sales.create(this.salePayload!);
});
