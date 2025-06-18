"use client"

import * as React from "react"

import { SideBarMain } from "@/app/workspace/[workspaceId]/sidebar-main"
import { SideBarUser } from "@/app/workspace/[workspaceId]/sidebar-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
  SidebarSeparator,
} from "@/components/ui/sidebar"
import { WorkspaceSwitcher } from "@/app/workspace/[workspaceId]/workspace-switcher"

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="icon" {...props} className="bg-[#f4f4f5]">
      <SidebarHeader>
        <WorkspaceSwitcher />
      </SidebarHeader>
      <SidebarSeparator className="bg-zinc-300"/>
      <SidebarContent>
        <SideBarMain />
      </SidebarContent>
      <SidebarSeparator className="bg-zinc-300"/>
      <SidebarFooter>
        <SideBarUser />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}