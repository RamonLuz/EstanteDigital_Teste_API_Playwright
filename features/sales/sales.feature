# language: pt
@api
Funcionalidade: Vendas
  Como consumidor da API EstanteDigital
  Quero registrar vendas válidas
  Para manter os relacionamentos de compra consistentes

  @smoke
  Cenário: Registrar uma venda e consultar a compra do cliente
    Dado que tenho um livro, um cliente e um funcionário cadastrados
    Quando registro a venda desses recursos
    Então a API responde com status 201
    E a resposta contém a venda e seus relacionamentos
    Quando consulto a venda cadastrada
    Então a API responde com status 200
    E a resposta contém a venda consultada
    E as compras do cliente contêm o livro vendido

  Cenário: Rejeitar venda para um cliente inexistente
    Dado que preparo uma venda para um cliente inexistente
    Quando registro a venda
    Então a API responde com status 400
    E a resposta de erro informa "Customer does not exist"
