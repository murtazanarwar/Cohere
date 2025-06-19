import { useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Id } from "../../../../convex/_generated/dataModel";
import { useEffect, useRef } from "react";

interface UseHeartBeatProps {
  workspaceId: Id<"workspaces">;
  channelId: Id<"channels">;
}

export const useHeartBeat = ({ workspaceId, channelId }: UseHeartBeatProps) => {
  const heartbeat = useMutation(api.presence.heartbeat);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    heartbeat({ workspaceId, channelId });

    intervalRef.current = setInterval(() => {
      heartbeat({ workspaceId, channelId });
    }, 15000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [heartbeat, workspaceId, channelId]);

  return null;
};