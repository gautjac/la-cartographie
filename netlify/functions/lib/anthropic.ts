import Anthropic from "@anthropic-ai/sdk";

export const MODEL = "claude-opus-4-8";

export function client(): Anthropic {
  const apiKey = process.env.CLAUDE_API_KEY;
  if (!apiKey) throw new Error("Server missing CLAUDE_API_KEY");
  return new Anthropic({ apiKey, baseURL: "https://api.anthropic.com" });
}

/**
 * Wrap a long-running task in an NDJSON keepalive stream: write bare-newline
 * heartbeats every 3s while awaiting Claude, then a final {"result"} or
 * {"error"} JSON line. The client parses the last non-empty line.
 */
export function ndjson(run: () => Promise<unknown>): Response {
  const enc = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      let done = false;
      const beat = setInterval(() => {
        if (!done) {
          try {
            controller.enqueue(enc.encode("\n"));
          } catch {
            /* stream closed */
          }
        }
      }, 3000);
      try {
        const result = await run();
        done = true;
        clearInterval(beat);
        controller.enqueue(enc.encode(JSON.stringify({ result }) + "\n"));
      } catch (err) {
        done = true;
        clearInterval(beat);
        const message = err instanceof Error ? err.message : "unknown error";
        controller.enqueue(enc.encode(JSON.stringify({ error: message }) + "\n"));
      } finally {
        controller.close();
      }
    },
  });
  return new Response(stream, {
    status: 200,
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Accel-Buffering": "no",
    },
  });
}

/** Pull the single forced tool_use input object out of a messages response. */
export function toolInput(
  res: Anthropic.Messages.Message,
): Record<string, unknown> {
  const block = res.content.find((b) => b.type === "tool_use");
  const u = res.usage;
  console.log(
    `[la-cartographie] ${block?.type === "tool_use" ? block.name : "no tool"}: input=${u.input_tokens} cache_read=${u.cache_read_input_tokens ?? 0} cache_write=${u.cache_creation_input_tokens ?? 0} output=${u.output_tokens}`,
  );
  if (!block || block.type !== "tool_use") {
    throw new Error("Model did not return a tool call");
  }
  return block.input as Record<string, unknown>;
}
