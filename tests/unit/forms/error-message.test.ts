import { describe, expect, it } from "vitest";
import { getErrorMessage } from "@/lib/forms/error-message";

describe("getErrorMessage", () => {
  it("returns string errors directly", () => {
    expect(getErrorMessage("账号或密码错误", "登录失败")).toBe("账号或密码错误");
  });

  it("extracts the first flattened zod field error", () => {
    expect(
      getErrorMessage(
        {
          fieldErrors: {
            phone: ["请输入有效手机号"],
            password: ["密码至少 8 位"]
          },
          formErrors: []
        },
        "注册失败"
      )
    ).toBe("请输入有效手机号");
  });

  it("falls back when the payload has no readable message", () => {
    expect(getErrorMessage({ fieldErrors: {} }, "上传失败")).toBe("上传失败");
  });
});
