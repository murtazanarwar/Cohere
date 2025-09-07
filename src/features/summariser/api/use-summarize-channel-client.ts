import { useCallback, useState } from "react";
import { usePaginatedQuery } from "convex/react";
import { useCreateSummary } from "@/features/summariser/api/use-create-summary";
import { api } from "../../../../convex/_generated/api";
import { Id } from "../../../../convex/_generated/dataModel";

const chunkText = (text: string, maxLen = 7000) => {
  const out: string[] = [];
  for (let i = 0; i < text.length; i += maxLen) out.push(text.slice(i, i + maxLen));
  return out;
};

export const useSummarizeChannelClient = (
  workspaceId: Id<"workspaces">,
  channelId?: Id<"channels"> | null
) => {
  const channelArg = channelId ?? undefined;

  const { results: messages } = usePaginatedQuery(
    api.messages.get,
    { channelId: channelArg },          // args your query expects
    { initialNumItems: 120 }            // pagination options go here
  );

  const { mutate: saveSummary } = useCreateSummary();

  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [summary, setSummary] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const summarize = useCallback(async () => {
    if (!messages || messages.length === 0) return null;
    setIsPending(true);
    setError(null);
    setSummary(null);

    try {
      const content = messages
        .map((m: any) => `${m.user?.name || "Unknown"}: ${m.body ?? ""}`)
        .join("\n");

      const chunks = chunkText(content, parseInt(process.env.NEXT_PUBLIC_SUMMARY_CHUNK_CHARS ?? "7000", 10));
      setProgress({ done: 0, total: chunks.length });

      const chunkSummaries: string[] = [];
      for (let i = 0; i < chunks.length; i++) {
        const resp = await fetch("/api/summarize-chunk", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ chunk: chunks[i] }),
        });
        if (!resp.ok) throw new Error("Chunk summarization failed");
        const data = await resp.json();
        chunkSummaries.push(data.summary);
        setProgress((p) => ({ ...p, done: p.done + 1 }));
      }

      const mergeResp = await fetch("/api/summarize-merge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ summaries: chunkSummaries }),
      });
      if (!mergeResp.ok) throw new Error("Merge failed");
      const mergeData = await mergeResp.json();
      setSummary(mergeData.summary);

      await saveSummary({ workspaceId, channelId: channelArg, summary: mergeData.summary });

      return mergeData.summary;
    } catch (err) {
      setError(err as Error);
      return null;
    } finally {
      setIsPending(false);
      setProgress({ done: 0, total: 0 });
    }
  }, [messages, saveSummary, workspaceId, channelArg]);

  return { summarize, summary, error, isPending, progress };
};
