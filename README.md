# EstanteDigital API - Testes com Playwright

Projeto de testes de contrato e integração HTTP para a API EstanteDigital, implementado em TypeScript com Playwright. A suíte cobre livros, clientes, funcionários e vendas usando a API real, sem mocks de servidor.

## Arquitetura

```text
tests/
  books.spec.ts                 # CRUD e validação de livros
  customers.spec.ts             # CRUD e validação de clientes
  employees.spec.ts             # CRUD e validação de funcionários
  sales.spec.ts                 # criação, leitura e relacionamentos de vendas
  fixtures/api.fixture.ts        # fixture tipada compartilhada
  global-setup.ts               # verifica /health antes da suíte
src/
  clients/estante-api.ts         # cliente HTTP por recurso
  data/factories.ts              # dados únicos para execução paralela
  types/api.ts                   # contratos dos requests e responses
  contracts/
    response-contract-validator.ts # valida status, endpoint, body e JSON Schema
    schemas/                      # contratos estritos por recurso e resposta
features/
  books/
    books.feature                # cenários de livros
  customers/
    customers.feature            # cenários de clientes
  employees/
    employees.feature            # cenários de funcionários
  sales/
    sales.feature                # cenários de vendas
  step-definitions/
    common.steps.ts              # steps compartilhados
    books/
      books.steps.ts             # steps de livros
    customers/
      customers.steps.ts         # steps de clientes
    employees/
      employees.steps.ts         # steps de funcionários
    sales/
      sales.steps.ts             # steps de vendas
  support/                       # World e ciclo de vida da API
cucumber.cjs                     # configuração Cucumber, formatos e paths
playwright.config.ts             # configuração, relatórios e rastreamento
```

Os testes usam o `APIRequestContext` do Playwright. Não há navegador porque o alvo é uma API REST sem interface web. A suíte Playwright permanece como teste de integração; Cucumber acrescenta cenários Gherkin legíveis pelo negócio sem duplicar o cliente HTTP e as fábricas de dados. Cada cenário BDD recebe um World e contexto HTTP próprios. Cucumber inicia uma instância isolada da API e a encerra ao finalizar a suíte.

## Validação de respostas

O cliente compartilhado valida automaticamente cada resposta com JSON Schema, antes de devolvê-la ao teste. O contrato esperado é escolhido pelo método HTTP, rota e status:

- `200`/`201`: schemas de objeto, lista, venda e health, com tipos, campos obrigatórios, formato de data e propriedades adicionais restritas.
- `400`: contrato comum de erro (`status`, `message` e `field`).
- `204`/`404`: resposta sem corpo.
- Status ou combinações de método/rota sem contrato configurado falham explicitamente.

Os schemas espelham os contratos do projeto RestAssured em `src/contracts/schemas/`. Ao alterar um DTO/resposta da API, atualize o schema correspondente e mantenha essa validação compartilhada pelos testes Playwright e Cucumber.

## Pré-requisitos

- Node.js 22 ou superior e npm
- Java 21 e Maven Wrapper para iniciar a API
- Os dois repositórios clonados lado a lado ou `API_PROJECT_PATH` apontando para o projeto da API

## Instalação e execução local

```powershell
Set-Location C:\Projeto\EstanteDigital\Playwright\EstanteDigital_Teste_API_Playwright
npm ci
Copy-Item .env.example .env
npm test
```

A configuração inicia a API via Maven Wrapper, aguarda `GET /health` e encerra o processo depois da suíte. Por padrão, `API_PROJECT_PATH` é resolvido como `..\..\APIs` em relação à pasta do projeto de testes, para repositórios clonados lado a lado. Se a API estiver em outro local, configure o caminho no `.env`:

```powershell
API_PROJECT_PATH=C:\caminho\para\APIs
```

`API_BASE_URL` deve apontar para loopback por padrão. A suíte é destrutiva: cria, atualiza e remove recursos. Para apontar manualmente para um ambiente externo **descartável**, pare a inicialização automática com `API_START_SERVER=false` e configure, deliberadamente, `ALLOW_EXTERNAL_API=true` e `ALLOW_DESTRUCTIVE_TESTS=true`. Nunca habilite essas opções para produção ou dados compartilhados. O CI rejeita destinos externos.

## Comandos

| Comando | Uso |
| --- | --- |
| `npm test` | Executa a suíte Playwright de integração da API |
| `npm run test:api` | Alias explícito para a suíte Playwright |
| `npm run test:smoke` | Executa os testes Playwright marcados `@smoke` |
| `npm run test:bdd` | Executa todos os cenários Cucumber e inicia a API isolada |
| `npm run test:bdd:smoke` | Executa os cenários Cucumber marcados `@smoke` |
| `npm run test:all` | Executa lint, formatação, typecheck, Playwright e Cucumber |
| `npm run test:report` | Abre o relatório HTML do Playwright |
| `npm run typecheck` | Verifica os tipos TypeScript |
| `npm run lint` | Verifica regras de código com ESLint |
| `npm run format:check` | Confere a formatação com Prettier |
| `npm run format` | Formata os arquivos TypeScript e as configurações |

Playwright grava relatórios em `playwright-report/` e `test-results/`; Cucumber gera relatórios HTML e JUnit em `test-results/`.

## Convenções TypeScript

- O `tsconfig.json` mantém `strict: true` para detectar incompatibilidades de tipo durante o desenvolvimento.
- Use `import type` para dependências usadas apenas como tipos; o ESLint verifica essa convenção.
- ESLint aplica as regras recomendadas para TypeScript e as convenções básicas aos arquivos de configuração JavaScript. Prettier define o padrão de aspas simples, ponto e vírgula, vírgulas finais e largura de linha; a checagem inclui também os schemas JSON.
- Execute `npm run test:all` antes de enviar alterações. Esse comando roda lint, formatação, verificação de tipos e as suítes Playwright e Cucumber.
- Consulte o [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html) e a [referência do `strict`](https://www.typescriptlang.org/tsconfig/strict.html) para as regras da linguagem e do compilador.

## Cobertura e estratégia de dados

- **Livros:** criação, consulta individual/listagem, atualização, persistência após atualização, exclusão, consulta após exclusão e validação de preço.
- **Clientes:** criação, consulta, atualização de status, persistência, exclusão e validação de CPF.
- **Funcionários:** criação, consulta, atualização de status, persistência, exclusão e validação.
- **Vendas:** criação, consulta individual/listagem, persistência da venda e do livro nas compras do cliente; rejeição de cliente inexistente.
- **Validação negativa:** tabelas de casos verificam campos obrigatórios em branco, espaços, nulos ou ausentes, tipos incompatíveis, valores numéricos inválidos e os campos opcionais de compras.
- **Formato das respostas:** todos os recursos e listas são verificados com JSON Schema; respostas de erro, `204` e `404` têm contratos próprios.
- Requests de escrita usam valores identificadores gerados por execução para permitir paralelismo sem depender de registros prévios.
- A API não implementa autenticação. Portanto, a suíte não inventa cenários de autorização que o serviço não oferece.
- Os cenários CRUD removem seus registros também quando uma asserção falha.

### Isolamento do ambiente

A API atual usa H2 em memória. Cada execução inicia uma instância nova da API e o Playwright a encerra no final, descartando o banco junto. A API não oferece exclusão de vendas; por isso, a venda do cenário de sucesso permanece até o final da execução isolada. Não reutilize um servidor ou banco compartilhado.

## Limitações conhecidas da API

- A venda não tem endpoint `DELETE`; seus dados de teste permanecem até reiniciar a API.
- O projeto não configura autenticação; autenticação e autorização ficam fora do escopo da suíte atual.
- O banco H2 em memória é reiniciado quando a API para, então ele é adequado para execução local isolada, mas não substitui testes contra o banco de produção.

## Integração contínua

O workflow em `.github/workflows/api-tests.yml` baixa a API em um checkout separado, instala Node.js e Java e executa `npm ci` e `npm run test:all` contra instâncias locais descartáveis. Os relatórios HTML, JUnit e evidências ficam disponíveis como artefato da execução.
