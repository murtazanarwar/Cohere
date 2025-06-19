"use client";

import { FaChevronDown } from "react-icons/fa";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { SearchBar } from "../../searchbar";
import { ModeToggle } from "@/components/mode-toggle";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { useWorkspaceId } from "@/hooks/use-workspace-id";
import { useGetWorkspace } from "@/features/workspaces/api/use-get-workspace";
import WorkspaceHeader from "../../workspace-header";
import { useCurrentMember } from "@/features/members/api/use-current-member";

interface HeaderProps {
  memberName?: string;
  memberImage?: string;
  onClick?: () => void;
}

export const Header = ({
  memberImage,
  memberName = "Member",
  onClick,
}: HeaderProps) => {
  const workspaceId = useWorkspaceId();
  const { data: workspace, isLoading: workspaceLoading } = useGetWorkspace({ id: workspaceId });
  const { data: member, isLoading: memberLoading } = useCurrentMember({ workspaceId });
  
  if(!workspace || !member){
      return null;
  }

  return (
    <div className="flex items-center bg-white border-b h-12 px-4">
      <SidebarTrigger className="hover:bg-[#e4e4e7] rounded-md h-10 w-10"  />
      <ModeToggle />
      <Separator orientation="vertical" className="mr-2 h-4" />

      <Breadcrumb className="hidden sm:block">
        <BreadcrumbList>
          <BreadcrumbItem className="rounded-md h-10 w-auto items-center">
            <WorkspaceHeader
              workspace={workspace}
              isAdmin={member.role === "admin"}
            />
            <BreadcrumbSeparator className="text-black" />
          </BreadcrumbItem>
          <BreadcrumbItem className="rounded-md h-10 w-auto items-center">
            <Button variant="ghost" size="sm" onClick={onClick} className="flex items-center gap-2">
              <Avatar className="w-5 h-5">
                {memberImage ? (
                  <AvatarImage src={memberImage} alt={memberName} />
                ) : (
                  <AvatarFallback>{memberName.charAt(0)}</AvatarFallback>
                )}
              </Avatar>
              <span className="text-black truncate max-w-xs">{memberName}</span>
            </Button>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex items-center gap-2 ml-auto">
        <SearchBar />
      </div>
    </div>
  );
};
