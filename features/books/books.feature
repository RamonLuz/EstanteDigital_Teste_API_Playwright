# language: pt
@api
Funcionalidade: Livros
  Como consumidor da API EstanteDigital
  Quero administrar livros
  Para manter o catálogo consistente

  @smoke
  Cenário: Criar, consultar, atualizar e remover um livro
    Dado que tenho um livro válido para cadastrar
    Quando cadastro o livro
    Então a API responde com status 201
    E a resposta contém o livro criado
    Quando consulto o livro cadastrado
    Então a API responde com status 200
    E a resposta contém o livro criado
    Quando atualizo o livro cadastrado
    Então a API responde com status 200
    E a resposta contém o livro atualizado
    Quando removo o livro cadastrado
    Então a API responde com status 204
    Quando consulto o livro removido
    Então a API responde com status 404

  Cenário: Rejeitar livro com preço inválido
    Dado que tenho um livro com preço inválido
    Quando cadastro o livro
    Então a API responde com status 400
    E a resposta de erro identifica o corpo da requisição
