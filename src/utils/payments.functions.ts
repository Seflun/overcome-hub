import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const inputSchema = z.object({
  priceId: z.string().min(1),
  environment: z.enum(["sandbox", "live"]),
});

export const resolvePaddlePrice = createServerFn({ method: "GET" })
  .inputValidator((data: unknown) => inputSchema.parse(data))
  .handler(async ({ data }) => {
    const { gatewayFetch } = await import("@/lib/paddle.server");
    const response = await gatewayFetch(
      data.environment,
      `/prices?external_id=${encodeURIComponent(data.priceId)}`
    );
    const result = await response.json();
    if (!result.data?.length) throw new Error(`Price not found: ${data.priceId}`);
    return result.data[0].id as string;
  });
