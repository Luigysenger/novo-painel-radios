// Cidade Ludigins — estrutura oficial aprovada.
// Este arquivo prepara a nova cidade sem alterar ou apagar conquistas existentes.
// Saldo, corridas, veículos, negócios e demais dados atuais continuam nas estruturas atuais do Firebase.

export const CIDADE_LUDIGINS = Object.freeze({
  id: 'cidade_ludigins',
  nome: 'Cidade de Ludigins',
  versao: 2,
  status: 'preparacao',
  preservarDadosExistentes: true,
  regras: Object.freeze({
    ruasExclusivasParaVeiculos: true,
    construcoesForaDasRuas: true,
    rotasDefinidas: true,
    imoveisComEndereco: true,
    separarImovelDeAtividadeComercial: true,
    mapaAprovadoNaoPodeSerRedesenhadoNaImplementacao: true
  }),
  zonas: Object.freeze([
    { id: 'centro', nome: 'Centro', tipo: 'mista' },
    { id: 'bairro_residencial', nome: 'Bairro Residencial', tipo: 'residencial' },
    { id: 'servicos', nome: 'Área de Serviços', tipo: 'servicos' },
    { id: 'comercial', nome: 'Área Comercial', tipo: 'comercial' }
  ]),
  locaisPublicos: Object.freeze([
    { id: 'prefeitura', nome: 'Prefeitura', tipo: 'publico', fixo: true },
    { id: 'hospital', nome: 'Hospital', tipo: 'publico', fixo: true },
    { id: 'bombeiros', nome: 'Bombeiros', tipo: 'publico', fixo: true }
  ]),
  negociosBase: Object.freeze([
    { id: 'posto', nome: 'Posto', tipo: 'comercial' },
    { id: 'lanchonete', nome: 'Lanchonete', tipo: 'comercial' },
    { id: 'supermercado', nome: 'Supermercado', tipo: 'comercial' },
    { id: 'restaurante', nome: 'Restaurante', tipo: 'comercial' },
    { id: 'lava_rapido', nome: 'Lava-rápido', tipo: 'comercial' },
    { id: 'banco', nome: 'Banco', tipo: 'comercial' }
  ]),
  expansao: Object.freeze({
    id: 'cidade_laig',
    nome: 'Cidade de LaiG',
    acesso: 'Acesso à Cidade de LaiG — futura expansão',
    status: 'futura'
  })
});

// Malha lógica do desenho aprovado. Coordenadas são percentuais e servem para
// transformar as ruas visuais em caminhos reais sem ocupar os quarteirões.
export const MALHA_VIARIA_LUDIGINS = Object.freeze({
  viasHorizontais: Object.freeze([
    { id: 'h_norte', y: 10, deX: 5, ateX: 95 },
    { id: 'h_centro_norte', y: 31, deX: 5, ateX: 95 },
    { id: 'h_centro_sul', y: 55, deX: 5, ateX: 95 },
    { id: 'h_sul', y: 79, deX: 5, ateX: 95 }
  ]),
  viasVerticais: Object.freeze([
    { id: 'v_oeste', x: 8, deY: 7, ateY: 91 },
    { id: 'v_centro_oeste', x: 31, deY: 7, ateY: 91 },
    { id: 'v_centro', x: 53, deY: 7, ateY: 91 },
    { id: 'v_centro_leste', x: 75, deY: 7, ateY: 91 },
    { id: 'v_leste', x: 94, deY: 7, ateY: 91 }
  ]),
  // A saída de LaiG nasce na borda da cidade e não ocupa terreno comprável.
  acessoLaiG: Object.freeze({ id: 'acesso_laig', via: 'h_centro_sul', x: 95, y: 55 })
});

// Quarteirões ficam sempre entre as vias. Nenhum lote pode invadir uma rua.
export const QUARTEIROES_LUDIGINS = Object.freeze([
  { id: 'q01', zona: 'bairro_residencial', x: 11, y: 13, largura: 17, altura: 15 },
  { id: 'q02', zona: 'centro', x: 34, y: 13, largura: 16, altura: 15 },
  { id: 'q03', zona: 'centro', x: 56, y: 13, largura: 16, altura: 15 },
  { id: 'q04', zona: 'comercial', x: 78, y: 13, largura: 13, altura: 15 },
  { id: 'q05', zona: 'bairro_residencial', x: 11, y: 34, largura: 17, altura: 18 },
  { id: 'q06', zona: 'centro', x: 34, y: 34, largura: 16, altura: 18 },
  { id: 'q07', zona: 'servicos', x: 56, y: 34, largura: 16, altura: 18 },
  { id: 'q08', zona: 'comercial', x: 78, y: 34, largura: 13, altura: 18 },
  { id: 'q09', zona: 'bairro_residencial', x: 11, y: 58, largura: 17, altura: 18 },
  { id: 'q10', zona: 'comercial', x: 34, y: 58, largura: 16, altura: 18 },
  { id: 'q11', zona: 'servicos', x: 56, y: 58, largura: 16, altura: 18 },
  { id: 'q12', zona: 'comercial', x: 78, y: 58, largura: 13, altura: 18 }
]);

// Pontos fixos ocupam lotes próprios e nunca poderão ser comprados como terreno vazio.
export const LOTES_FIXOS_LUDIGINS = Object.freeze([
  { id: 'lote_prefeitura', quarteirao: 'q06', uso: 'publico', ocupacao: 'prefeitura', endereco: 'Praça Central, 1', vendavel: false },
  { id: 'lote_hospital', quarteirao: 'q07', uso: 'publico', ocupacao: 'hospital', endereco: 'Avenida dos Serviços, 10', vendavel: false },
  { id: 'lote_bombeiros', quarteirao: 'q11', uso: 'publico', ocupacao: 'bombeiros', endereco: 'Avenida dos Serviços, 20', vendavel: false },
  { id: 'lote_posto', quarteirao: 'q08', uso: 'comercial', ocupacao: 'posto', endereco: 'Avenida Comercial, 30', vendavel: false },
  { id: 'lote_lanchonete', quarteirao: 'q10', uso: 'comercial', ocupacao: 'lanchonete', endereco: 'Rua do Comércio, 12', vendavel: false },
  { id: 'lote_supermercado', quarteirao: 'q04', uso: 'comercial', ocupacao: 'supermercado', endereco: 'Avenida Comercial, 5', vendavel: false },
  { id: 'lote_restaurante', quarteirao: 'q12', uso: 'comercial', ocupacao: 'restaurante', endereco: 'Rua do Comércio, 25', vendavel: false },
  { id: 'lote_lava_rapido', quarteirao: 'q08', uso: 'comercial', ocupacao: 'lava_rapido', endereco: 'Avenida Comercial, 32', vendavel: false },
  { id: 'lote_banco', quarteirao: 'q03', uso: 'comercial', ocupacao: 'banco', endereco: 'Praça Central, 8', vendavel: false }
]);

// Primeiros lotes livres. Eles são apenas catálogo da cidade; nenhum jogador recebe
// propriedade automaticamente e nenhum saldo é alterado nesta fase.
export const LOTES_COMPRAVEIS_LUDIGINS = Object.freeze([
  { id: 'LUD-RES-001', quarteirao: 'q01', uso: 'residencial', endereco: 'Rua das Flores, 1', estado: 'disponivel' },
  { id: 'LUD-RES-002', quarteirao: 'q01', uso: 'residencial', endereco: 'Rua das Flores, 3', estado: 'disponivel' },
  { id: 'LUD-RES-003', quarteirao: 'q05', uso: 'residencial', endereco: 'Rua das Flores, 18', estado: 'disponivel' },
  { id: 'LUD-RES-004', quarteirao: 'q09', uso: 'residencial', endereco: 'Rua das Palmeiras, 2', estado: 'disponivel' },
  { id: 'LUD-COM-001', quarteirao: 'q10', uso: 'comercial', endereco: 'Rua do Comércio, 14', estado: 'disponivel' },
  { id: 'LUD-COM-002', quarteirao: 'q12', uso: 'comercial', endereco: 'Rua do Comércio, 27', estado: 'disponivel' }
]);

// Campos novos ficam isolados neste namespace para não sobrescrever o perfil atual.
export const CAMINHOS_CIDADE_LUDIGINS = Object.freeze({
  cidade: 'ludigins_cidades/cidade_ludigins',
  terrenos: 'ludigins_cidades/cidade_ludigins/terrenos',
  imoveis: 'ludigins_cidades/cidade_ludigins/imoveis',
  propriedades: 'ludigins_cidades/cidade_ludigins/propriedades',
  enderecos: 'ludigins_cidades/cidade_ludigins/enderecos',
  malhaViaria: 'ludigins_cidades/cidade_ludigins/malha_viaria'
});

export function criarPerfilCidadeSemAlterarConquistas(perfilAtual = {}) {
  return {
    cidadeAtual: 'cidade_ludigins',
    residenciaId: null,
    terrenos: {},
    imoveis: {},
    patrimonioImobiliario: 0,
    // Referências informativas: os valores originais permanecem onde já estão.
    legadoPreservado: {
      saldo: perfilAtual.saldo ?? null,
      corridasHoje: perfilAtual.corridasHoje ?? null,
      corridasTotais: perfilAtual.corridasTotais ?? null
    }
  };
}
