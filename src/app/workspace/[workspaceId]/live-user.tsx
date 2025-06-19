"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useGetLiveMembersInChannel } from "@/features/presence/api/use-get-live-members-in-channel";
import { useChannelId } from "@/hooks/use-channel-id";
import { useWorkspaceId } from "@/hooks/use-workspace-id";
import { Dot } from "lucide-react";


const LiveUsers = () => {
  const channelId = useChannelId();
  const workspaceId = useWorkspaceId();
  const {data: liveMembers, isLoading: liveMembersLoading} = useGetLiveMembersInChannel({workspaceId, channelId});

  if(!liveMembers) {
    return null;
  }
  const displayMembers = liveMembers.slice(0, 3);
  const remainingCount = liveMembers.length - displayMembers.length;

  return (
    <div className="ml-auto">
      <div className="flex items-center gap-2 border border-zinc-300 rounded-full px-2 py-1 h-10 w-fit bg-white shadow-sm">
        <div className="flex -space-x-4">
          {displayMembers?.map((member) => (
            <Avatar
              key={member._id}
              className="w-8 h-8 ring-2 ring-white data-[slot=avatar]:grayscale rounded-full"
            >
              <AvatarImage src={member?.image} />
              <AvatarFallback className="rounded-full">{member?.name?.charAt(0).toUpperCase()}</AvatarFallback>
            </Avatar>
          ))}
        </div>
        <span className="text-sm font-medium flex items-center text-zinc-700 -ml-4 mr-2">
          <Dot size={40} color="#00ff00" className="-mr-2" />
          {liveMembers?.length > 3 ? "+3" : liveMembers?.length}
        </span>
      </div>
    </div>
  );
};

export default LiveUsers;
