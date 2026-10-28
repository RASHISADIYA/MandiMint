import { describe, expect, it } from "vitest";
import { classifyChainMatch } from "./verifyMstNetwork";

describe("classifyChainMatch", () => {
  it("reports connected when chain IDs match", () => {
    expect(classifyChainMatch(91562037, 91562037)).toBe("connected");
  });

  it("reports wrong_network when chain IDs differ", () => {
    expect(classifyChainMatch(1, 91562037)).toBe("wrong_network");
  });
});
