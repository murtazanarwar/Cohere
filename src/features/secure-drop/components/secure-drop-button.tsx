"use client";
import { MessageSquareLock } from "lucide-react";
import { useSecureDrop } from "../api/use-secure-drop";
import { Button } from "@/components/ui/button";
import { Id } from "../../../../convex/_generated/dataModel";

export const SecureDropButton = ({ targetUserId, currentUserId }: { targetUserId: Id<"members">; currentUserId: Id<"members"> }) => {
  const { initiate } = useSecureDrop(currentUserId);

  return (
    <Button
      variant="outline"
      className="w-full flex items-center gap-2 justify-center"
      onClick={() => initiate(targetUserId)}
    >
      <div className="size-9 flex items-center justify-center">
        <MessageSquareLock className="size-4" />
      </div>
      <span>Secure Drop</span>
    </Button>
  );
};

