"use client";

import { useGetWorkspaces } from "@/features/workspaces/api/use-get-workspace";
import { useWorkspaceId } from "@/hooks/use-workspace-id";

const WorkspaceIdPage = () => {
    const workspaceId = useWorkspaceId();
    const { data } = useGetWorkspaces({ id: workspaceId });
    
    return ( 
        <div>
            ID: { JSON.stringify(data?._id) }
        </div>
     );
}
 
export default WorkspaceIdPage;