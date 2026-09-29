"use client";

import { useEffect, useSyncExternalStore } from "react";
import { usePathname } from "next/navigation";

export type RouteServerStage = { label: string; durationMs: number };

type Props = {
  enabledByQuery: boolean;
  resultCount: number;
  route: string;
  serverStages: RouteServerStage[];
};

type TransitionMeasurement = { durationMs: number; route: string } | null;

declare global {
  interface Window {
    __pulsaLatestRouteMeasurement?: TransitionMeasurement;
  }
}

function subscribeToDiagnostics(onChange: () => void) {
  window.addEventListener("pulsa:perf-setting", onChange);
  return () => window.removeEventListener("pulsa:perf-setting", onChange);
}

function diagnosticsSnapshot() {
  return window.sessionStorage.getItem("pulsa:performance-diagnostics") === "on";
}

function subscribeToTransition(onChange: () => void) {
  window.addEventListener("pulsa:perf-transition", onChange);
  return () => window.removeEventListener("pulsa:perf-transition", onChange);
}

function transitionSnapshot() {
  return window.__pulsaLatestRouteMeasurement ?? null;
}

function serverSnapshot() {
  return false;
}

declare global {
  interface Window {
    __pulsaRouteTransition?: { startedAt: number; target: string };
  }
}

function navigationMetrics() {
  const navigation = performance.getEntriesByType("navigation")[0] as
    | PerformanceNavigationTiming
    | undefined;
  if (!navigation) return [];

  return [
    { label: "Resposta inicial (TTFB)", durationMs: Math.round(navigation.responseStart) },
    { label: "Documento carregado", durationMs: Math.round(navigation.loadEventEnd) },
  ].filter((stage) => stage.durationMs > 0);
}

export function RoutePerformanceDiagnostics({
  enabledByQuery,
  resultCount,
  route,
  serverStages,
}: Props) {
  const pathname = usePathname();
  const enabledInSession = useSyncExternalStore(subscribeToDiagnostics, diagnosticsSnapshot, serverSnapshot);
  const transition = useSyncExternalStore(subscribeToTransition, transitionSnapshot, () => null);

  useEffect(() => {
    if (enabledByQuery) {
      window.sessionStorage.setItem("pulsa:performance-diagnostics", "on");
      window.dispatchEvent(new Event("pulsa:perf-setting"));
      return;
    }
  }, [enabledByQuery]);

  useEffect(() => {
    const pending = window.__pulsaRouteTransition;
    if (!pending) return;

    const targetPath = new URL(pending.target, window.location.origin).pathname;
    if (targetPath !== pathname) return;

    window.__pulsaLatestRouteMeasurement = {
      durationMs: Math.round(performance.now() - pending.startedAt),
      route,
    };
    window.__pulsaRouteTransition = undefined;
    window.dispatchEvent(new Event("pulsa:perf-transition"));
  }, [pathname, route]);

  if (!enabledByQuery && !enabledInSession) return null;

  const browserStages = transition
    ? [{ label: `Navegação + dados + render (${transition.route})`, durationMs: transition.durationMs }]
    : navigationMetrics();

  return (
    <details className="mt-6 rounded-surface border border-border-default bg-surface px-4 py-3 text-sm">
      <summary className="cursor-pointer font-medium text-foreground">
        Diagnóstico de desempenho · {resultCount} {resultCount === 1 ? "registro" : "registros"}
      </summary>
      <div className="mt-3 grid gap-4 md:grid-cols-2">
        <section aria-label="Etapas no servidor">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Servidor</h3>
          <dl className="mt-2 space-y-2">
            {serverStages.map((stage) => (
              <div className="flex items-center justify-between gap-4" key={stage.label}>
                <dt>{stage.label}</dt>
                <dd className="font-mono tabular-nums">{stage.durationMs} ms</dd>
              </div>
            ))}
          </dl>
        </section>
        <section aria-label="Etapas no navegador">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Navegador</h3>
          <dl className="mt-2 space-y-2">
            {browserStages.length ? browserStages.map((stage) => (
              <div className="flex items-center justify-between gap-4" key={stage.label}>
                <dt>{stage.label}</dt>
                <dd className="font-mono tabular-nums">{stage.durationMs} ms</dd>
              </div>
            )) : <p className="text-muted-foreground">Aguardando a próxima navegação entre telas.</p>}
          </dl>
        </section>
      </div>
      <p className="mt-3 text-xs leading-5 text-muted-foreground">
        Medições locais desta sessão. A navegação inclui o carregamento dos dados e a renderização da tela.
      </p>
    </details>
  );
}
