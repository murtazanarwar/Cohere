"use client"

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { SearchBar } from "@/app/workspace/[workspaceId]/searchbar"
import { useChannelId } from "@/hooks/use-channel-id"
import { useGetChannel } from "@/features/channels/api/use-get-channel"
import { Header } from "@/app/workspace/[workspaceId]/channel/[channelId]/header"
import { useWorkspaceId } from "@/hooks/use-workspace-id"
import { useCurrentMember } from "@/features/members/api/use-current-member"
import { useGetWorkspace } from "@/features/workspaces/api/use-get-workspace"
import WorkspaceHeader from "@/app/workspace/[workspaceId]/workspace-header"
import { ModeToggle } from "@/components/mode-toggle"
import LiveUsers from "./live-user"

export function SiteHeader() {
  const channelId = useChannelId();
  const workspaceId = useWorkspaceId();
  
  const { data: channel , isLoading: channelLoading } = useGetChannel({ id: channelId });
  const { data: member, isLoading: memberLoading } = useCurrentMember({ workspaceId });
  const { data: workspace, isLoading: workspaceLoading } = useGetWorkspace({ id: workspaceId });

  if(!channel){
      return null;
  }

  if(!workspace || !member){
      return null;
  }

  return (
    <header className="bg-background sticky top-0 h-12 p-1.5 z-50 flex w-full items-center bg-[#f4f4f5] border-b">
      <div className="flex h-full w-full items-center gap-2 justify-between">
        <div className="flex items-center gap-2">
          <SidebarTrigger className="hover:bg-[#e4e4e7] rounded-md h-10 w-10" />
          <ModeToggle />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <Breadcrumb className="hidden sm:block">
            <BreadcrumbList>
              <BreadcrumbItem className="rounded-md h-10 w-auto items-center">
                <WorkspaceHeader
                  workspace={workspace}
                  isAdmin={member.role === "admin"}
                />
              </BreadcrumbItem>
              {!channelLoading && (
                <>
                  <BreadcrumbSeparator className="text-black" />
                  <BreadcrumbItem className="rounded-md h-10 w-auto items-center">
                    <Header title={channel.name} />
                  </BreadcrumbItem>
                </>
              )}
            </BreadcrumbList>
          </Breadcrumb>
        </div>

        <div className="flex items-center gap-4 ml-auto">
          <SearchBar />
          <LiveUsers />
        </div>
      </div>
    </header>
  )
}
