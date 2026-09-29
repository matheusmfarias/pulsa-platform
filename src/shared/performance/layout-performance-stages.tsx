"use client";

import { createContext, useContext } from "react";

export type RouteServerStage = { label: string; durationMs: number };

const LayoutPerformanceStagesContext = createContext<RouteServerStage[]>([]);

export function LayoutPerformanceStagesProvider({
  children,
  serverStages,
}: {
  children: React.ReactNode;
  serverStages: RouteServerStage[];
}) {
  return (
    <LayoutPerformanceStagesContext.Provider value={serverStages}>
      {children}
    </LayoutPerformanceStagesContext.Provider>
  );
}

export function useLayoutPerformanceStages() {
  return useContext(LayoutPerformanceStagesContext);
}
