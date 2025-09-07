import { useMutation } from "convex/react";
import { Id } from "../../../../convex/_generated/dataModel";
import { api } from "../../../../convex/_generated/api";

export const useCreateSummary = () => {
  const mutation = useMutation(api.summaries.create);

  const mutate = async ({
    workspaceId,
    channelId,
    summary,
  }: {
    workspaceId: Id<"workspaces">;
    channelId?: Id<"channels"> | null;
    summary: string;
  }) => {
    return mutation({
      workspaceId,
      channelId: channelId ?? undefined, // 🔑 normalize null → undefined
      summary,
    });
  };

  return { mutate };
};
