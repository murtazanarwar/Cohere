// convex/summaries.ts
import { mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

export const create = mutation({
  args: {
    workspaceId: v.id("workspaces"),
    channelId: v.optional(v.id("channels")),
    summary: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthorized");

    const member = await ctx.db
      .query("members")
      .withIndex("by_workspace_id_user_id", (q) =>
        q.eq("workspaceId", args.workspaceId).eq("userId", userId)
      )
      .unique();
    if (!member) throw new Error("Unauthorized");

    return ctx.db.insert("summaries", {
      workspaceId: args.workspaceId,
      channelId: args.channelId, // now correct: undefined or Id<"channels">
      createdBy: member._id,
      summary: args.summary,
      createdAt: Date.now(),
    });
  },
});
