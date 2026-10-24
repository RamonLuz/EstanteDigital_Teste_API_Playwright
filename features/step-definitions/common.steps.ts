import { Then } from '@cucumber/cucumber';
import { expect } from '@playwright/test';

import type { ApiWorld } from '../support/world';

Then('a API responde com status {int}', function (this: ApiWorld, status: number) {
  expect(getResponse(this).status()).toBe(status);
});

Then('a resposta de erro informa {string}', async function (this: ApiWorld, message: string) {
  const error = await getResponse(this).json();
  expect(error.message).toBe(message);
});

Then('a resposta de erro identifica o corpo da requisição', async function (this: ApiWorld) {
  const error = await getResponse(this).json();
  expect(error).toMatchObject({ status: 400, field: 'Body' });
});

function getResponse(world: ApiWorld) {
  if (!world.response) {
    throw new Error('Nenhuma resposta foi recebida da API neste cenário.');
  }

  return world.response;
}
