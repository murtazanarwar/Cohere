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
import { SocketProvider } from "@/provider/socket-provider";
import { useWorkspaceId } from "@/hooks/use-workspace-id";
import { useCurrentMember } from "@/features/members/api/use-current-member";
import { SecureDropProvider } from "@/components/secure-drop-provider";


interface WorkspaceIdLayoutProps {
  children: ReactNode;
}

const WorkspaceIdLayout = ({ children }: WorkspaceIdLayoutProps) => {
  const { parentMessageId, profileMemberId, onClose } = usePanel();
  const workspaceId = useWorkspaceId();
  const { data: member } = useCurrentMember({ workspaceId });

  if (!member?._id) return null;
  const showPanel = !!parentMessageId || !!profileMemberId;

  return (
    <SocketProvider userId={member._id}>
      <SecureDropProvider currentUserId={member._id}>
        <SidebarProvider>
          <AppSidebar />
          <SidebarInset>
              <div className="flex h-[100vh]">
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
          </SidebarInset>
        </SidebarProvider>
      </SecureDropProvider>
    </SocketProvider>
  );
};

export default WorkspaceIdLayout;