import { z } from "zod";
export const mcpInputSchema = z
  .object({
    name: z.string().trim().min(1).max(100).optional(),
    description: z.string().max(2000).optional(),
    transport: z.enum(["stdio", "sse", "http"]).optional(),
    command: z.string().max(500).optional(),
    script_path: z.string().max(1000).optional(),
    args: z.array(z.string().max(2000)).max(50).optional(),
    env_vars: z.record(z.string().min(1), z.string().max(4096)).optional(),
    url: z
      .union([z.literal(""), z.url().refine((v) => /^https?:\/\//.test(v))])
      .optional(),
    headers: z.record(z.string().min(1), z.string().max(4096)).optional(),
    is_enabled: z.boolean().optional(),
    is_default: z.boolean().optional(),
    timeout_seconds: z.number().int().min(1).max(300).optional(),
  })
  .strict();
