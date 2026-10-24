import { Given, Then, When } from '@cucumber/cucumber';
import { expect } from '@playwright/test';

import { makeEmployee } from '../../../src/data/factories';
import type { EmployeeResponse } from '../../../src/types/api';
import type { ApiWorld } from '../../support/world';

Given('que tenho um funcionário válido para cadastrar', function (this: ApiWorld) {
  this.employeePayload = makeEmployee();
});

Given('que tenho um funcionário sem nome', function (this: ApiWorld) {
  this.employeePayload = makeEmployee({ name: '' });
});

When('cadastro o funcionário', async function (this: ApiWorld) {
  this.response = await this.client.employees.create(this.employeePayload!);
  if (this.response.status() === 201) {
    this.employee = (await this.response.json()) as EmployeeResponse;
  }
});

When('consulto o funcionário cadastrado', async function (this: ApiWorld) {
  this.response = await this.client.employees.get(this.employee!.id);
});

When('atualizo o status do funcionário', async function (this: ApiWorld) {
  this.response = await this.client.employees.update(this.employee!.id, {
    ...this.employeePayload!,
    status: 'INACTIVE',
  });
  if (this.response.status() === 200) {
    this.employee = (await this.response.json()) as EmployeeResponse;
  }
});

When('removo o funcionário cadastrado', async function (this: ApiWorld) {
  this.response = await this.client.employees.delete(this.employee!.id);
});

When('consulto o funcionário removido', async function (this: ApiWorld) {
  this.response = await this.client.employees.get(this.employee!.id);
});

Then('a resposta contém o funcionário criado', async function (this: ApiWorld) {
  const body = await this.response!.json();
  expect(body).toEqual(expect.objectContaining({ ...this.employeePayload! }));
  expect(body.id).toBe(this.employee!.id);
});

Then('o funcionário atualizado tem status {string}', function (this: ApiWorld, status: string) {
  expect(this.employee!.status).toBe(status);
});
