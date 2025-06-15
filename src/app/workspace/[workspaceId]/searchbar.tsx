"use client";

import { Info, Search } from "lucide-react";
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

  // Add global keyboard shortcut (Ctrl + K) to open the CommandDialog
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
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
    <div className="w-full sm:ml-auto sm:w-auto">
      <Button
        size="sm"
        className="bg-accent/25 hover:bg-accent-25 w-full justify-start h-7 px-2"
        onClick={() => setOpen(true)}
      >
        <Search className="size-4 text-black mr-2" />
        <span className="text-black text-xs">Search {workspace?.name}</span>
      </Button>
      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Type a command or search..." />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          <CommandGroup heading="Channels">
            {getChannels.data?.map((channel) => (
              <CommandItem
                key={channel._id}
                onSelect={handleChannelClick(channel._id)}
              >
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
                {member.user.name}
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </div>
  );
};
