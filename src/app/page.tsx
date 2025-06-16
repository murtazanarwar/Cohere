"use client";
import { useEffect, useMemo } from "react";

import { useGetWorkspaces } from "@/features/workspaces/api/use-get-workspaces";
import { useCreateWorkspaceModal } from "@/features/workspaces/store/use-create-workspace-modal";
import { useRouter } from "next/navigation";
import { Loader } from "lucide-react";

export default function Home() {
  const router = useRouter();

  const [open , setOpen ] = useCreateWorkspaceModal();
  const { data, isLoading } = useGetWorkspaces();

  const workspaceId = useMemo(() => data?.[0]?._id, [data]);
  
  useEffect(() => {
    if( isLoading ) return;

    if( workspaceId ) {
      router.replace(`/workspace/${workspaceId}`)
    } else if(!open) {
      setOpen(true);
    }
  }, [isLoading, workspaceId, open, setOpen, router]);
  return (
    <div className="h-full flex items-center justify- bg-[#f1f4f5]">
      <Loader className="size-6 animate-spin text-muted-foreground"/>
    </div>
  );
}