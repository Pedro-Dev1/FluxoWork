"use client"

import type { PedidoPagamento } from "@/types/pedido"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { formatCurrency } from "@/lib/utils"
import { AlertCircle, Save, Clock, User } from "lucide-react"
import { useState } from "react"
import { corrigirPedido } from "@/app/actions/pedidos"
import { useRouter } from "next/navigation"
import { calcularComposicaoPedido } from "@/lib/domain/calculo-financeiro"
import { EmptyState } from "@/components/ui/empty-state"

interface CorrecaoListProps {
  pedidos: PedidoPagamento[]
}

interface ValoresCorrecao {
  horas_extras_50: number
  horas_extras_100: number
  valor_km: number
  conducao: number
  valor_plantao: number
  motivo_plantao: string
  comissao: number
  motivo_comissao: string
  valor_desconto: number
  motivo_desconto: string
  resposta_correcao: string
}

export function CorrecaoList({ pedidos }: CorrecaoListProps) {
  const router = useRouter()
  const [editando, setEditando] = useState<string | null>(null)
  const [valores, setValores] = useState<{ [key: string]: ValoresCorrecao }>({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleEditar = (pedido: PedidoPagamento) => {
    setEditando(pedido.id)
    setValores({
      ...valores,
      [pedido.id]: {
        horas_extras_50: pedido.horas_extras_50 || 0,
        horas_extras_100: pedido.horas_extras_100 || 0,
        valor_km: pedido.valor_km,
        conducao: pedido.conducao,
        valor_plantao: pedido.valor_plantao,
        motivo_plantao: pedido.motivo_plantao || "",
        comissao: pedido.comissao || 0,
        motivo_comissao: pedido.motivo_comissao || "",
        valor_desconto: pedido.valor_desconto || 0,
        motivo_desconto: pedido.motivo_desconto || "",
        resposta_correcao: "",
      },
    })
  }

  const handleSalvar = async (pedidoId: string) => {
    setLoading(true)
    setError("")
    try {
      await corrigirPedido(pedidoId, valores[pedidoId])
      setEditando(null)
      router.refresh()
    } catch (err) {
      setError("Erro ao corrigir pedido. Tente novamente.")
    } finally {
      setLoading(false)
    }
  }

  if (pedidos.length === 0) {
    return <EmptyState title="Nenhum pedido aguardando correção" />
  }

  return (
    <div className="space-y-4">
      {pedidos.map((pedido) => {
        const isEditando = editando === pedido.id
        const valoresAtuais = valores[pedido.id] || {
          horas_extras_50: pedido.horas_extras_50 || 0,
          horas_extras_100: pedido.horas_extras_100 || 0,
          valor_km: pedido.valor_km,
          conducao: pedido.conducao,
          valor_plantao: pedido.valor_plantao,
          motivo_plantao: pedido.motivo_plantao || "",
          comissao: pedido.comissao || 0,
          motivo_comissao: pedido.motivo_comissao || "",
          valor_desconto: pedido.valor_desconto || 0,
          motivo_desconto: pedido.motivo_desconto || "",
          resposta_correcao: "",
        }

        const colaboradorNome = pedido.colaborador?.nome_completo || "N/A"
        // Salário congelado na criação do pedido — nunca o salário atual do colaborador,
        // senão um reajuste salarial altera o total de um pedido antigo em correção.
        const colaboradorSalario = pedido.salario_base ?? pedido.colaborador?.salario ?? 0

        // Mesmo módulo usado pelo servidor em corrigirPedido — condução e KM ficam
        // fora do valor da nota (aparecem na tela mas não entram no total), igual
        // ao que de fato é salvo.
        const composicao = calcularComposicaoPedido({
          salarioBase: colaboradorSalario,
          horasExtras50: valoresAtuais.horas_extras_50,
          horasExtras100: valoresAtuais.horas_extras_100,
          valorPlantao: valoresAtuais.valor_plantao,
          comissao: valoresAtuais.comissao,
          valorDesconto: valoresAtuais.valor_desconto,
        })
        const valorTotalHorasExtras = composicao.valorHorasExtras
        const valorTotal = composicao.valorTotal

        const dataCriacao = new Date(pedido.created_at)
        const dataFormatada = dataCriacao.toLocaleDateString("pt-BR")
        const horaFormatada = dataCriacao.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
        const criadoPor = pedido.criado_por?.nome_completo || "N/A"

        return (
          <Card key={pedido.id} className="p-6 border-l-4 border-l-warning border-border">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="font-semibold text-lg text-foreground">{colaboradorNome}</h3>
                <div className="flex flex-col gap-1 mt-1">
                  <p className="text-sm text-text-tertiary flex items-center gap-1">
                    <User className="w-3 h-3" />
                    Criado por {criadoPor}
                  </p>
                  <p className="text-sm text-text-tertiary flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {dataFormatada} às {horaFormatada}
                  </p>
                </div>
              </div>
              <span className="inline-flex items-center gap-1 rounded-control px-2 py-0.5 text-xs font-medium bg-warning-subtle text-warning whitespace-nowrap">
                <AlertCircle className="w-3 h-3" />
                Correção solicitada
              </span>
            </div>

            {pedido.observacao_gerente && (
              <div className="mb-4 rounded-control bg-surface px-3 py-2">
                <p className="text-xs text-text-tertiary mb-0.5">Observação do gerente</p>
                <p className="text-sm text-text-secondary">{pedido.observacao_gerente}</p>
              </div>
            )}

            {pedido.observacao_financeiro && (
              <div className="mb-4 rounded-control bg-surface px-3 py-2">
                <p className="text-xs text-text-tertiary mb-0.5">Observação do financeiro</p>
                <p className="text-sm text-text-secondary">{pedido.observacao_financeiro}</p>
              </div>
            )}

            {/* Campo de Resposta */}
            {(pedido.observacao_gerente || pedido.observacao_financeiro) && isEditando && (
              <div className="mb-4">
                <Label htmlFor={`resposta-${pedido.id}`} className="text-sm font-medium">
                  Resposta ao Questionamento
                </Label>
                <Textarea
                  id={`resposta-${pedido.id}`}
                  placeholder="Responda ao questionamento de quem solicitou a correção..."
                  value={valoresAtuais.resposta_correcao}
                  onChange={(e) =>
                    setValores({
                      ...valores,
                      [pedido.id]: {
                        ...valoresAtuais,
                        resposta_correcao: e.target.value,
                      },
                    })
                  }
                  className="mt-1.5"
                  rows={3}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Esta resposta será enviada junto com a correção para quem solicitou.
                </p>
              </div>
            )}

            <div className="space-y-4 mb-4">
              {/* Salário Base (não editável) */}
              <div>
                <Label>Salário Base</Label>
                <Input value={formatCurrency(colaboradorSalario)} disabled className="bg-muted" />
              </div>

              {/* Horas Extras 50% */}
              <div>
                <Label htmlFor={`he50-${pedido.id}`}>Horas Extras 50% (quantidade de horas)</Label>
                <Input
                  id={`he50-${pedido.id}`}
                  type="number"
                  step="0.5"
                  value={valoresAtuais.horas_extras_50}
                  onChange={(e) =>
                    setValores({
                      ...valores,
                      [pedido.id]: {
                        ...valoresAtuais,
                        horas_extras_50: Number.parseFloat(e.target.value) || 0,
                      },
                    })
                  }
                  disabled={!isEditando}
                  className={!isEditando ? "bg-muted" : ""}
                />
                {isEditando && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Valor calculado: {formatCurrency(composicao.valorHorasExtras50)}
                  </p>
                )}
              </div>

              {/* Horas Extras 100% */}
              <div>
                <Label htmlFor={`he100-${pedido.id}`}>Horas Extras 100% (quantidade de horas)</Label>
                <Input
                  id={`he100-${pedido.id}`}
                  type="number"
                  step="0.5"
                  value={valoresAtuais.horas_extras_100}
                  onChange={(e) =>
                    setValores({
                      ...valores,
                      [pedido.id]: {
                        ...valoresAtuais,
                        horas_extras_100: Number.parseFloat(e.target.value) || 0,
                      },
                    })
                  }
                  disabled={!isEditando}
                  className={!isEditando ? "bg-muted" : ""}
                />
                {isEditando && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Valor calculado: {formatCurrency(composicao.valorHorasExtras100)}
                  </p>
                )}
              </div>

              {/* Condução */}
              <div>
                <Label htmlFor={`conducao-${pedido.id}`}>Condução (R$)</Label>
                <Input
                  id={`conducao-${pedido.id}`}
                  type="number"
                  step="0.01"
                  value={valoresAtuais.conducao}
                  onChange={(e) =>
                    setValores({
                      ...valores,
                      [pedido.id]: {
                        ...valoresAtuais,
                        conducao: Number.parseFloat(e.target.value) || 0,
                      },
                    })
                  }
                  disabled={!isEditando}
                  className={!isEditando ? "bg-muted" : ""}
                />
              </div>

              {/* Quilometragem */}
              <div>
                <Label htmlFor={`km-${pedido.id}`}>Quilometragem (R$)</Label>
                <Input
                  id={`km-${pedido.id}`}
                  type="number"
                  step="0.01"
                  value={valoresAtuais.valor_km}
                  onChange={(e) =>
                    setValores({
                      ...valores,
                      [pedido.id]: {
                        ...valoresAtuais,
                        valor_km: Number.parseFloat(e.target.value) || 0,
                      },
                    })
                  }
                  disabled={!isEditando}
                  className={!isEditando ? "bg-muted" : ""}
                />
              </div>

              {/* Plantão */}
              <div>
                <Label htmlFor={`plantao-${pedido.id}`}>Plantão (R$)</Label>
                <Input
                  id={`plantao-${pedido.id}`}
                  type="number"
                  step="0.01"
                  value={valoresAtuais.valor_plantao}
                  onChange={(e) =>
                    setValores({
                      ...valores,
                      [pedido.id]: {
                        ...valoresAtuais,
                        valor_plantao: Number.parseFloat(e.target.value) || 0,
                      },
                    })
                  }
                  disabled={!isEditando}
                  className={!isEditando ? "bg-muted" : ""}
                />
              </div>

              {/* Motivo do Plantão */}
              {valoresAtuais.valor_plantao > 0 && (
                <div>
                  <Label htmlFor={`motivo-plantao-${pedido.id}`}>Motivo do Plantão</Label>
                  <Textarea
                    id={`motivo-plantao-${pedido.id}`}
                    value={valoresAtuais.motivo_plantao}
                    onChange={(e) =>
                      setValores({
                        ...valores,
                        [pedido.id]: {
                          ...valoresAtuais,
                          motivo_plantao: e.target.value,
                        },
                      })
                    }
                    disabled={!isEditando}
                    className={!isEditando ? "bg-muted" : ""}
                    rows={2}
                  />
                </div>
              )}

              {/* Comissão */}
              <div>
                <Label htmlFor={`comissao-${pedido.id}`}>Comissão (R$)</Label>
                <Input
                  id={`comissao-${pedido.id}`}
                  type="number"
                  step="0.01"
                  value={valoresAtuais.comissao}
                  onChange={(e) =>
                    setValores({
                      ...valores,
                      [pedido.id]: {
                        ...valoresAtuais,
                        comissao: Number.parseFloat(e.target.value) || 0,
                      },
                    })
                  }
                  disabled={!isEditando}
                  className={!isEditando ? "bg-muted" : ""}
                />
              </div>

              {/* Motivo da Comissão */}
              {valoresAtuais.comissao > 0 && (
                <div>
                  <Label htmlFor={`motivo-comissao-${pedido.id}`}>Motivo da Comissão</Label>
                  <Textarea
                    id={`motivo-comissao-${pedido.id}`}
                    value={valoresAtuais.motivo_comissao}
                    onChange={(e) =>
                      setValores({
                        ...valores,
                        [pedido.id]: {
                          ...valoresAtuais,
                          motivo_comissao: e.target.value,
                        },
                      })
                    }
                    disabled={!isEditando}
                    className={!isEditando ? "bg-muted" : ""}
                    rows={2}
                  />
                </div>
              )}

              {/* Desconto */}
              <div>
                <Label htmlFor={`desconto-${pedido.id}`}>Desconto (R$)</Label>
                <Input
                  id={`desconto-${pedido.id}`}
                  type="number"
                  step="0.01"
                  value={valoresAtuais.valor_desconto}
                  onChange={(e) =>
                    setValores({
                      ...valores,
                      [pedido.id]: {
                        ...valoresAtuais,
                        valor_desconto: Number.parseFloat(e.target.value) || 0,
                      },
                    })
                  }
                  disabled={!isEditando}
                  className={!isEditando ? "bg-muted" : ""}
                />
              </div>

              {/* Motivo do Desconto */}
              {valoresAtuais.valor_desconto > 0 && (
                <div>
                  <Label htmlFor={`motivo-desconto-${pedido.id}`}>Motivo do Desconto</Label>
                  <Textarea
                    id={`motivo-desconto-${pedido.id}`}
                    value={valoresAtuais.motivo_desconto}
                    onChange={(e) =>
                      setValores({
                        ...valores,
                        [pedido.id]: {
                          ...valoresAtuais,
                          motivo_desconto: e.target.value,
                        },
                      })
                    }
                    disabled={!isEditando}
                    className={!isEditando ? "bg-muted" : ""}
                    rows={2}
                  />
                </div>
              )}
            </div>

            <div className="p-4 bg-primary/5 rounded-md mb-4">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Valor Total:</span>
                <span className="text-xl font-bold text-primary">{formatCurrency(valorTotal)}</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Salário: {formatCurrency(colaboradorSalario)} + HE: {formatCurrency(valorTotalHorasExtras)} + Condução:{" "}
                {formatCurrency(valoresAtuais.conducao)} + KM: {formatCurrency(valoresAtuais.valor_km)} + Plantão:{" "}
                {formatCurrency(valoresAtuais.valor_plantao)} + Comissão: {formatCurrency(valoresAtuais.comissao)} - Desconto: {formatCurrency(valoresAtuais.valor_desconto)}
              </p>
            </div>

            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="flex gap-2">
              {!isEditando ? (
                <Button onClick={() => handleEditar(pedido)} className="w-full">
                  Corrigir Pedido
                </Button>
              ) : (
                <>
                  <Button onClick={() => handleSalvar(pedido.id)} disabled={loading} className="flex-1">
                    <Save className="w-4 h-4 mr-2" />
                    Salvar e Reenviar
                  </Button>
                  <Button onClick={() => setEditando(null)} disabled={loading} variant="outline" className="flex-1">
                    Cancelar
                  </Button>
                </>
              )}
            </div>
          </Card>
        )
      })}
    </div>
  )
}
