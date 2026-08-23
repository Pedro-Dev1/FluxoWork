"use client"

import type { PedidoPagamento } from "@/types/pedido"
import { useMaskedCurrency } from "@/components/currency-display"

interface PedidoComposicaoProps {
  pedido: PedidoPagamento
}

export function PedidoComposicao({ pedido }: PedidoComposicaoProps) {
  const { formatValue } = useMaskedCurrency()
  const isReembolsoKm = pedido.tipo_pedido === "reembolso_km"
  const salarioBase = pedido.salario_base ?? pedido.colaborador?.salario ?? 0

  if (isReembolsoKm) {
    return (
      <div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm mb-3">
          <div>
            <p className="text-xs text-text-tertiary">Quilometragem</p>
            <p className="font-medium tabular-nums">{formatValue(pedido.valor_km || 0)}</p>
          </div>
        </div>
        <div>
          <p className="text-xs text-text-tertiary">Motivo da quilometragem</p>
          <p className="text-sm text-text-secondary">{pedido.motivo_km || "Não informado"}</p>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm mb-3">
        <div>
          <p className="text-xs text-text-tertiary">Salário base</p>
          <p className="font-medium tabular-nums">{formatValue(salarioBase)}</p>
        </div>
        <div>
          <p className="text-xs text-text-tertiary">Horas extras</p>
          <p className="font-medium tabular-nums">{formatValue(pedido.horas_extras || 0)}</p>
        </div>
        {(pedido.valor_plantao || 0) > 0 && (
          <div>
            <p className="text-xs text-text-tertiary">Plantão</p>
            <p className="font-medium tabular-nums">{formatValue(pedido.valor_plantao || 0)}</p>
          </div>
        )}
        {(pedido.comissao || 0) > 0 && (
          <div>
            <p className="text-xs text-text-tertiary">Comissão</p>
            <p className="font-medium tabular-nums">{formatValue(pedido.comissao || 0)}</p>
          </div>
        )}
        {(pedido.conducao || 0) > 0 && (
          <div>
            <p className="text-xs text-text-tertiary">Condução</p>
            <p className="font-medium tabular-nums">{formatValue(pedido.conducao || 0)}</p>
          </div>
        )}
        {(pedido.valor_km || 0) > 0 && (
          <div>
            <p className="text-xs text-text-tertiary">Quilometragem</p>
            <p className="font-medium tabular-nums">{formatValue(pedido.valor_km || 0)}</p>
          </div>
        )}
        {(pedido.valor_desconto || 0) > 0 && (
          <div>
            <p className="text-xs text-text-tertiary">Desconto</p>
            <p className="font-medium tabular-nums text-danger">-{formatValue(pedido.valor_desconto || 0)}</p>
          </div>
        )}
      </div>

      <div className="space-y-2">
        {(pedido.horas_extras || 0) > 0 && (
          <div>
            <p className="text-xs text-text-tertiary">Motivo das horas extras</p>
            <p className="text-sm text-text-secondary">{pedido.motivo_horas_extras || "Não informado"}</p>
          </div>
        )}
        {(pedido.valor_plantao || 0) > 0 && (
          <div>
            <p className="text-xs text-text-tertiary">Motivo do plantão</p>
            <p className="text-sm text-text-secondary">{pedido.motivo_plantao || "Não informado"}</p>
          </div>
        )}
        {(pedido.comissao || 0) > 0 && (
          <div>
            <p className="text-xs text-text-tertiary">Motivo da comissão</p>
            <p className="text-sm text-text-secondary">{pedido.motivo_comissao || "Não informado"}</p>
          </div>
        )}
        {(pedido.conducao || 0) > 0 && (
          <div>
            <p className="text-xs text-text-tertiary">Motivo da condução</p>
            <p className="text-sm text-text-secondary">{pedido.motivo_conducao || "Não informado"}</p>
          </div>
        )}
        {(pedido.valor_km || 0) > 0 && (
          <div>
            <p className="text-xs text-text-tertiary">Motivo da quilometragem</p>
            <p className="text-sm text-text-secondary">{pedido.motivo_km || "Não informado"}</p>
          </div>
        )}
        {(pedido.valor_desconto || 0) > 0 && (
          <div>
            <p className="text-xs text-text-tertiary">Motivo do desconto</p>
            <p className="text-sm text-text-secondary">{pedido.motivo_desconto || "Não informado"}</p>
          </div>
        )}
      </div>
    </div>
  )
}
