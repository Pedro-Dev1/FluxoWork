import { describe, expect, it } from "vitest"
import { calcularComposicaoPedido, calcularComposicaoReembolsoKm } from "./calculo-financeiro"

describe("calcularComposicaoPedido", () => {
  it("calcula salário puro sem horas extras/plantão/comissão/desconto", () => {
    const r = calcularComposicaoPedido({
      salarioBase: 6000,
      horasExtras50: 0,
      horasExtras100: 0,
      valorPlantao: 0,
      comissao: 0,
      valorDesconto: 0,
    })
    expect(r.valorTotal).toBe(6000)
    expect(r.valorHorasExtras).toBe(0)
  })

  it("reproduz o caso real de produção (o mesmo cálculo que já existia em criarPedido)", () => {
    // salário 2800, 10h a 50% e 4h a 100%, plantão 200, comissão 150, desconto 50
    const r = calcularComposicaoPedido({
      salarioBase: 2800,
      horasExtras50: 10,
      horasExtras100: 4,
      valorPlantao: 200,
      comissao: 150,
      valorDesconto: 50,
    })
    const valorHoraNormal = 2800 / 220
    const esperadoHe50 = Math.round(10 * valorHoraNormal * 1.5 * 100) / 100
    const esperadoHe100 = Math.round(4 * valorHoraNormal * 2 * 100) / 100
    expect(r.valorHorasExtras50).toBe(esperadoHe50)
    expect(r.valorHorasExtras100).toBe(esperadoHe100)
    expect(r.valorTotal).toBe(
      Math.round((2800 + esperadoHe50 + esperadoHe100 + 200 + 150 - 50) * 100) / 100,
    )
  })

  it("permite valor_total negativo quando o desconto é maior que o resto (não clampa — mesmo comportamento de hoje)", () => {
    const r = calcularComposicaoPedido({
      salarioBase: 100,
      horasExtras50: 0,
      horasExtras100: 0,
      valorPlantao: 0,
      comissao: 0,
      valorDesconto: 500,
    })
    expect(r.valorTotal).toBe(-400)
  })

  it("arredonda para 2 casas decimais mesmo com dízima", () => {
    const r = calcularComposicaoPedido({
      salarioBase: 1000, // 1000/220 = 4.5454... por hora
      horasExtras50: 1,
      horasExtras100: 0,
      valorPlantao: 0,
      comissao: 0,
      valorDesconto: 0,
    })
    // 1 * (1000/220) * 1.5 = 6.8181... -> 6.82
    expect(r.valorHorasExtras50).toBe(6.82)
    expect(Number.isInteger(r.valorTotal * 100)).toBe(true)
  })

  it("salário zero (ex: prestador só de comissão) não quebra o cálculo", () => {
    const r = calcularComposicaoPedido({
      salarioBase: 0,
      horasExtras50: 0,
      horasExtras100: 0,
      valorPlantao: 0,
      comissao: 300,
      valorDesconto: 0,
    })
    expect(r.valorTotal).toBe(300)
  })
})

describe("calcularComposicaoReembolsoKm", () => {
  it("valor_total é exatamente o valor de km, sem depender de salário", () => {
    expect(calcularComposicaoReembolsoKm(123.456).valorTotal).toBe(123.46)
  })

  it("aceita zero", () => {
    expect(calcularComposicaoReembolsoKm(0).valorTotal).toBe(0)
  })
})
