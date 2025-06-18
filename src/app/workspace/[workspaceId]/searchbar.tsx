"use client";

import { Info, Search, Hash, User2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";

import { Button } from "@/components/ui/button";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";

import { Id } from "../../../../convex/_generated/dataModel";
import { useWorkspaceId } from "@/hooks/use-workspace-id";
import { useGetWorkspace } from "@/features/workspaces/api/use-get-workspace";
import { useGetChannels } from "@/features/channels/api/use-get-channels";
import { useGetMembers } from "@/features/members/api/use-get-members";

export const SearchBar = () => {
  const router = useRouter();
  const workspaceId = useWorkspaceId();

  const { data: workspace } = useGetWorkspace({ id: workspaceId });
  const getChannels = useGetChannels({ workspaceId });
  const getMembers = useGetMembers({ workspaceId });

  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleChannelClick = (channelId: Id<"channels">) => () => {
    setOpen(false);
    router.push(`/workspace/${workspaceId}/channel/${channelId}`);
  };

  const handleMemberClick = (memberId: Id<"members">) => () => {
    setOpen(false);
    router.push(`/workspace/${workspaceId}/member/${memberId}`);
  };

  return (
    <div className="w-full sm:ml-auto sm:max-w-sm">
      <Button
        size="sm"
        className="bg-muted hover:bg-muted/70 w-full justify-start h-8 px-3 border border-input text-xs text-muted-foreground"
        onClick={() => setOpen(true)}
        variant="ghost"
      >
        <Search className="mr-2 h-4 w-4 text-muted-foreground" />
        <span className="text-muted-foreground truncate">
          Search {workspace?.name}
        </span>
        <kbd className="ml-auto text-[10px] text-zinc-400 bg-zinc-100 border px-1 py-0.5 rounded">
          Ctrl + K
        </kbd>
      </Button>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Search channels or members..." />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>

          <CommandGroup heading="Channels">
            {getChannels.data?.map((channel) => (
              <CommandItem
                key={channel._id}
                onSelect={handleChannelClick(channel._id)}
              >
                <Hash className="mr-2 h-4 w-4 text-muted-foreground" />
                {channel.name}
              </CommandItem>
            ))}
          </CommandGroup>

          <CommandGroup heading="Members">
            {getMembers.data?.map((member) => (
              <CommandItem
                key={member._id}
                onSelect={handleMemberClick(member._id)}
              >
                <User2 className="mr-2 h-4 w-4 text-muted-foreground" />
                {member.user.name}
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </div>
  );
};
