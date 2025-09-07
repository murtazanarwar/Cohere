"use client";

import React, { useState } from "react";
import { useSummarizeChannel } from "@/features/summariser/api/use-sumamrize-channel";
import { Id } from "../../../../convex/_generated/dataModel";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, Sparkles } from "lucide-react";

export default function SummarizeButton({
  workspaceId,
  channelId,
}: {
  workspaceId: Id<"workspaces"> | string;
  channelId: Id<"channels"> | string | null;
}) {
  const { summarize, summary, error, isPending } = useSummarizeChannel(
    workspaceId as any,
    channelId as any
  );
  const [open, setOpen] = useState(false);

  const handleSummarize = async () => {
    await summarize({ limit: 120 });
    setOpen(true);
  };

  return (
    <div>
      <Button
        onClick={handleSummarize}
        disabled={isPending}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-white shadow-lg bg-gradient-to-r from-sky-500 to-indigo-500 hover:from-sky-600 hover:to-indigo-600 transition disabled:opacity-60"
      >
        {isPending ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Summarizing…
          </>
        ) : (
          <>
            <Sparkles className="w-4 h-4" />
            Summarize
          </>
        )}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl rounded-2xl shadow-2xl bg-white dark:bg-slate-900">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-sky-500" />
              Channel Summary
            </DialogTitle>
          </DialogHeader>

          {isPending && (
            <div className="flex flex-col items-center justify-center py-6 text-muted-foreground">
              <Loader2 className="w-6 h-6 animate-spin mb-2" />
              <span>Generating summary…</span>
            </div>
          )}

          {!isPending && summary && (
            <div className="mt-3 whitespace-pre-wrap text-sm leading-relaxed p-3 rounded-lg bg-slate-50 dark:bg-slate-800">
              {summary}
            </div>
          )}

          {!isPending && error && (
            <div className="mt-3 text-sm text-red-500">{error.message}</div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
