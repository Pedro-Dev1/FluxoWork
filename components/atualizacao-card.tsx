"use client"

import { useEffect } from "react"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CategoriaAtualizacaoBadge } from "@/components/categoria-atualizacao-badge"
import { marcarAtualizacaoVisualizada } from "@/app/actions/atualizacoes"
import type { Atualizacao } from "@/types/atualizacao"

export function AtualizacaoCard({ atualizacao }: { atualizacao: Atualizacao }) {
  useEffect(() => {
    marcarAtualizacaoVisualizada(atualizacao.id).catch(() => {})
  }, [atualizacao.id])

  return (
    <Card className="overflow-hidden">
      {atualizacao.imagem_url && (
        <img src={atualizacao.imagem_url} alt="" className="w-full h-40 object-cover" />
      )}
      <CardContent className="p-6">
        <CategoriaAtualizacaoBadge categoria={atualizacao.categoria} />
        <h3 className="text-lg font-semibold text-foreground mt-3">{atualizacao.titulo}</h3>
        {atualizacao.subtitulo && (
          <p className="text-sm font-medium text-muted-foreground mt-1">{atualizacao.subtitulo}</p>
        )}
        <p className="text-sm text-muted-foreground mt-2 whitespace-pre-line">{atualizacao.descricao}</p>
        {atualizacao.cta_texto && atualizacao.cta_url && (
          <Button variant="outline" size="sm" className="mt-4" asChild>
            <Link href={atualizacao.cta_url}>{atualizacao.cta_texto}</Link>
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
