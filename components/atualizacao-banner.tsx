"use client"

import { useEffect, useState } from "react"
import { Megaphone, X } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { dispensarAtualizacao, marcarAtualizacaoVisualizada } from "@/app/actions/atualizacoes"

interface AtualizacaoBannerProps {
  atualizacao: {
    id: string
    titulo: string
    subtitulo: string | null
    cta_texto: string | null
    cta_url: string | null
  } | null
}

export function AtualizacaoBanner({ atualizacao }: AtualizacaoBannerProps) {
  const [dispensada, setDispensada] = useState(false)

  useEffect(() => {
    if (atualizacao) {
      marcarAtualizacaoVisualizada(atualizacao.id).catch(() => {})
    }
  }, [atualizacao])

  if (!atualizacao || dispensada) return null

  const handleDispensar = () => {
    setDispensada(true)
    dispensarAtualizacao(atualizacao.id).catch(() => {})
  }

  return (
    <div className="mb-6 flex items-start gap-3 rounded-lg border border-border bg-card px-4 py-3">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
        <Megaphone className="h-4 w-4 text-primary" />
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground">{atualizacao.titulo}</p>
        {atualizacao.subtitulo && <p className="text-sm text-muted-foreground mt-0.5">{atualizacao.subtitulo}</p>}
      </div>

      {atualizacao.cta_texto && atualizacao.cta_url && (
        <Button variant="outline" size="sm" className="shrink-0" asChild>
          <Link href={atualizacao.cta_url}>{atualizacao.cta_texto}</Link>
        </Button>
      )}

      <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={handleDispensar} title="Dispensar">
        <X className="h-4 w-4 text-muted-foreground" />
      </Button>
    </div>
  )
}
