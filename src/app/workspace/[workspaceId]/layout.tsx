"use client";

import Sidebar from "./sidebar";
import Toolbar from "./toolbar";
import {
    ResizableHandle,
    ResizablePanel,
    ResizablePanelGroup,
  } from "@/components/ui/resizable"
  
import WorkspaceSidebar from "./workspace-sidebar";

interface WorkspaceLayoutProps {
    children: React.ReactNode;
}

const WorkspaceLayout = ({children} : WorkspaceLayoutProps) => {
    return ( 
        <div className="h-full">
            <Toolbar />
            <div className="flex h-[calc(100vh-40px)]">
                <Sidebar />
                <ResizablePanelGroup
                    direction="horizontal"
                    autoSaveId="mn-workspace-layout"
                >
                    <ResizablePanel
                        defaultSize={20}
                        minSize={11}
                        className="bg-[#2c2c5f]"
                    >
                        <WorkspaceSidebar />
                    </ResizablePanel>
                    <ResizableHandle withHandle/>
                    <ResizablePanel minSize={20}>
                        {children}
                    </ResizablePanel>
                </ResizablePanelGroup>
                {children}
            </div>
        </div>
     );
}
 
export default WorkspaceLayout;