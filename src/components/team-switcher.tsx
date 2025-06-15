"use client"

import * as React from "react"
import { Loader, ChevronsUpDown, Plus, Network } from "lucide-react"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"

import { useGetWorkspace } from "@/features/workspaces/api/use-get-workspace";
import { useGetWorkspaces } from "@/features/workspaces/api/use-get-workspaces";
import { useCreateWorkspaceModal } from "@/features/workspaces/store/use-create-workspace-modal";
import { useWorkspaceId } from "@/hooks/use-workspace-id";
import { useRouter } from "next/navigation";

export function WorkspaceSwitcher() {
  const { isMobile } = useSidebar()

  const router = useRouter();
  const workspaceId = useWorkspaceId();
  const [_open, setOpen] = useCreateWorkspaceModal();
  
  const { data: workspaces, isLoading: workspacesLoading  } = useGetWorkspaces();
  const { data: workspace, isLoading: workspaceLoading } = useGetWorkspace({ id: workspaceId });

  const filteredWorkspaces = workspaces?.filter( ( workspace ) => workspace?._id !== workspaceId );
  
  if(_open) console.log("Dialog Opened...")
  if(workspacesLoading) console.log("Loading workspaces...")

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <div className="shrink-0 size-7 relative overflow-hidden bg-[#f5f5f5] text-sidebar-primary-foreground text-lg rounded-md flex items-center justify-center mr-2">
                {
                  workspaceLoading ? (
                      <Loader className="size-5 animate-spin shrink-0" />
                  ) : (
                      workspace?.name.charAt(0).toUpperCase()
                  )
                }
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{workspace?.name}</span>
                <span className="truncate text-xs">{workspace?.joinCode}</span>
              </div>
              <ChevronsUpDown className="ml-auto" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            align="start"
            side={isMobile ? "bottom" : "right"}
            sideOffset={4}
          >
            <DropdownMenuLabel className="text-muted-foreground text-xs">
              Workspaces
            </DropdownMenuLabel>
            <DropdownMenuItem 
                className="cursor-pointer flex-col justify-start items-start capitalize"
                onClick={() => router.push(`/workspace/${workspaceId}`)}  
            >
                {workspace?.name}
                <span className="text-xs text-muted-foreground ">
                    Active work
                </span>
            </DropdownMenuItem>
            {filteredWorkspaces?.map((workspace) => (
              <DropdownMenuItem 
                key={workspace._id}
                className="cursor-pointer capitalize overflow-hidden"
                onClick={() => router.push(`/workspace/${workspace._id}`)} 
              >
              <div className="shrink-0 size-7 relative overflow-hidden bg-[#f5f5f5] text-sidebar-primary-foreground text-lg rounded-md flex items-center justify-center mr-2">
                  {workspace.name.charAt(0).toUpperCase()}
              </div>
              <p className="truncate">{workspace.name}</p>
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem className="gap-2 p-2" onClick={() => setOpen(true)}>
              <div className="flex size-6 items-center justify-center rounded-md border bg-transparent">
                <Plus className="size-4" />
              </div>
              <div className="text-muted-foreground font-medium">Create a new workspace</div>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
