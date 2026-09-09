export const WORKER_PRESENCE_ACTIONS = ["start", "complete"] as const;
export type WorkerPresenceAction = (typeof WORKER_PRESENCE_ACTIONS)[number];

export type WorkerPresenceResult = {
  scheduleEntryId: string;
  status: "present" | "completed";
  arrivedAt: string;
  departedAt: string | null;
};

export type WorkerPresenceHistoryEntry = {
  scheduleEntryId: string;
  presenceStatus: "present" | "completed";
  arrivedAt: string;
  departedAt: string | null;
  startsAt: string;
  endsAt: string;
  localDate: string;
  operationName: string;
  unitName: string;
  unitTimezone: string;
  jobRoleName: string;
  workerRole: "original" | "replacement";
  arrivedAfterStart: boolean;
  departedBeforeEnd: boolean;
};

export type WorkerPresenceHistoryPage = {
  entries: WorkerPresenceHistoryEntry[];
  nextCursor: { arrivedAt: string; scheduleEntryId: string } | null;
};

export type WorkerPresenceActionState = {
  error: string | null;
  success?: boolean;
};
