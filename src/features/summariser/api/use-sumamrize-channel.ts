import { useCallback, useState } from "react";
import { useAction } from "convex/react"; // ✅ must useAction
import { Id } from "../../../../convex/_generated/dataModel";
import { api } from "../../../../convex/_generated/api";

export const useSummarizeChannel = (
  workspaceId: Id<"workspaces">,
  channelId: Id<"channels">
) => {
  const [summary, setSummary] = useState<string | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [isPending, setIsPending] = useState(false);

  const summarizeAction = useAction(api.summarizeChannel.summarizeChannel);

  const summarize = useCallback(
    async (opts?: { limit?: number }) => {
      setIsPending(true);
      setError(null);
      setSummary(null);
      try {
        const res = await summarizeAction({
          workspaceId,
          channelId: channelId,
          limit: opts?.limit,
        });
        setSummary(res?.summary ?? null);
        return res?.summary ?? null;
      } catch (err) {
        setError(err as Error);
        return null;
      } finally {
        setIsPending(false);
      }
    },
    [summarizeAction, workspaceId, channelId]
  );

  return { summarize, summary, error, isPending };
};
