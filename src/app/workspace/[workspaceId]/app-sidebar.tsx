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
} from "@/components/ui/sidebar"
import { WorkspaceSwitcher } from "@/app/workspace/[workspaceId]/workspace-switcher"


export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <WorkspaceSwitcher />
      </SidebarHeader>
      <SidebarContent>
        <SideBarMain />
      </SidebarContent>
      <SidebarFooter>
        <SideBarUser />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}