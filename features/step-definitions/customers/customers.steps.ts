import { Given, Then, When } from '@cucumber/cucumber';
import { expect } from '@playwright/test';

import { makeCustomer } from '../../../src/data/factories';
import type { CustomerResponse } from '../../../src/types/api';
import type { ApiWorld } from '../../support/world';

Given('que tenho um cliente válido para cadastrar', function (this: ApiWorld) {
  this.customerPayload = makeCustomer();
});

Given('que tenho um cliente com CPF inválido', function (this: ApiWorld) {
  this.customerPayload = makeCustomer({ cpf: '123' });
});

When('cadastro o cliente', async function (this: ApiWorld) {
  this.response = await this.client.customers.create(this.customerPayload!);
  if (this.response.status() === 201) {
    this.customer = (await this.response.json()) as CustomerResponse;
  }
});

When('consulto o cliente cadastrado', async function (this: ApiWorld) {
  this.response = await this.client.customers.get(this.customer!.id);
});

When('atualizo o status do cliente', async function (this: ApiWorld) {
  this.response = await this.client.customers.update(this.customer!.id, {
    ...this.customerPayload!,
    status: 'INACTIVE',
  });
  if (this.response.status() === 200) {
    this.customer = (await this.response.json()) as CustomerResponse;
  }
});

When('removo o cliente cadastrado', async function (this: ApiWorld) {
  this.response = await this.client.customers.delete(this.customer!.id);
});

When('consulto o cliente removido', async function (this: ApiWorld) {
  this.response = await this.client.customers.get(this.customer!.id);
});

Then('a resposta contém o cliente criado', async function (this: ApiWorld) {
  const body = await this.response!.json();
  expect(body).toEqual(expect.objectContaining({ ...this.customerPayload! }));
  expect(body.id).toBe(this.customer!.id);
});

Then('o cliente atualizado tem status {string}', function (this: ApiWorld, status: string) {
  expect(this.customer!.status).toBe(status);
});
