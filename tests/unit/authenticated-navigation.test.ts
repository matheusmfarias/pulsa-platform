import { describe, expect, it } from "vitest";

import {
  authenticatedNavigation,
  isNavigationItemActive,
} from "@/components/shared/authenticated-navigation";

const item = (label: string) => {
  const match = authenticatedNavigation
    .flatMap((group) => group.items)
    .find((navigationItem) => navigationItem.label === label);
  if (!match) throw new Error(`Navigation item ${label} was not found.`);
  return match;
};

describe("authenticated navigation", () => {
  it("uses the global posts route and retains the active state in nested post routes", () => {
    const positions = item("Postos");

    expect(positions.href).toBe("/app/positions");
    expect(isNavigationItemActive(positions, "/app/positions")).toBe(true);
    expect(isNavigationItemActive(positions, "/app/units/unit-id/positions/position-id")).toBe(true);
  });

  it("keeps units active only for unit routes, not for nested post routes", () => {
    const units = item("Unidades");

    expect(isNavigationItemActive(units, "/app/units/unit-id")).toBe(true);
    expect(isNavigationItemActive(units, "/app/units/unit-id/positions/position-id")).toBe(false);
  });
});
