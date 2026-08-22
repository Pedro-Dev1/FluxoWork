"use client"

import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ChevronLeft, ChevronRight } from "lucide-react"

interface SimplePagerProps {
  page: number
  pageSize: number
  totalItems: number
  onPageChange: (page: number) => void
  onPageSizeChange?: (size: number) => void
  pageSizeOptions?: number[]
}

export function SimplePager({
  page,
  pageSize,
  totalItems,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [25, 50, 100],
}: SimplePagerProps) {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize))
  const inicio = totalItems === 0 ? 0 : (page - 1) * pageSize + 1
  const fim = Math.min(totalItems, page * pageSize)

  if (totalItems === 0) return null

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 mt-3 border-t text-sm">
      <p className="text-muted-foreground tabular-nums">
        {inicio}–{fim} de {totalItems}
      </p>
      <div className="flex items-center gap-3">
        {onPageSizeChange && (
          <Select value={String(pageSize)} onValueChange={(v) => onPageSizeChange(Number(v))}>
            <SelectTrigger className="h-8 w-[110px] text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {pageSizeOptions.map((n) => (
                <SelectItem key={n} value={String(n)}>
                  {n} por página
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="sm"
            className="h-8 w-8 p-0"
            disabled={page <= 1}
            onClick={() => onPageChange(page - 1)}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-xs text-muted-foreground px-2 tabular-nums">
            {page} / {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            className="h-8 w-8 p-0"
            disabled={page >= totalPages}
            onClick={() => onPageChange(page + 1)}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
