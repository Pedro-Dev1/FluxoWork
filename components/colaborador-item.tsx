"use client"

import type { Colaborador } from "@/types/colaborador"
import { Button } from "@/components/ui/button"
import { Trash2, User, Pencil, EyeOff, UserX, UserCheck } from "lucide-react"
import { deletarColaborador, alterarStatusAtivoColaborador } from "@/app/actions/colaboradores"
import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { ColaboradorEditDialog } from "./colaborador-edit-dialog"
import { formatCurrency } from "@/lib/utils"
import { PasswordConfirmDialog } from "./password-confirm-dialog"
import { toast } from "sonner"

interface ColaboradorItemProps {
  colaborador: Colaborador
  usuarioLogadoTipoAcesso?: string
}

const getTipoAcessoVariant = (tipo: string) => {
  switch (tipo) {
    case "Adm":
      return "default"
    case "Financeiro":
      return "secondary"
    case "Gerente":
      return "outline"
    case "Supervisor":
      return "outline"
    default:
      return "outline"
  }
}

export function ColaboradorItem({ colaborador, usuarioLogadoTipoAcesso }: ColaboradorItemProps) {
  const [loading, setLoading] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false)
  const [desativarDialogOpen, setDesativarDialogOpen] = useState(false)

  const isAtivo = colaborador.ativo !== false

  const handleDelete = async () => {
    setPasswordDialogOpen(true)
  }

  const handleConfirmDelete = async () => {
    setLoading(true)
    try {
      await deletarColaborador(colaborador.id)
    } catch (error) {
      console.error("[v0] Erro ao deletar:", error)
      const errorMessage = error instanceof Error ? error.message : "Erro ao deletar colaborador"
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const handleToggleAtivo = () => {
    if (isAtivo) {
      setDesativarDialogOpen(true)
    } else {
      handleReativar()
    }
  }

  const handleConfirmDesativar = async () => {
    setLoading(true)
    try {
      await alterarStatusAtivoColaborador(colaborador.id, false)
      toast.success(`${colaborador.nome_completo} foi desativado`)
    } catch (error) {
      console.error("[v0] Erro ao desativar colaborador:", error)
      toast.error(error instanceof Error ? error.message : "Erro ao desativar colaborador")
    } finally {
      setLoading(false)
    }
  }

  const handleReativar = async () => {
    setLoading(true)
    try {
      await alterarStatusAtivoColaborador(colaborador.id, true)
      toast.success(`${colaborador.nome_completo} foi reativado`)
    } catch (error) {
      console.error("[v0] Erro ao reativar colaborador:", error)
      toast.error(error instanceof Error ? error.message : "Erro ao reativar colaborador")
    } finally {
      setLoading(false)
    }
  }

  const salarioOculto = colaborador.salario === null || colaborador.salario === undefined
  // Financeiro não pode deletar nem editar perfil Adm
  const isFinanceiro = usuarioLogadoTipoAcesso === "Financeiro"
  const colaboradorEhAdm = colaborador.tipo_acesso === "Adm"
  const podeGerenciar = !(isFinanceiro && colaboradorEhAdm)

  return (
    <>
      <div className={`flex items-center justify-between gap-2 p-4 border rounded-lg hover:bg-accent/50 transition-colors ${!isAtivo ? "opacity-60" : ""}`}>
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
            <User className="w-5 h-5 text-primary" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="font-medium truncate">{colaborador.nome_completo}</p>
              <Badge className="shrink-0" variant={getTipoAcessoVariant(colaborador.tipo_acesso)}>{colaborador.tipo_acesso}</Badge>
              {!isAtivo && (
                <Badge className="shrink-0 bg-danger-subtle text-danger" variant="outline">Inativo</Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground truncate">{colaborador.email}</p>
            <p className="text-sm text-muted-foreground truncate">
              {salarioOculto ? (
                <span className="inline-flex items-center gap-1">
                  {"Salário: "}<EyeOff className="w-3 h-3" />{" Confidencial"}
                </span>
              ) : (
                `Salário: ${formatCurrency(colaborador.salario)}`
              )}{" "}
              {"• CNPJ: "}{colaborador.cnpj}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {podeGerenciar && (
            <Button variant="ghost" size="icon" onClick={() => setEditDialogOpen(true)}>
              <Pencil className="w-4 h-4 text-primary" />
            </Button>
          )}
          {podeGerenciar && (
            <Button
              variant="ghost"
              size="icon"
              onClick={handleToggleAtivo}
              disabled={loading}
              title={isAtivo ? "Desativar usuário" : "Reativar usuário"}
            >
              {isAtivo ? <UserX className="w-4 h-4 text-warning" /> : <UserCheck className="w-4 h-4 text-success" />}
            </Button>
          )}
          {podeGerenciar && (
            <Button variant="ghost" size="icon" onClick={handleDelete} disabled={loading}>
              <Trash2 className="w-4 h-4 text-destructive" />
            </Button>
          )}
        </div>
      </div>

      <ColaboradorEditDialog colaborador={colaborador} open={editDialogOpen} onOpenChange={setEditDialogOpen} usuarioLogadoTipoAcesso={usuarioLogadoTipoAcesso} />

      <PasswordConfirmDialog
        open={desativarDialogOpen}
        onOpenChange={setDesativarDialogOpen}
        onConfirm={handleConfirmDesativar}
        title="Confirmar desativação de usuário"
        description={`Tem certeza que deseja desativar ${colaborador.nome_completo}? A pessoa não conseguirá mais fazer login, mas o histórico de pedidos é mantido. Você pode reativar a qualquer momento.`}
        confirmLabel="Confirmar desativação"
      />

      <PasswordConfirmDialog
        open={passwordDialogOpen}
        onOpenChange={setPasswordDialogOpen}
        onConfirm={handleConfirmDelete}
        title="Confirmar Exclusão de Colaborador"
        description={`Tem certeza que deseja excluir o colaborador ${colaborador.nome_completo}? Esta ação não pode ser desfeita.`}
      />
    </>
  )
}
