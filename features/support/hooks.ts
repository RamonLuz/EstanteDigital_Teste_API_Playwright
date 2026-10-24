import { spawn, type ChildProcess } from 'node:child_process';
import { existsSync } from 'node:fs';
import { mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';

import { After, AfterAll, Before, BeforeAll, setDefaultTimeout } from '@cucumber/cucumber';
import { request } from '@playwright/test';
import treeKill from 'tree-kill';

import {
  apiBaseURL,
  apiProjectPath,
  apiUrl,
  startsApiServer,
  validateApiEnvironment,
} from '../../src/config/api-environment';
import { EstanteApi } from '../../src/clients/estante-api';
import type { ApiWorld } from './world';

const healthUrl = new URL('/health', apiUrl).toString();
const startupTimeoutMs = 120_000;
let server: ChildProcess | undefined;
let serverOutput = '';
let serverError: string | undefined;

setDefaultTimeout(30_000);

function rememberOutput(chunk: Buffer): void {
  serverOutput = `${serverOutput}${chunk.toString()}`.slice(-20_000);
}

function wait(ms: number): Promise<void> {
  return new Promise((resolveWait) => setTimeout(resolveWait, ms));
}

async function stopServer(): Promise<void> {
  const pid = server?.pid;
  server = undefined;

  if (!pid) {
    return;
  }

  await new Promise<void>((resolveStop, rejectStop) => {
    treeKill(pid, 'SIGTERM', (error) => {
      if (error && (!('code' in error) || error.code !== 'ESRCH')) {
        rejectStop(error);
        return;
      }

      resolveStop();
    });
  });
}

BeforeAll({ timeout: startupTimeoutMs }, async () => {
  validateApiEnvironment();
  await mkdir(resolve(process.cwd(), 'test-results'), { recursive: true });

  if (!startsApiServer) {
    await waitForApi();
    return;
  }

  let existingApi: Response | undefined;
  try {
    existingApi = await fetch(healthUrl, { signal: AbortSignal.timeout(1_000) });
  } catch {
    existingApi = undefined;
  }

  if (existingApi?.ok) {
    throw new Error(
      `Já existe um servidor respondendo em ${healthUrl}. ` +
        'Encerre-o antes de iniciar a suíte ou use API_START_SERVER=false apenas ' +
        'com uma instância de teste descartável.',
    );
  }

  const wrapper = process.platform === 'win32' ? 'mvnw.cmd' : 'mvnw';
  if (
    !existsSync(resolve(apiProjectPath, 'pom.xml')) ||
    !existsSync(resolve(apiProjectPath, wrapper))
  ) {
    throw new Error(
      `Não foi possível localizar pom.xml e ${wrapper} em ${apiProjectPath}. ` +
        'Defina API_PROJECT_PATH ou inicie a API e configure API_START_SERVER=false.',
    );
  }

  serverOutput = '';
  serverError = undefined;
  const command = process.platform === 'win32' ? (process.env.ComSpec ?? 'cmd.exe') : 'bash';
  const args =
    process.platform === 'win32'
      ? ['/d', '/s', '/c', `${wrapper} spring-boot:run`]
      : [wrapper, 'spring-boot:run'];

  server = spawn(command, args, {
    cwd: apiProjectPath,
    windowsHide: true,
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  server.stdout?.on('data', rememberOutput);
  server.stderr?.on('data', rememberOutput);
  server.on('error', (error) => {
    serverError = error.message;
    serverOutput = `${serverOutput}${error.message}\n`.slice(-20_000);
  });

  try {
    await waitForApi();
  } catch (error) {
    await stopServer();
    throw error;
  }
});

async function waitForApi(): Promise<void> {
  const deadline = Date.now() + startupTimeoutMs;
  let lastError = 'A API ainda não respondeu ao health check.';

  while (Date.now() < deadline) {
    if (serverError) {
      throw new Error(`Não foi possível iniciar a API: ${serverError}.\n${serverOutput}`);
    }

    if (server?.exitCode !== null && server?.exitCode !== undefined) {
      throw new Error(
        `O processo da API foi encerrado com código ${server.exitCode}.\n${serverOutput}`,
      );
    }

    if (server?.signalCode) {
      throw new Error(
        `O processo da API foi encerrado pelo sinal ${server.signalCode}.\n${serverOutput}`,
      );
    }

    try {
      const response = await fetch(healthUrl, { signal: AbortSignal.timeout(2_000) });
      if (response.ok) {
        const health: unknown = await response.json();
        if (
          typeof health === 'object' &&
          health !== null &&
          'status' in health &&
          health.status === 'UP' &&
          'application' in health &&
          health.application === 'estantedigital'
        ) {
          return;
        }

        lastError = `Resposta inesperada de GET ${healthUrl}: ${JSON.stringify(health)}`;
      } else {
        lastError = `GET ${healthUrl} retornou HTTP ${response.status}.`;
      }
    } catch (error) {
      lastError = error instanceof Error ? error.message : String(error);
    }

    await wait(1_000);
  }

  throw new Error(
    `A API não iniciou em ${startupTimeoutMs / 1_000}s (${lastError}).\n${serverOutput}`,
  );
}

Before<ApiWorld>(async function () {
  this.requestContext = await request.newContext({ baseURL: apiBaseURL });
  this.api = new EstanteApi(this.requestContext);
});

After<ApiWorld>(async function () {
  try {
    if (!this.saleCreated) {
      const resources = [
        this.employee && {
          name: 'funcionário',
          delete: () => this.client.employees.delete(this.employee!.id),
        },
        this.customer && {
          name: 'cliente',
          delete: () => this.client.customers.delete(this.customer!.id),
        },
        this.book && {
          name: 'livro',
          delete: () => this.client.books.delete(this.book!.id),
        },
      ].filter((resource) => resource !== undefined);

      const cleanupErrors: string[] = [];
      for (const resource of resources) {
        try {
          const response = await resource.delete();
          if (![204, 404].includes(response.status())) {
            cleanupErrors.push(`A limpeza do ${resource.name} retornou HTTP ${response.status()}.`);
          }
        } catch (error) {
          cleanupErrors.push(
            `Falha ao limpar ${resource.name}: ${error instanceof Error ? error.message : String(error)}`,
          );
        }
      }

      if (cleanupErrors.length > 0) {
        throw new Error(cleanupErrors.join('\n'));
      }
    }
  } finally {
    await this.requestContext?.dispose();
  }
});

AfterAll({ timeout: 20_000 }, stopServer);
