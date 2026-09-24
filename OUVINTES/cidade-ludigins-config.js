// Cidade Ludigins — estrutura oficial aprovada.
// O mapa-base permanece limpo: casas, carros e patrimônio são objetos dinâmicos do jogo.
export const CIDADE_LUDIGINS=Object.freeze({id:'cidade_ludigins',nome:'Cidade de Ludigins',versao:3,status:'preparacao',preservarDadosExistentes:true,regras:Object.freeze({ruasExclusivasParaVeiculos:true,construcoesForaDasRuas:true,rotasDefinidas:true,imoveisComEndereco:true,separarImovelDeAtividadeComercial:true,mapaAprovadoNaoPodeSerRedesenhadoNaImplementacao:true,mapaBaseSemCasas:true,construcaoSomenteEmLoteDoProprietario:true})});

// Lotes residenciais independentes. x/y/largura/altura são percentuais do mapa e formam
// a área máxima onde a futura arte da casa poderá ser encaixada sem invadir rua/calçada/vizinho.
export const LOTES_RESIDENCIAIS_LUDIGINS=Object.freeze([
{id:'LUD-RES-001',endereco:'Rua das Flores, 1',preco:1200,x:4.2,y:24.0,largura:8.2,altura:18.0},
{id:'LUD-RES-002',endereco:'Rua das Flores, 3',preco:1300,x:13.0,y:24.0,largura:8.2,altura:18.0},
{id:'LUD-RES-003',endereco:'Rua das Flores, 5',preco:1350,x:4.2,y:44.0,largura:8.2,altura:14.0},
{id:'LUD-RES-004',endereco:'Rua das Flores, 7',preco:1400,x:13.0,y:44.0,largura:8.2,altura:14.0},
{id:'LUD-RES-005',endereco:'Rua Lago Sul, 18',preco:1450,x:22.0,y:70.0,largura:8.4,altura:16.0},
{id:'LUD-RES-006',endereco:'Rua Lago Sul, 20',preco:1500,x:31.0,y:70.0,largura:8.4,altura:16.0},
{id:'LUD-RES-007',endereco:'Rua das Palmeiras, 2',preco:1550,x:43.0,y:70.0,largura:7.0,altura:16.0},
{id:'LUD-RES-008',endereco:'Rua das Palmeiras, 4',preco:1600,x:50.5,y:70.0,largura:7.0,altura:16.0}
]);

export const LOTES_COMERCIAIS_LUDIGINS=Object.freeze([
{id:'LUD-COM-001',endereco:'Rua do Comércio, 14',preco:2200,x:69,y:69,largura:12,altura:16},
{id:'LUD-COM-002',endereco:'Rua do Comércio, 27',preco:2500,x:82,y:69,largura:14,altura:16}
]);

export const CAMINHOS_CIDADE_LUDIGINS=Object.freeze({cidade:'ludigins_cidade',terrenos:'ludigins_cidade/lotes',imoveis:'ludigins_cidade/imoveis',presentes:'ludigins_cidade/presentes'});

export function criarPerfilCidadeSemAlterarConquistas(perfilAtual={}){return{cidadeAtual:'cidade_ludigins',residenciaId:null,terrenos:{},imoveis:{},patrimonioImobiliario:0,legadoPreservado:{saldo:perfilAtual.saldo??null,corridasHoje:perfilAtual.corridasHoje??null,corridasTotais:perfilAtual.corridasTotais??null}}}
