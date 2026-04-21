import { z } from "zod";

export const loginSchema = z.object({
  account: z.string().min(1, "请输入账号或手机号"),
  password: z.string().min(8, "密码至少 8 位")
});

export const registerSchema = z.object({
  name: z.string().min(2, "请输入姓名"),
  phone: z.string().regex(/^1\d{10}$/, "请输入有效手机号"),
  password: z.string().min(8, "密码至少 8 位")
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
