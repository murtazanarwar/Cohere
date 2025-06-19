import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Id } from "../../../../convex/_generated/dataModel";

interface UseGetLiveMembersInChannelProps {
    workspaceId: Id<"workspaces">;
    channelId: Id<"channels">;
}

export const useGetLiveMembersInChannel = ({workspaceId, channelId} : UseGetLiveMembersInChannelProps) => {
    const data = useQuery(api.presence.getLiveMemberInChannel, {workspaceId, channelId});
    const isLoading = (data === undefined);

    return { data, isLoading };
};