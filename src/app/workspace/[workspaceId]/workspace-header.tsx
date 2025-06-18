import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
  } from "@/components/ui/dropdown-menu"


import { ChevronDown } from "lucide-react";
import {PreferencesModal} from "./preferences-modal";
import { Doc } from "../../../../convex/_generated/dataModel";
import { useState } from "react";
import { InviteModal } from "./invite-modal";
import { useRouter } from "next/navigation";

interface WorkspaceHeaderProps {
    workspace: Doc<"workspaces">;
    isAdmin: boolean;
};
  
const WorkspaceHeader = ({ workspace, isAdmin } : WorkspaceHeaderProps ) => {
    const router = useRouter();
    const [preferencesOpen, setPreferencesOpen] = useState(false);
    const [inviteOpen, setInviteOpen] = useState(false);
    
    return ( 
        <>
            <InviteModal 
                open={inviteOpen} 
                setOpen={setInviteOpen}
                name={workspace.name}
                joinCode={workspace.joinCode}
            />
            <PreferencesModal open={preferencesOpen} setOpen={setPreferencesOpen} initialValue={workspace.name} />
            <div className="flex items-center justify-between gap-0.5">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button
                            variant="regular"
                            className="overflow-hidden"
                            size="sm"
                        >
                            <span className="truncate text-black">{workspace.name}</span>
                            <ChevronDown className="text-black" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent side="bottom" align="start" className="w-64">
                        <DropdownMenuItem className="cursor-pointer capitalize">
                            <div className="shrink-0 size-7 relative overflow-hidden bg-[#f5f5f5] text-sidebar-primary-foreground text-lg rounded-md flex items-center justify-center mr-2">
                                {workspace.name.charAt(0).toUpperCase()}
                            </div>
                            <div className="flex flex-col items-start">
                                <p className="flex flex-bol">{workspace.name}</p>
                                <p className="text-xs text-muted-foreground">Active Workspace</p>
                            </div>
                        </DropdownMenuItem>
                        {isAdmin && (
                            <>
                                <DropdownMenuItem 
                                    className="cursor-pointer py-2"
                                    onClick={() => setInviteOpen(true)}
                                > 
                                    Invite people to {workspace.name}
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem 
                                    className="cursor-pointer py-2"
                                    onClick={() => setPreferencesOpen(true)}
                                >
                                    Preferances
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                            </>
                        )}
                    </DropdownMenuContent>
                </DropdownMenu>
                {/* <div className="flex items-center gap-0.5">
                    <Hint label="Filter Conversations" side="bottom">
                        <Button variant="transparent" size="iconSm">
                            <ListFilter className="size-4"/>
                        </Button>
                    </Hint>
                    <Hint label="New message" side="bottom">
                        <Button variant="transparent" size="iconSm">
                            <SquarePen className="size-4"/>
                        </Button>
                    </Hint>
                </div> */}
            </div>
        </>
     );
}
 
export default WorkspaceHeader;