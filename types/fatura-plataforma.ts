export type StatusFaturaPlataforma = "pendente" | "emitida" | "paga" | "falhou" | "cancelada" | "vencida"

export interface FaturaPlataforma {
  id: string
  tenant_id: string
  referencia_ano: number
  referencia_mes: number
  quantidade_usuarios_ativos: number
  valor_unitario: number
  valor_total: number
  status: StatusFaturaPlataforma
  pagarme_order_id: string | null
  pagarme_charge_id: string | null
  boleto_url: string | null
  boleto_linha_digitavel: string | null
  boleto_codigo_barras: string | null
  data_vencimento: string | null
  data_pagamento: string | null
  erro_mensagem: string | null
  created_at: string
  updated_at: string
}

export interface CarteiraFaturamento {
  id: string
  nome: string
  ativo: boolean
  valor_por_usuario_ativo: number | null
  dia_faturamento: number | null
  documento: string | null
  email_faturamento: string | null
  telefone_faturamento: string | null
  endereco_logradouro: string | null
  endereco_complemento: string | null
  endereco_cep: string | null
  endereco_cidade: string | null
  endereco_uf: string | null
  usuarios_ativos: number
}
