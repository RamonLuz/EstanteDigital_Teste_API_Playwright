# language: pt
@api
Funcionalidade: Funcionários
  Como consumidor da API EstanteDigital
  Quero administrar funcionários
  Para manter seus cadastros atualizados

  @smoke
  Cenário: Criar, consultar, atualizar e remover um funcionário
    Dado que tenho um funcionário válido para cadastrar
    Quando cadastro o funcionário
    Então a API responde com status 201
    E a resposta contém o funcionário criado
    Quando consulto o funcionário cadastrado
    Então a API responde com status 200
    Quando atualizo o status do funcionário
    Então a API responde com status 200
    E o funcionário atualizado tem status "INACTIVE"
    Quando removo o funcionário cadastrado
    Então a API responde com status 204
    Quando consulto o funcionário removido
    Então a API responde com status 404

  Cenário: Rejeitar funcionário sem nome
    Dado que tenho um funcionário sem nome
    Quando cadastro o funcionário
    Então a API responde com status 400
    E a resposta de erro identifica o corpo da requisição
