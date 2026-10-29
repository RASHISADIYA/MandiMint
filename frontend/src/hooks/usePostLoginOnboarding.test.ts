import { describe, expect, it } from "vitest";
import { isTransientOnboardingPhase } from "./usePostLoginOnboarding";

describe("isTransientOnboardingPhase", () => {
  it("treats restoration and verification states as transient", () => {
    expect(isTransientOnboardingPhase("session_restoring")).toBe(true);
    expect(isTransientOnboardingPhase("wallet_pending")).toBe(true);
    expect(isTransientOnboardingPhase("wallet_creating")).toBe(true);
    expect(isTransientOnboardingPhase("network_pending")).toBe(true);
    expect(isTransientOnboardingPhase("role_verifying")).toBe(true);
  });

  it("does not treat definitive states as transient", () => {
    expect(isTransientOnboardingPhase("signed_out")).toBe(false);
    expect(isTransientOnboardingPhase("wallet_failed")).toBe(false);
    expect(isTransientOnboardingPhase("network_blocked")).toBe(false);
    expect(isTransientOnboardingPhase("role_unassigned")).toBe(false);
    expect(isTransientOnboardingPhase("role_error")).toBe(false);
    expect(isTransientOnboardingPhase("role_unconfigured")).toBe(false);
    expect(isTransientOnboardingPhase("complete")).toBe(false);
  });
});