export type CategoriaAtualizacao =
  | "NOVA FUNCIONALIDADE"
  | "MELHORIA"
  | "IMPORTANTE"
  | "AVISO"
  | "FINANCEIRO"
  | "AÇÃO NECESSÁRIA"
  | "INFORMATIVO"

export type StatusAtualizacao = "DRAFT" | "PUBLISHED" | "INACTIVE"

export interface Atualizacao {
  id: string
  titulo: string
  subtitulo: string | null
  descricao: string
  categoria: CategoriaAtualizacao
  imagem_url: string | null
  cta_texto: string | null
  cta_url: string | null
  status: StatusAtualizacao
  destaque: boolean
  exibir_na_plataforma: boolean
  enviar_email: boolean
  publish_at: string | null
  expires_at: string | null
  tenant_id: string | null
  roles: string[] | null
  criado_por: string | null
  created_at: string
  updated_at: string
}

export interface NovaAtualizacao {
  titulo: string
  subtitulo?: string
  descricao: string
  categoria: CategoriaAtualizacao
  imagem_url?: string
  cta_texto?: string
  cta_url?: string
  destaque?: boolean
  exibir_na_plataforma?: boolean
  enviar_email?: boolean
  publish_at?: string | null
  expires_at?: string | null
  tenant_id?: string | null
  roles?: string[] | null
}
