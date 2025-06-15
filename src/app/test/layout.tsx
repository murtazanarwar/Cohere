"use client";
import { AppSidebar } from "@/app/workspace/[workspaceId]/app-sidebar";
import { ThemeProvider } from "@/components/theme-provider";
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"


export default function TestLayout({
  children,
}: {
  children: React.ReactNode;
}) {

    return (
        <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
          <SidebarProvider>
            <AppSidebar />
            <SidebarInset>
              {children}
            </SidebarInset>
          </SidebarProvider>
        </ThemeProvider>
    )
}