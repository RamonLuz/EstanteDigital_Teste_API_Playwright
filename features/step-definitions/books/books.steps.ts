import { Given, Then, When } from '@cucumber/cucumber';
import { expect } from '@playwright/test';

import { makeBook } from '../../../src/data/factories';
import type { BookResponse } from '../../../src/types/api';
import type { ApiWorld } from '../../support/world';

Given('que tenho um livro válido para cadastrar', function (this: ApiWorld) {
  this.bookPayload = makeBook();
});

Given('que tenho um livro com preço inválido', function (this: ApiWorld) {
  this.bookPayload = makeBook({ price: 0 });
});

When('cadastro o livro', async function (this: ApiWorld) {
  this.response = await this.client.books.create(this.bookPayload!);
  if (this.response.status() === 201) {
    this.book = (await this.response.json()) as BookResponse;
  }
});

When('consulto o livro cadastrado', async function (this: ApiWorld) {
  this.response = await this.client.books.get(this.book!.id);
});

When('atualizo o livro cadastrado', async function (this: ApiWorld) {
  this.bookPayload = { ...this.bookPayload!, title: `${this.bookPayload!.title} updated` };
  this.response = await this.client.books.update(this.book!.id, this.bookPayload);
  if (this.response.status() === 200) {
    this.book = (await this.response.json()) as BookResponse;
  }
});

When('removo o livro cadastrado', async function (this: ApiWorld) {
  this.response = await this.client.books.delete(this.book!.id);
});

When('consulto o livro removido', async function (this: ApiWorld) {
  this.response = await this.client.books.get(this.book!.id);
});

Then('a resposta contém o livro criado', async function (this: ApiWorld) {
  const body = await this.response!.json();
  expect(body).toEqual(expect.objectContaining({ ...this.bookPayload! }));
  expect(body.id).toBe(this.book!.id);
});

Then('a resposta contém o livro atualizado', async function (this: ApiWorld) {
  const body = await this.response!.json();
  expect(body).toEqual(expect.objectContaining({ ...this.bookPayload! }));
  expect(body.id).toBe(this.book!.id);
});
