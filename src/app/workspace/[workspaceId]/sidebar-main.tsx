"use client"

import { ChevronRight, Hash, MessagesSquare, PlusIcon, type LucideIcon } from "lucide-react"

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar"

import { useCurrentMember } from "@/features/members/api/use-current-member";
import { useGetWorkspace } from "@/features/workspaces/api/use-get-workspace";
import { useWorkspaceId } from "@/hooks/use-workspace-id";
import { AlertTriangle, Loader } from "lucide-react";
import { useGetChannels } from "@/features/channels/api/use-get-channels";
import { useCreateChannelModal } from "@/features/channels/store/use-create-channel-modal";
import { useGetMembers } from "@/features/members/api/use-get-members";
import Link from "next/link";
import { Button } from "../../../components/ui/button";
import { Hint } from "../../../components/hint";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export function SideBarMain() {
    const workspaceId = useWorkspaceId();
    const[_open, setOPen] = useCreateChannelModal();

    const { data: member, isLoading: memberLoading } = useCurrentMember({ workspaceId });
    const { data: workspace, isLoading: workspaceLoading } = useGetWorkspace({ id: workspaceId });
    const { data: channels } = useGetChannels({workspaceId});
    const { data: members } = useGetMembers({workspaceId});

    

    if(workspaceLoading || memberLoading){
        return(
            <div className="flex flex-col h-full items-center justify-center">
                <Loader className="size-5 animate-spin text-black" />
            </div>
        )
    }

    if(!workspace || !member){
        return (
            <div className="flex flex-col gap-y-2 h-full items-center justify-center">
                <AlertTriangle className="size-5 text-black" />
                <p className="text-black text-sm">
                    Workspace not found
                </p>
            </div>
        )
    }
  return (
    <SidebarGroup>
      <SidebarGroupLabel>Workspace</SidebarGroupLabel>
      <SidebarMenu>
        <Collapsible>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <div>
                <Hash />
                <span>Chanels</span>
                {member.role === "admin" && (
                  <Hint label="New channel" side="top" align="center">
                      <Button
                          onClick={() => setOPen(true)}
                          variant="transparent"
                          size="iconSm"
                          className="opacity-0 group-hover:opacity-100 transition-opacity ml-auto p-0.5 text-sm text-black size-6 shrink-0"
                      >
                          <PlusIcon className="size-5" />
                      </Button>
                  </Hint>
                )}
              </div>
            </SidebarMenuButton>
            {channels?.length ? (
              <>
                <CollapsibleTrigger asChild>
                  <SidebarMenuAction className="data-[state=open]:rotate-90">
                    <ChevronRight />
                    <span className="sr-only">Toggle</span>
                  </SidebarMenuAction>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <SidebarMenuSub>
                    {channels?.map((channel) => (
                      <SidebarMenuSubItem key={channel._id}>
                        <SidebarMenuSubButton asChild>
                          <Link href={`/workspace/${workspaceId}/channel/${channel._id}`}>
                            <span>{channel.name}</span>
                          </Link>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                    ))}
                  </SidebarMenuSub>
                </CollapsibleContent>
              </>
            ) : null}
          </SidebarMenuItem>
        </Collapsible>
        <Collapsible>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <div>
                <MessagesSquare />
                <span>Direct Messages</span>
                <Hint label="New direct message" side="top" align="center">
                    <Button
                        onClick={() => {}}
                        variant="transparent"
                        size="iconSm"
                        className="opacity-0 group-hover:opacity-100 transition-opacity ml-auto p-0.5 text-sm text-black size-6 shrink-0"
                    >
                        <PlusIcon className="size-5" />
                    </Button>
                </Hint>
              </div>
            </SidebarMenuButton>
            {members?.length ? (
              <>
                <CollapsibleTrigger asChild>
                  <SidebarMenuAction className="data-[state=open]:rotate-90">
                    <ChevronRight />
                    <span className="sr-only">Toggle</span>
                  </SidebarMenuAction>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <SidebarMenuSub>
                    {members?.map((member) => (
                      <SidebarMenuSubItem key={member._id}>
                        <SidebarMenuSubButton asChild>
                          <Link 
                              href={`/workspace/${workspaceId}/member/${member._id}`}
                          >
                              <Avatar className="size-5 rounded-md mr-1">
                                  <AvatarImage className="rounded-md" src={member.user.image} />
                                  <AvatarFallback className="rounded-md bg-sky-500 text-white text-xs">
                                      {member.user?.name?.charAt(0).toUpperCase()}
                                  </AvatarFallback>
                              </Avatar>
                              <span className="text-sm truncate">{member.user.name}</span>
                          </Link>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                    ))}
                  </SidebarMenuSub>
                </CollapsibleContent>
              </>
            ) : null}
          </SidebarMenuItem>
        </Collapsible>
      </SidebarMenu>
    </SidebarGroup>
  )
}
