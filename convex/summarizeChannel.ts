import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { action, ActionCtx } from "./_generated/server";
import { api } from "./_generated/api";
import { Id } from "./_generated/dataModel";

/** chunk helper */
const chunkText = (text: string, maxLen = 8000): string[] => {
  const chunks: string[] = [];
  for (let i = 0; i < text.length; i += maxLen) {
    chunks.push(text.slice(i, i + maxLen));
  }
  return chunks;
};

/** Hugging Face inference call with small retry/backoff */
const fetchSummaryFromHF = async (inputText: string): Promise<string> => {
  const token = process.env.HF_API_TOKEN;
  const model = process.env.HF_MODEL;
  if (!token || !model) {
    throw new Error("HF_API_TOKEN or HF_MODEL are not set");
  }

  const url = `https://api-inference.huggingface.co/models/${model}`;
  const body = JSON.stringify({ inputs: inputText });

  const maxAttempts = 3;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const resp = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body,
      });

      if (!resp.ok) {
        const text = await resp.text().catch(() => "");
        throw new Error(`HF inference error ${resp.status}: ${text}`);
      }

      const data = await resp.json();
      const summary = Array.isArray(data) ? data[0]?.summary_text ?? "" : data.summary_text ?? "";
      return summary || "No summary available.";
    } catch (err) {
      if (attempt === maxAttempts) throw err;
      await new Promise((r) => setTimeout(r, 200 * attempt));
    }
  }
  throw new Error("Unreachable");
};

/**
 * Explicit types to avoid circular inference
 */
type SummarizeArgs = {
  workspaceId: Id<"workspaces">;
  channelId: Id<"channels">;
  limit?: number;
};

type SummarizeResult = {
  id: Id<"summaries">;
  summary: string;
};

const handler = async (
  ctx: ActionCtx,
  args: SummarizeArgs
): Promise<SummarizeResult> => {
  const userId = await getAuthUserId(ctx);
  if (!userId) throw new Error("Unauthorized");

  const limit = args.limit ?? 50;

  // Use messages.get query (respects auth & shapes)
  // NOTE: Convex pagination expects { numItems, cursor }
  const queryRes = await ctx.runQuery(api.messages.get, {
    channelId: args.channelId,
    paginationOpts: { numItems: limit, cursor: null },
  });

  const messages = Array.isArray(queryRes?.page) ? queryRes.page : [];
  if (!messages || messages.length === 0) {
    throw new Error("No messages found to summarize");
  }

  // Build chronological conversation (messages.get returns newest first)
  const inputText = messages
    .map((m: any) => {
      const author = (m.user && (m.user as any).name) || "Unknown";
      const body = m.body ?? "";
      return `${author}: ${body}`;
    })
    .reverse()
    .join("\n");

  const maxChunkChars = parseInt(process.env.MAX_CHUNK_CHARS ?? "8000", 10);
  const chunks = chunkText(inputText, maxChunkChars);

  const chunkSummaries: string[] = [];
  for (const chunk of chunks) {
    const prompt = `Summarize the following chat notes. Keep it concise and extract any decisions / action items if present.\n\n${chunk}`;
    const s = await fetchSummaryFromHF(prompt);
    chunkSummaries.push(s);
  }

  const mergePrompt = `Merge and compress the following chunk summaries into a concise channel summary (2-4 sentences). Keep actions/decisions if any:\n\n${chunkSummaries.join(
    "\n\n"
  )}`;

  const finalSummary = await fetchSummaryFromHF(mergePrompt);

  const id: Id<"summaries"> = await ctx.runMutation(api.summaries.create, {
    workspaceId: args.workspaceId,
    channelId: args.channelId,
    summary: finalSummary,
  });

  return { id, summary: finalSummary };
};

export const summarizeChannel = action({
  args: {
    workspaceId: v.id("workspaces"),
    channelId: v.optional(v.id("channels")),
    limit: v.optional(v.number()),
  },
  handler,
});
