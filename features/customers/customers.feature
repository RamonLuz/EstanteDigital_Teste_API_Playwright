# language: pt
@api
Funcionalidade: Clientes
  Como consumidor da API EstanteDigital
  Quero administrar clientes
  Para manter seus cadastros atualizados

  @smoke
  Cenário: Criar, consultar, atualizar e remover um cliente
    Dado que tenho um cliente válido para cadastrar
    Quando cadastro o cliente
    Então a API responde com status 201
    E a resposta contém o cliente criado
    Quando consulto o cliente cadastrado
    Então a API responde com status 200
    Quando atualizo o status do cliente
    Então a API responde com status 200
    E o cliente atualizado tem status "INACTIVE"
    Quando removo o cliente cadastrado
    Então a API responde com status 204
    Quando consulto o cliente removido
    Então a API responde com status 404

  Cenário: Rejeitar cliente com CPF inválido
    Dado que tenho um cliente com CPF inválido
    Quando cadastro o cliente
    Então a API responde com status 400
    E a resposta de erro informa "CPF must have 11 digits"
