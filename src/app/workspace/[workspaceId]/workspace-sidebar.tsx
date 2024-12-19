import { useCurrentMember } from "@/features/members/api/use-current-member";
import { useGetWorkspace } from "@/features/workspaces/api/use-get-workspace";
import { useWorkspaceId } from "@/hooks/use-workspace-id";
import { AlertTriangle, HashIcon, Loader, MessageSquareText, SendHorizonal } from "lucide-react";
import WorkspaceHeader from "./workspace-header";
import { SidebarItem } from "./sidebar-items";
import { useGetChannels } from "@/features/channels/api/use-get-channels";
import { WorkspaceSection } from "./workspace-section";
import { useGetMember } from "@/features/members/api/use-get-member";
import { UserItem } from "./user-item";

const WorkspaceSidebar = () => {
    const workspaceId = useWorkspaceId();

    const { data: member, isLoading: memberLoading } = useCurrentMember({ workspaceId });
    const { data: workspace, isLoading: workspaceLoading } = useGetWorkspace({ id: workspaceId });
    const { data: channels, isLoading: channelsLoading } = useGetChannels({workspaceId});
    const { data: members, isLoading: membersLoading } = useGetMember({workspaceId});

    console.log(channelsLoading,membersLoading);

    if(workspaceLoading || memberLoading){
        return(
            <div className="flex flex-col bg-[#103d6a] h-full items-center justify-center">
                <Loader className="size-5 animate-spin text-white" />
            </div>
        )
    }

    if(!workspace || !member){
        return (
            <div className="flex flex-col gap-y-2 bg-[#103d6a] h-full items-center justify-center">
                <AlertTriangle className="size-5 text-white" />
                <p className="text-white text-sm">
                    Workspace not found
                </p>
            </div>
        )
    }
    return ( 
        <div className="flex flex-col bg-[#103d6a] h-full">
            <WorkspaceHeader workspace={workspace} isAdmin={member.role === "admin"} />
            <div className="flex flex-col px-2 mt-3">
                <SidebarItem 
                    label="Threads"
                    icon={MessageSquareText}
                    id="threads"
                />
                <SidebarItem 
                    label="Draft & Sent"
                    icon={SendHorizonal}
                    id="drafts"
                />
            </div>
            <WorkspaceSection
                    label="Channels"
                    hint="New channel"
                    onNew={() => {}}
                >
                    {channels?.map((item) => (
                        <SidebarItem
                            key={item._id}
                            icon={HashIcon}
                            label={item.name}
                            id={item._id}
                        />
                    ))}
            </WorkspaceSection>
            <WorkspaceSection
                label="Direct Messages"
                hint="New direct message"
                onNew={() => {}}
            >
                {members?.map((item) => (
                    <UserItem 
                        key={item._id}
                        id={item._id}
                        label={item.user.name}
                        image={item.user.image}
                    />
                ))}
            </WorkspaceSection>
        </div>
     );
}
 
export default WorkspaceSidebar;