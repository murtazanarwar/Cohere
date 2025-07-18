"use client";

import { useRouter } from "next/navigation";
import { useCreateChannelModal } from "@/features/channels/store/use-create-channel-modal";
import { useWorkspaceId } from "@/hooks/use-workspace-id";
import { useGetWorkspace } from "@/features/workspaces/api/use-get-workspace";
import { useGetChannels } from "@/features/channels/api/use-get-channels";
import { useEffect, useMemo } from "react";
import { TriangleAlert } from "lucide-react";
import { useCurrentMember } from "@/features/members/api/use-current-member";

const WorkspaceIdPage = () => {
    const workspaceId = useWorkspaceId();
    const router = useRouter();
    const [open, setOpen] = useCreateChannelModal();

    const { data: member, isLoading: memberLoading } = useCurrentMember({ workspaceId });
    const { data: workspace, isLoading: workspaceLoading } = useGetWorkspace({ id: workspaceId });
    const { data: channels, isLoading: channelsLoading } = useGetChannels({ workspaceId });

    const channelId = useMemo(() => channels?.[0]?._id, [channels]);
    const isAdmin = useMemo(() => member?.role === "admin", [member?.role]);

    useEffect(() => {
        if (workspaceLoading || channelsLoading || memberLoading || !member || !workspace) return;

        if (channelId) {
            router.push(`/workspace/${workspaceId}/channel/${channelId}`);
        } else if (!open && isAdmin) {
            setOpen(true);
        }
    }, [
        member,
        isAdmin,
        memberLoading,
        channelId,
        workspaceLoading,
        channelsLoading,
        workspace,
        open,
        setOpen,
        router,
        workspaceId,
    ]);

    if (workspaceLoading || channelsLoading || memberLoading) {
        return (
            <div className="h-full flex-1 flex items-center justify-center bg-[#f1f4f5] flex-col gap-2">
                <TriangleAlert className="size-5 animate-spin text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Workspace not found</span>
            </div>
        );
    }

    if (!workspace || !member) {
        return (
            <div className="h-full flex-1 flex items-center justify-center bg-[#f1f4f5] flex-col gap-2">
                <TriangleAlert className="size-5 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Workspace not found</span>
            </div>
        );
    }

    return (
        <div className="h-full flex-1 flex items-center justify-center bg-[#f1f4f5] flex-col gap-2">
            <TriangleAlert className="size-5 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">No channel found</span>
        </div>
    );
};

export default WorkspaceIdPage;