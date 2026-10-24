import { test as base, expect } from '@playwright/test';

import { EstanteApi } from '../../src/clients/estante-api';

interface ApiFixtures {
  api: EstanteApi;
}

export const test = base.extend<ApiFixtures>({
  api: async ({ request }, use) => {
    await use(new EstanteApi(request));
  },
});

export { expect };
