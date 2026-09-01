type LogEvent = {
  event: string;
  errorCode?: string;
  operation?: string;
};

function write(level: "info" | "error", details: LogEvent): void {
  const record = JSON.stringify({
    level,
    timestamp: new Date().toISOString(),
    ...details,
  });

  if (level === "error") {
    console.error(record);
    return;
  }

  console.info(record);
}

export const logger = {
  info(details: LogEvent): void {
    write("info", details);
  },
  error(details: LogEvent): void {
    write("error", details);
  },
};
