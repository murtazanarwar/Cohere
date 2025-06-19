import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

export const heartbeat = mutation({
  args: {
    workspaceId: v.id("workspaces"),
    channelId: v.id("channels"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthorized");

    const existing = await ctx.db
      .query("presence")
      .withIndex("by_user_id", (q) => q.eq("userId", userId))
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, {
        lastSeen: Date.now(),
        workspaceId: args.workspaceId,
        channelId: args.channelId,
      });
    } else {
        const member = await ctx.db
          .query("members")
          .withIndex("by_workspace_id_user_id", (q) =>
            q.eq("workspaceId", args.workspaceId).eq("userId", userId)
          )
          .unique();
    
        if (!member) throw new Error("Member not found");
    
        const user = await ctx.db.get(member.userId);
        if (!user) throw new Error("User not found");
    
        await ctx.db.insert("presence", {
          userId,
          workspaceId: args.workspaceId,
          channelId: args.channelId,
          name: user.name,
          image: user.image,
          lastSeen: Date.now(),
        });
    }
  },
});


export const getLiveMemberInChannel = query({
    args: {
        workspaceId: v.id("workspaces"),
        channelId: v.id("channels"),
    },

    handler: async (ctx, args) => {
        const now = Date.now();
        const THIRTY_SECONDS = 30 * 1000;

        const presences = await ctx.db
            .query("presence")
            .withIndex("by_workspace_channel", (q) => q.eq("workspaceId", args.workspaceId).eq("channelId", args.channelId))
            .collect();

        const active = presences.filter((p) => now - p.lastSeen < THIRTY_SECONDS);
        return active;
    }

})