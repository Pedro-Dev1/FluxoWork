// Módulo único e puro de cálculo financeiro de um pedido de pagamento.
// Nenhuma outra parte do app deve recalcular horas extras ou valor_total —
// toda tela/Server Action importa daqui. Ver histórico de bugs: antes desta
// extração, a mesma fórmula estava duplicada em ~12 arquivos, e quando um
// deles usava o salário atual do colaborador em vez do salário congelado no
// pedido (salario_base), reajustes salariais corrompiam o histórico.

const HORAS_MES = 220
const MULTIPLICADOR_HE_50 = 1.5
const MULTIPLICADOR_HE_100 = 2

export interface ComposicaoPedidoInput {
  salarioBase: number
  horasExtras50: number
  horasExtras100: number
  valorPlantao: number
  comissao: number
  valorDesconto: number
}

export interface ComposicaoPedidoResultado {
  valorHoraNormal: number
  valorHorasExtras50: number
  valorHorasExtras100: number
  valorHorasExtras: number
  valorTotal: number
}

function arredondar(valor: number): number {
  return Math.round(valor * 100) / 100
}

/**
 * Composição de um pedido "completo" (salário + horas extras + plantão +
 * comissão − desconto). `salarioBase` deve SEMPRE vir do salário congelado
 * no pedido (campo salario_base), nunca do salário atual do colaborador —
 * exceto na criação de um pedido novo, onde ainda não existe salario_base
 * e o salário atual É o valor correto a congelar.
 */
export function calcularComposicaoPedido(input: ComposicaoPedidoInput): ComposicaoPedidoResultado {
  const valorHoraNormal = input.salarioBase / HORAS_MES
  const valorHorasExtras50 = input.horasExtras50 * valorHoraNormal * MULTIPLICADOR_HE_50
  const valorHorasExtras100 = input.horasExtras100 * valorHoraNormal * MULTIPLICADOR_HE_100
  const valorHorasExtras = valorHorasExtras50 + valorHorasExtras100

  const valorTotal =
    input.salarioBase + valorHorasExtras + input.valorPlantao + input.comissao - input.valorDesconto

  return {
    valorHoraNormal,
    valorHorasExtras50: arredondar(valorHorasExtras50),
    valorHorasExtras100: arredondar(valorHorasExtras100),
    valorHorasExtras: arredondar(valorHorasExtras),
    valorTotal: arredondar(valorTotal),
  }
}

/** Composição de um pedido "reembolso_km" — não usa salário no cálculo. */
export function calcularComposicaoReembolsoKm(valorKm: number): { valorTotal: number } {
  return { valorTotal: arredondar(valorKm) }
}
