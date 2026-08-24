import { listarAuditoria } from "@/app/actions/tenants"
import { EmptyState } from "@/components/ui/empty-state"
import { AdminErroCarregamento } from "@/components/admin-erro-carregamento"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

const ACAO_LABELS: Record<string, string> = {
  carteira_criada: "Carteira criada",
  carteira_ativada: "Carteira ativada",
  carteira_desativada: "Carteira desativada",
  super_admin_promovido: "Super Admin promovido",
  super_admin_revogado: "Super Admin revogado",
  login_super_admin: "Login de Super Admin",
}

function nomeRelacionado(rel: any): string {
  if (!rel) return "—"
  const item = Array.isArray(rel) ? rel[0] : rel
  return item?.nome_completo || item?.nome || item?.email || "—"
}

export default async function AdminAuditoriaPage() {
  let registros: any[]
  try {
    registros = await listarAuditoria()
  } catch (error) {
    console.error("[v0] Erro ao carregar /admin/auditoria:", error)
    return <AdminErroCarregamento mensagem={error instanceof Error ? error.message : undefined} />
  }

  if (registros.length === 0) {
    return <EmptyState title="Nenhum registro ainda" description="Ações privilegiadas do sistema aparecem aqui." />
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Quando</TableHead>
            <TableHead>Quem</TableHead>
            <TableHead>Ação</TableHead>
            <TableHead>Carteira</TableHead>
            <TableHead>Detalhes</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {registros.map((r: any) => (
            <TableRow key={r.id}>
              <TableCell className="whitespace-nowrap tabular-nums">
                {format(new Date(r.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
              </TableCell>
              <TableCell>{nomeRelacionado(r.colaborador)}</TableCell>
              <TableCell>{ACAO_LABELS[r.acao] || r.acao}</TableCell>
              <TableCell>{nomeRelacionado(r.tenant)}</TableCell>
              <TableCell className="text-xs text-muted-foreground max-w-xs truncate">
                {r.detalhes ? JSON.stringify(r.detalhes) : ""}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
