"use client";

import { Loader } from "lucide-react";
import { ReactNode } from "react";

import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";

import { Id } from "../../../../convex/_generated/dataModel";
import { usePanel } from "@/hooks/use-pannel";
import { Thread } from "@/features/messages/components/thread";
import { Profile } from "@/features/members/components/profile";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/app/workspace/[workspaceId]/app-sidebar";
import { SiteHeader } from "./site-header";


interface WorkspaceIdLayoutProps {
  children: ReactNode;
}

const WorkspaceIdLayout = ({ children }: WorkspaceIdLayoutProps) => {
  const { parentMessageId, profileMemberId, onClose } = usePanel();

  const showPanel = !!parentMessageId || !!profileMemberId;

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <div>
          <SiteHeader />
          <div className="flex h-[calc(100vh-40px)]">
            <ResizablePanelGroup
              direction="horizontal"
              autoSaveId="wck-workspace-layout"
            >
              <ResizablePanel defaultSize={80} minSize={20}>
                {children}
              </ResizablePanel>
              {showPanel && (
                <>
                  <ResizableHandle />
                  <ResizablePanel minSize={20} defaultSize={29}>
                    {parentMessageId ? (
                      <Thread
                        messageId={parentMessageId as Id<"messages">}
                        onClose={onClose}
                      />
                    ) : profileMemberId ? (
                      <Profile
                        memberId={profileMemberId as Id<"members">}
                        onClose={onClose}
                      />
                    ) : (
                      <div className="flex h-ful items-center justify-center">
                        <Loader className="size-5 animate-spin text-muted-foreground" />
                      </div>
                    )}
                  </ResizablePanel>
                </>
              )}
            </ResizablePanelGroup>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
};

export default WorkspaceIdLayout;