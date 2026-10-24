import 'dotenv/config';

import { request } from '@playwright/test';

import { validateApiResponse } from '../src/contracts/response-contract-validator';

const baseURL = process.env.API_BASE_URL ?? 'http://127.0.0.1:8080';

async function globalSetup(): Promise<void> {
  const api = await request.newContext({ baseURL });

  try {
    const response = await api.get('/health', { timeout: 5_000 });

    if (!response.ok()) {
      const body = await response.text();
      throw new Error(`GET ${baseURL}/health retornou ${response.status()}: ${body}`);
    }

    await validateApiResponse('GET', '/health', response);
  } finally {
    await api.dispose();
  }
}

export default globalSetup;
