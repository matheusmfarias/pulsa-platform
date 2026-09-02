import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it, vi } from "vitest";

import {
  applyOperationalContextFilter,
  OPERATIONAL_CONTEXT_QUERY_PATHS,
  parseOperationalContextCookie,
  resolveOperationalContextSelection,
  safePathAfterOperationalContextChange,
  serializeOperationalContext,
  type OperationalContextOption,
} from "@/modules/operational-context";

const clientId = "00000000-0000-4000-8000-000000000101";
const otherClientId = "00000000-0000-4000-8000-000000000102";
const contractId = "00000000-0000-4000-8000-000000000201";
const otherContractId = "00000000-0000-4000-8000-000000000202";

const options: OperationalContextOption[] = [
  {
    id: clientId,
    name: "Vértice Varejo",
    status: "active",
    contracts: [
      { id: contractId, name: "Contrato Nacional", status: "active" },
    ],
  },
  {
    id: otherClientId,
    name: "Horizonte Industrial",
    status: "active",
    contracts: [
      { id: otherContractId, name: "Facilities", status: "active" },
    ],
  },
];

describe("OperationalContext parsing and resolution", () => {
  it("parses all", () => {
    expect(parseOperationalContextCookie("all")).toEqual({ type: "all" });
  });

  it("resolves a valid client", () => {
    expect(
      resolveOperationalContextSelection(
        parseOperationalContextCookie(`client:${clientId}`),
        options,
      ),
    ).toEqual({ type: "client", clientId });
  });

  it("resolves a valid contract", () => {
    expect(
      resolveOperationalContextSelection(
        parseOperationalContextCookie(`contract:${clientId}:${contractId}`),
        options,
      ),
    ).toEqual({ type: "contract", clientId, contractId });
  });

  it("falls back to all for malformed or inaccessible clients", () => {
    expect(parseOperationalContextCookie("client:not-an-id")).toEqual({ type: "all" });
    expect(
      resolveOperationalContextSelection(
        { type: "client", clientId: "00000000-0000-4000-8000-000000000999" },
        options,
      ),
    ).toEqual({ type: "all" });
  });

  it("falls back to all for inaccessible contracts", () => {
    expect(
      resolveOperationalContextSelection(
        {
          type: "contract",
          clientId,
          contractId: "00000000-0000-4000-8000-000000000999",
        },
        options,
      ),
    ).toEqual({ type: "all" });
  });

  it("rejects a contract that does not belong to the selected client", () => {
    expect(
      resolveOperationalContextSelection(
        { type: "contract", clientId, contractId: otherContractId },
        options,
      ),
    ).toEqual({ type: "all" });
  });

  it("round-trips the persisted cookie value", () => {
    const context = { type: "contract", clientId, contractId } as const;
    expect(parseOperationalContextCookie(serializeOperationalContext(context))).toEqual(context);
  });
});

describe("OperationalContext database filters", () => {
  it.each([
    ["operations", OPERATIONAL_CONTEXT_QUERY_PATHS.operations],
    ["units", OPERATIONAL_CONTEXT_QUERY_PATHS.units],
    ["positions", OPERATIONAL_CONTEXT_QUERY_PATHS.positions],
    ["assignments", OPERATIONAL_CONTEXT_QUERY_PATHS.assignments],
    ["overview positions", OPERATIONAL_CONTEXT_QUERY_PATHS.positions],
    ["overview assignments", OPERATIONAL_CONTEXT_QUERY_PATHS.assignments],
  ] as const)("applies client and contract scope to %s", (_name, paths) => {
    const query = { eq: vi.fn() };
    query.eq.mockReturnValue(query);

    applyOperationalContextFilter(query, { type: "client", clientId }, paths);
    expect(query.eq).toHaveBeenLastCalledWith(paths.client, clientId);

    applyOperationalContextFilter(
      query,
      { type: "contract", clientId, contractId },
      paths,
    );
    expect(query.eq).toHaveBeenLastCalledWith(paths.contract, contractId);
  });

  it("does not add a filter for the consolidated view", () => {
    const query = { eq: vi.fn() };
    query.eq.mockReturnValue(query);
    expect(
      applyOperationalContextFilter(query, { type: "all" }, OPERATIONAL_CONTEXT_QUERY_PATHS.operations),
    ).toBe(query);
    expect(query.eq).not.toHaveBeenCalled();
  });
});

describe("OperationalContext navigation and global surfaces", () => {
  it.each([
    ["/app/operations/123/edit", "/app/operations"],
    ["/app/units/123", "/app/units"],
    ["/app/units/123/positions/new", "/app/positions"],
    ["/app/assignments/new", "/app/assignments"],
    ["/app/workers/123", "/app/workers"],
  ])("moves %s to the safe list %s", (pathname, destination) => {
    expect(safePathAfterOperationalContextChange(pathname)).toBe(destination);
  });

  it.each(["/app/clients", "/app/job-roles", "/app/admin/users", "/app/admin/audit"])(
    "keeps the global page %s unfiltered",
    (pathname) => {
      expect(safePathAfterOperationalContextChange(pathname)).toBe(pathname);
      const sourcePath = pathname === "/app/clients"
        ? "src/app/(authenticated)/app/clients/page.tsx"
        : pathname === "/app/job-roles"
          ? "src/app/(authenticated)/app/job-roles/page.tsx"
          : `src/app/(authenticated)${pathname}/page.tsx`;
      expect(readFileSync(resolve(sourcePath), "utf8")).not.toContain(
        "resolveOperationalContext",
      );
    },
  );
});
