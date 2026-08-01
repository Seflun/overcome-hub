import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export const translateBatch = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) =>
    z
      .object({
        language: z.string().min(2).max(8),
        texts: z.array(z.string().min(1).max(400)).min(1).max(80),
      })
      .parse(data),
  )
  .handler(async ({ data }): Promise<{ texts: string[] } | { error: string }> => {
    try {
      const { translateStrings } = await import("@/lib/translate.server");
      return { texts: await translateStrings(data.texts, data.language) };
    } catch (error) {
      return { error: error instanceof Error ? error.message : "Translation failed" };
    }
  });
