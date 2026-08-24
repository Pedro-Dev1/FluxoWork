"use client"

import { useEffect, useState } from "react"
import { Bell } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { ptBR } from "date-fns/locale"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { EmptyState } from "@/components/ui/empty-state"
import {
  contarNotificacoesNaoLidas,
  listarMinhasNotificacoes,
  marcarNotificacaoLida,
  marcarTodasNotificacoesLidas,
} from "@/app/actions/notificacoes"

interface NotificacaoItem {
  id: string
  lido_em: string | null
  created_at: string
  notificacao: {
    id: string
    titulo: string
    mensagem: string
    cta_texto: string | null
    cta_url: string | null
    created_at: string
  } | null
}

function normalizarNotificacao(raw: any): NotificacaoItem["notificacao"] {
  return Array.isArray(raw) ? raw[0] || null : raw || null
}

export function NotificacoesBell() {
  const router = useRouter()
  const [aberto, setAberto] = useState(false)
  const [naoLidas, setNaoLidas] = useState(0)
  const [itens, setItens] = useState<NotificacaoItem[]>([])
  const [carregando, setCarregando] = useState(false)

  useEffect(() => {
    const buscarContagem = async () => {
      try {
        setNaoLidas(await contarNotificacoesNaoLidas())
      } catch {}
    }
    buscarContagem()
    const interval = setInterval(buscarContagem, 30000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (!aberto) return
    const carregar = async () => {
      setCarregando(true)
      try {
        const dados = await listarMinhasNotificacoes()
        setItens(dados as unknown as NotificacaoItem[])
      } catch {
      } finally {
        setCarregando(false)
      }
    }
    carregar()
  }, [aberto])

  const handleClickItem = async (item: NotificacaoItem) => {
    const notificacao = normalizarNotificacao(item.notificacao)
    if (!item.lido_em) {
      await marcarNotificacaoLida(item.id)
      setNaoLidas((prev) => Math.max(0, prev - 1))
      setItens((prev) => prev.map((i) => (i.id === item.id ? { ...i, lido_em: new Date().toISOString() } : i)))
    }
    if (notificacao?.cta_url) {
      setAberto(false)
      router.push(notificacao.cta_url)
    }
  }

  const handleMarcarTodas = async () => {
    await marcarTodasNotificacoesLidas()
    setNaoLidas(0)
    setItens((prev) => prev.map((i) => ({ ...i, lido_em: i.lido_em || new Date().toISOString() })))
  }

  return (
    <Sheet open={aberto} onOpenChange={setAberto}>
      <Button
        variant="ghost"
        size="icon"
        className="relative shrink-0 h-8 w-8"
        title="Notificações"
        onClick={() => setAberto(true)}
      >
        <Bell className="h-4 w-4 text-muted-foreground" />
        {naoLidas > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-primary text-primary-foreground text-[10px] font-bold px-1 tabular-nums">
            {naoLidas > 9 ? "9+" : naoLidas}
          </span>
        )}
      </Button>

      <SheetContent side="right" className="flex flex-col gap-0 p-0 sm:max-w-md">
        <SheetHeader className="p-4 border-b">
          <div className="flex items-center justify-between">
            <SheetTitle>Notificações</SheetTitle>
            {naoLidas > 0 && (
              <Button variant="ghost" size="sm" className="text-xs h-7" onClick={handleMarcarTodas}>
                Marcar todas como lidas
              </Button>
            )}
          </div>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto">
          {carregando ? (
            <div className="p-4 text-sm text-muted-foreground">Carregando...</div>
          ) : itens.length === 0 ? (
            <EmptyState
              title="Nenhuma notificação"
              description="Você será avisado aqui quando houver algo novo para você."
            />
          ) : (
            itens.map((item) => {
              const notificacao = normalizarNotificacao(item.notificacao)
              if (!notificacao) return null
              const lida = !!item.lido_em

              return (
                <button
                  key={item.id}
                  onClick={() => handleClickItem(item)}
                  className="w-full text-left px-4 py-3 border-b last:border-b-0 hover:bg-surface transition-colors"
                >
                  <div className="flex items-start gap-2">
                    {!lida && <span className="mt-1.5 h-2 w-2 rounded-full bg-primary shrink-0" />}
                    <div className={lida ? "flex-1 pl-4" : "flex-1"}>
                      <p className={lida ? "text-sm font-normal text-foreground" : "text-sm font-medium text-foreground"}>
                        {notificacao.titulo}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">{notificacao.mensagem}</p>
                      <p className="text-[11px] text-text-tertiary mt-1">
                        {formatDistanceToNow(new Date(item.created_at), { addSuffix: true, locale: ptBR })}
                      </p>
                    </div>
                  </div>
                </button>
              )
            })
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
