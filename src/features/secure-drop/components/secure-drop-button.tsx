"use client";
import { useSecureDropContext } from "@/components/secure-drop-provider";
import { Button } from "@/components/ui/button";

export default function SecureDropButton({ targetId }: { targetId: string }) {
  const { initiate } = useSecureDropContext();
  return (
    <Button
      variant="outline"
      className="w-full flex items-center gap-2 justify-center"
      onClick={() => initiate(targetId)}
    >
      Secure Drop
    </Button>
  );
}
