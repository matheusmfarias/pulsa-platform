export type WorkerDetailTabId = "assignments" | "record" | "access";

export function parseWorkerDetailTab(value: string | string[] | null | undefined): WorkerDetailTabId {
  return value === "record" || value === "access" ? value : "assignments";
}
