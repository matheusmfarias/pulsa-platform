import { ArrowLeft, ArrowRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";

type ListPaginationProps = {
  currentPage: number;
  pageCount: number;
  pageSize: number;
  total: number;
  label: string;
  getHref: (page: number) => string;
  getPageSizeHref: (pageSize: number) => string;
};

function visiblePages(currentPage: number, pageCount: number) {
  if (pageCount <= 7) return Array.from({ length: pageCount }, (_, index) => index + 1);
  const pages = new Set([1, pageCount, currentPage, currentPage - 1, currentPage + 1]);
  return [...pages].filter((page) => page >= 1 && page <= pageCount).sort((a, b) => a - b);
}

export function ListPagination({
  currentPage,
  pageCount,
  pageSize,
  total,
  label,
  getHref,
  getPageSizeHref,
}: ListPaginationProps) {
  if (total === 0) return null;

  const firstItem = (currentPage - 1) * pageSize + 1;
  const lastItem = Math.min(currentPage * pageSize, total);
  const pages = visiblePages(currentPage, pageCount);
  const previous = currentPage > 1 ? currentPage - 1 : null;
  const next = currentPage < pageCount ? currentPage + 1 : null;

  return (
    <nav
      aria-label={`Paginação: ${label}`}
      className="flex flex-col gap-3 border-t border-border-default/80 px-3 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-4"
    >
      <div className="flex flex-wrap items-center justify-between gap-3 sm:justify-start">
        <p aria-live="polite" className="text-xs tabular-nums text-muted-foreground">
          <span className="font-medium text-foreground">{firstItem}–{lastItem}</span> de {total}
        </p>
        <div aria-label="Itens por página" className="flex items-center gap-1.5" role="group">
          <span className="text-xs text-muted-foreground">Por página</span>
          {[10, 25, 50].map((size) => (
            <Button
              asChild
              aria-current={pageSize === size ? "true" : undefined}
              aria-label={`${size} itens por página`}
              className="h-10 min-w-10 px-2 text-xs tabular-nums sm:h-8 sm:min-w-8"
              key={size}
              size="sm"
              variant={pageSize === size ? "default" : "ghost"}
            >
              <Link href={getPageSizeHref(size)} scroll={false}>{size}</Link>
            </Button>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between gap-1 sm:justify-end">
        {previous ? (
          <Button asChild aria-label="Primeira página" className="hidden sm:inline-flex" size="icon" variant="ghost">
            <Link href={getHref(1)} scroll={false}><ChevronsLeft aria-hidden="true" className="size-4" /></Link>
          </Button>
        ) : <Button aria-label="Primeira página" className="hidden sm:inline-flex" disabled size="icon" variant="ghost"><ChevronsLeft aria-hidden="true" className="size-4" /></Button>}
        {previous ? (
          <Button asChild aria-label="Página anterior" className="min-h-11 sm:min-h-10" size="sm" variant="outline">
            <Link href={getHref(previous)} scroll={false}><ArrowLeft aria-hidden="true" className="size-4" /><span className="sm:hidden">Anterior</span></Link>
          </Button>
        ) : <Button aria-label="Página anterior" className="min-h-11 sm:min-h-10" disabled size="sm" variant="outline"><ArrowLeft aria-hidden="true" className="size-4" /><span className="sm:hidden">Anterior</span></Button>}

        <span className="px-2 text-xs font-medium tabular-nums text-muted-foreground sm:hidden">{currentPage} / {pageCount}</span>
        <div className="hidden items-center gap-1 sm:flex">
          {pages.map((page, index) => {
            const previousPage = pages[index - 1];
            return (
              <span className="flex items-center gap-1" key={page}>
                {previousPage && page - previousPage > 1 ? <span aria-hidden="true" className="px-1 text-xs text-muted-foreground">…</span> : null}
                {page === currentPage ? (
                  <Button aria-current="page" aria-label={`Página ${page}, atual`} className="size-9" size="icon">{page}</Button>
                ) : (
                  <Button asChild aria-label={`Ir para a página ${page}`} className="size-9 tabular-nums" size="icon" variant="ghost">
                    <Link href={getHref(page)} scroll={false}>{page}</Link>
                  </Button>
                )}
              </span>
            );
          })}
        </div>

        {next ? (
          <Button asChild aria-label="Próxima página" className="min-h-11 sm:min-h-10" size="sm" variant="outline">
            <Link href={getHref(next)} scroll={false}><span className="sm:hidden">Próxima</span><ArrowRight aria-hidden="true" className="size-4" /></Link>
          </Button>
        ) : <Button aria-label="Próxima página" className="min-h-11 sm:min-h-10" disabled size="sm" variant="outline"><span className="sm:hidden">Próxima</span><ArrowRight aria-hidden="true" className="size-4" /></Button>}
        {next ? (
          <Button asChild aria-label="Última página" className="hidden sm:inline-flex" size="icon" variant="ghost">
            <Link href={getHref(pageCount)} scroll={false}><ChevronsRight aria-hidden="true" className="size-4" /></Link>
          </Button>
        ) : <Button aria-label="Última página" className="hidden sm:inline-flex" disabled size="icon" variant="ghost"><ChevronsRight aria-hidden="true" className="size-4" /></Button>}
      </div>
    </nav>
  );
}
