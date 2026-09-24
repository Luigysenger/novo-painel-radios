// Cidade Ludigins — estrutura oficial aprovada.
// Este arquivo prepara a nova cidade sem alterar ou apagar conquistas existentes.
// Saldo, corridas, veículos, negócios e demais dados atuais continuam nas estruturas atuais do Firebase.

export const CIDADE_LUDIGINS = Object.freeze({
  id: 'cidade_ludigins',
  nome: 'Cidade de Ludigins',
  versao: 1,
  status: 'preparacao',
  preservarDadosExistentes: true,
  regras: Object.freeze({
    ruasExclusivasParaVeiculos: true,
    construcoesForaDasRuas: true,
    rotasDefinidas: true,
    imoveisComEndereco: true,
    separarImovelDeAtividadeComercial: true
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

// Campos novos ficam isolados neste namespace para não sobrescrever o perfil atual.
export const CAMINHOS_CIDADE_LUDIGINS = Object.freeze({
  cidade: 'ludigins_cidades/cidade_ludigins',
  terrenos: 'ludigins_cidades/cidade_ludigins/terrenos',
  imoveis: 'ludigins_cidades/cidade_ludigins/imoveis',
  propriedades: 'ludigins_cidades/cidade_ludigins/propriedades',
  enderecos: 'ludigins_cidades/cidade_ludigins/enderecos'
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
