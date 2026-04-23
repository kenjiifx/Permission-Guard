import { describe, expect, it } from "vitest";
import { parsePolicyFromUnknown } from "../../src/core/parser.js";

describe("parser normalization", () => {
  it("normalizes string and array actions/resources", () => {
    const policy = parsePolicyFromUnknown(
      {
        Version: "2012-10-17",
        Statement: {
          Effect: "Allow",
          Action: "S3:GetObject",
          Resource: ["arn:aws:s3:::example/*"]
        }
      },
      "test.json"
    );
    expect(policy.statements).toHaveLength(1);
    expect(policy.statements[0]?.actions).toEqual(["s3:getobject"]);
    expect(policy.statements[0]?.resources).toEqual(["arn:aws:s3:::example/*"]);
  });

  it("throws on invalid schema", () => {
    expect(() =>
      parsePolicyFromUnknown(
        {
          Statement: [{ Effect: "Permit", Action: "*" }]
        },
        "broken.json"
      )
    ).toThrow();
  });
});
