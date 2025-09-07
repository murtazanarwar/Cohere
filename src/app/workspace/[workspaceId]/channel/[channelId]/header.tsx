"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { ChevronDown, TrashIcon, Sparkles } from "lucide-react";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { useChannelId } from "@/hooks/use-channel-id";
import { useUpdateChannel } from "@/features/channels/api/use-update-channel";
import { toast } from "sonner";
import { useRemoveChannel } from "@/features/channels/api/use-remove-channel";
import { useConfirm } from "@/hooks/use-confirm";
import { useRouter } from "next/navigation";
import { useWorkspaceId } from "@/hooks/use-workspace-id";
import { useCurrentMember } from "@/features/members/api/use-current-member";
import { useSummarizeChannel } from "@/features/summariser/api/use-sumamrize-channel";

interface HeaderProps {
  title: string;
}

export const Header = ({ title }: HeaderProps) => {
  const channelId = useChannelId();
  const workspaceId = useWorkspaceId();
  const router = useRouter();

  const [editOpen, setEditOpen] = useState(false);
  const [value, setValue] = useState(title);
  const [ConfirmDialog, confirm] = useConfirm(
    "Delete this channel?",
    "You can't undo this action"
  );

  const { mutate: updateChannel, isPending: isUpdatingChannel } =
    useUpdateChannel();
  const { mutate: removeChannel, isPending: isRemovingChannel } =
    useRemoveChannel();
  const { data: member } = useCurrentMember({ workspaceId });

  const { summarize, summary, error, isPending } = useSummarizeChannel(
    workspaceId as any,
    channelId as any
  );
  const [summaryOpen, setSummaryOpen] = useState(false);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    updateChannel(
      { id: channelId, name: value },
      {
        onSuccess: () => {
          toast.success("Channel updated successfully");
          setEditOpen(false);
        },
        onError: () => {
          toast.error("Failed to update channel");
        },
      }
    );
  };

  const handleDelete = async () => {
    const ok = await confirm();
    if (!ok) return;

    removeChannel(
      { id: channelId },
      {
        onSuccess: () => {
          router.push(`/workspace/${workspaceId}`);
          toast.success("Channel deleted successfully");
        },
        onError: () => {
          toast.error("Failed to delete channel");
        },
      }
    );
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\s+/g, "-").toLowerCase();
    setValue(value);
  };

  const handleEditOpen = (value: boolean) => {
    if (member?.role !== "admin") return;
    setEditOpen(value);
  };

  return (
    <div>
      <ConfirmDialog />
      <Dialog>
        <DialogTrigger asChild>
          <Button
            variant="regular"
            className="overflow-hidden bg-white dark:bg-slate-900 hover:bg-gray-100 dark:hover:bg-slate-800"
            size="sm"
          >
            <span className="truncate text-black dark:text-white">{title}</span>
            <ChevronDown className="text-black dark:text-white" />
          </Button>
        </DialogTrigger>
        <DialogContent className="p-0 bg-gray-50 dark:bg-slate-900 overflow-hidden rounded-xl shadow-lg">
          <DialogHeader className="p-4 border-b bg-white dark:bg-slate-900">
            <DialogTitle className="text-base font-semibold text-gray-900 dark:text-white">
              # {title}
            </DialogTitle>
          </DialogHeader>

          <div className="px-4 pb-4 flex flex-col gap-y-3">
            {/* Summarize Button */}
            <div className="px-5 py-4 bg-white dark:bg-slate-800 rounded-lg border cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-700 flex items-center justify-between">
              <div className="flex items-center gap-x-2">
                <Sparkles className="w-4 h-4 text-sky-600" />
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  Summarize Channel
                </p>
              </div>
              <Button
                size="sm"
                disabled={isPending}
                onClick={async () => {
                  setSummaryOpen(true);
                  await summarize({ limit: 120 });
                }}
                className="bg-sky-600 hover:bg-sky-700 text-white"
              >
                {isPending ? "Summarizing…" : "Summarize"}
              </Button>
            </div>

            {/* Edit channel name */}
            <Dialog open={editOpen} onOpenChange={handleEditOpen}>
              <DialogTrigger asChild>
                <div className="px-5 py-4 bg-white dark:bg-slate-800 rounded-lg border cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-700">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      Channel name
                    </p>
                    {member?.role === "admin" && (
                      <p className="text-sm text-sky-600 hover:underline font-medium">
                        Edit
                      </p>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    # {title}
                  </p>
                </div>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle className="text-base font-semibold">
                    Rename this channel
                  </DialogTitle>
                </DialogHeader>
                <form className="space-y-4" onSubmit={handleSubmit}>
                  <Input
                    value={value}
                    disabled={isUpdatingChannel}
                    onChange={handleChange}
                    required
                    autoFocus
                    minLength={3}
                    maxLength={80}
                    placeholder="eg. marketing"
                  />
                  <DialogFooter>
                    <DialogClose asChild>
                      <Button variant="outline" disabled={isUpdatingChannel}>
                        Cancel
                      </Button>
                    </DialogClose>
                    <Button disabled={isUpdatingChannel}>Save</Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>

            {/* Delete channel */}
            {member?.role === "admin" && (
              <button
                className="flex items-center gap-x-2 px-5 py-4 bg-white dark:bg-slate-800 rounded-lg cursor-pointer border hover:bg-gray-50 dark:hover:bg-slate-700 text-rose-600"
                onClick={handleDelete}
                disabled={isRemovingChannel}
              >
                <TrashIcon className="size-4" />
                <p className="text-sm font-medium">Delete Channel</p>
              </button>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Summary Modal */}
      <Dialog open={summaryOpen} onOpenChange={setSummaryOpen}>
        <DialogContent className="max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl p-6">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-white">
              <Sparkles className="w-5 h-5 text-sky-600" />
              Channel Summary
            </DialogTitle>
          </DialogHeader>
          {isPending && (
            <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">
              Summarizing… please wait
            </p>
          )}
          {summary && (
            <div className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-gray-800 dark:text-gray-200">
              {summary}
            </div>
          )}
          {error && (
            <p className="mt-3 text-sm text-red-500">{error.message}</p>
          )}
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Close</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
