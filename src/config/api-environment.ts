import 'dotenv/config';

import { resolve } from 'node:path';

export const apiBaseURL = process.env.API_BASE_URL ?? 'http://127.0.0.1:8080';
export const apiUrl = new URL(apiBaseURL);
export const isLoopbackApi = ['127.0.0.1', 'localhost', '[::1]'].includes(apiUrl.hostname);
export const startsApiServer = process.env.API_START_SERVER !== 'false';
export const apiProjectPath = resolve(
  process.env.API_PROJECT_PATH ?? resolve(process.cwd(), '..', '..', 'APIs'),
);

export function validateApiEnvironment(): void {
  if (!['http:', 'https:'].includes(apiUrl.protocol)) {
    throw new Error(`API_BASE_URL precisa usar HTTP ou HTTPS: ${apiBaseURL}`);
  }

  if (apiUrl.username || apiUrl.password || apiUrl.search || apiUrl.hash) {
    throw new Error('API_BASE_URL não pode conter credenciais, query string ou fragmento.');
  }

  if (process.env.CI && !isLoopbackApi) {
    throw new Error('O CI só pode executar testes contra a API isolada em loopback.');
  }

  if (!isLoopbackApi) {
    if (
      process.env.ALLOW_EXTERNAL_API !== 'true' ||
      process.env.ALLOW_DESTRUCTIVE_TESTS !== 'true'
    ) {
      throw new Error(
        'Os testes alteram dados. Para um ambiente externo descartável, defina ' +
          'ALLOW_EXTERNAL_API=true e ALLOW_DESTRUCTIVE_TESTS=true explicitamente.',
      );
    }

    if (startsApiServer) {
      throw new Error('Use API_START_SERVER=false ao apontar para uma API externa.');
    }
  }
}
