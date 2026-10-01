"use client";

import { Pencil } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useRef, type KeyboardEvent, type ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { ScrollShadow } from "@/components/ui/scroll-shadow";

import { parseWorkerDetailTab, type WorkerDetailTabId } from "./worker-detail-navigation";

type WorkerDetailTab = {
  id: WorkerDetailTabId;
  label: string;
  content: ReactNode;
};

export function WorkerDetailTabs({ tabs }: { tabs: WorkerDetailTab[] }) {
  const searchParams = useSearchParams();
  const requestedTab = parseWorkerDetailTab(searchParams.get("tab"));
  const activeId = tabs.some((tab) => tab.id === requestedTab) ? requestedTab : tabs[0].id;
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);

  function selectTab(id: WorkerDetailTabId) {
    const url = new URL(window.location.href);
    if (id === "assignments") url.searchParams.delete("tab");
    else url.searchParams.set("tab", id);
    window.history.replaceState(null, "", `${url.pathname}${url.search}${url.hash}`);
  }

  function onTabKeyDown(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    let nextIndex: number;
    switch (event.key) {
      case "ArrowRight":
        nextIndex = (index + 1) % tabs.length;
        break;
      case "ArrowLeft":
        nextIndex = (index - 1 + tabs.length) % tabs.length;
        break;
      case "Home":
        nextIndex = 0;
        break;
      case "End":
        nextIndex = tabs.length - 1;
        break;
      default:
        return;
    }
    event.preventDefault();
    selectTab(tabs[nextIndex].id);
    tabRefs.current[nextIndex]?.focus();
  }

  return (
    <div className="mt-8 rounded-card bg-surface px-5 shadow-card sm:px-7">
      <ScrollShadow className="border-b border-border-default" scrollAreaClassName="core-tab-scroll -mb-px">
        <div aria-label="Informações do colaborador" className="flex min-w-max gap-3 sm:gap-6" role="tablist">
          {tabs.map((tab, index) => {
            const selected = activeId === tab.id;
            return (
              <button
                aria-controls={`worker-panel-${tab.id}`}
                aria-selected={selected}
                className={`min-h-12 border-b-2 px-1 py-3 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-inset ${selected ? "border-action-primary text-foreground-default" : "border-transparent text-muted-foreground hover:text-foreground-default"}`}
                id={`worker-tab-${tab.id}`}
                key={tab.id}
                onClick={() => selectTab(tab.id)}
                onKeyDown={(event) => onTabKeyDown(event, index)}
                ref={(element) => { tabRefs.current[index] = element; }}
                role="tab"
                tabIndex={selected ? 0 : -1}
                type="button"
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </ScrollShadow>
      {tabs.map((tab) => (
        <div
          aria-labelledby={`worker-tab-${tab.id}`}
          hidden={activeId !== tab.id}
          id={`worker-panel-${tab.id}`}
          key={tab.id}
          role="tabpanel"
          tabIndex={0}
        >
          {activeId === tab.id ? tab.content : null}
        </div>
      ))}
    </div>
  );
}

export function WorkerEditLink({ workerId }: { workerId: string }) {
  const searchParams = useSearchParams();
  const tab = parseWorkerDetailTab(searchParams.get("tab"));
  const suffix = tab === "assignments" ? "" : `?tab=${tab}`;

  return (
    <Button asChild variant="outline">
      <Link href={`/app/workers/${workerId}/edit${suffix}`}>
        <Pencil aria-hidden="true" className="size-4" />
        Editar
      </Link>
    </Button>
  );
}
