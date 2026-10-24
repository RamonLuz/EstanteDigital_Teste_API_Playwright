import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

import { defineConfig } from '@playwright/test';

import {
  apiBaseURL,
  apiProjectPath,
  apiUrl,
  startsApiServer,
  validateApiEnvironment,
} from './src/config/api-environment';

const isCI = Boolean(process.env.CI);

validateApiEnvironment();

const webServer = startsApiServer
  ? (() => {
      const wrapper = process.platform === 'win32' ? 'mvnw.cmd' : 'mvnw';
      const wrapperPath = resolve(apiProjectPath, wrapper);

      if (!existsSync(resolve(apiProjectPath, 'pom.xml')) || !existsSync(wrapperPath)) {
        throw new Error(
          `Não foi possível localizar pom.xml e ${wrapper} em ${apiProjectPath}. ` +
            'Defina API_PROJECT_PATH ou use API_START_SERVER=false para uma API externa.',
        );
      }

      return {
        command:
          process.platform === 'win32' ? 'mvnw.cmd spring-boot:run' : 'bash mvnw spring-boot:run',
        cwd: apiProjectPath,
        url: new URL('/health', apiUrl).toString(),
        timeout: 120_000,
        reuseExistingServer: false,
        stdout: 'pipe' as const,
        stderr: 'pipe' as const,
      };
    })()
  : undefined;

export default defineConfig({
  testDir: './tests',
  testMatch: '**/*.spec.ts',
  globalSetup: './tests/global-setup.ts',
  fullyParallel: true,
  forbidOnly: isCI,
  retries: isCI ? 1 : 0,
  workers: isCI ? 2 : 1,
  timeout: 30_000,
  expect: {
    timeout: 5_000,
  },
  reporter: [
    ['list'],
    ['junit', { outputFile: 'test-results/junit.xml' }],
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
  ],
  outputDir: 'test-results',
  use: {
    baseURL: apiBaseURL,
    extraHTTPHeaders: {
      accept: 'application/json',
    },
    trace: 'retain-on-failure',
  },
  webServer,
});
