import { getAuthUserId } from "@convex-dev/auth/server"; // Authenticate user
import { v } from "convex/values"; // Validator for arguments

import { Id } from "./_generated/dataModel"; // DataModel types
import { mutation, query, QueryCtx } from "./_generated/server"; // Convex functions and context

// Helper to fetch a full user record by ID
const populateUser = (ctx: QueryCtx, userId: Id<"users">) => {
  return ctx.db.get(userId);
};

// Query: return the current member in a workspace or null if not a member
export const current = query({
  args: { workspaceId: v.id("workspaces") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) return null;

    // Look up membership by workspace and user
    const member = await ctx.db
      .query("members")
      .withIndex("by_workspace_id_user_id", (q) =>
        q.eq("workspaceId", args.workspaceId).eq("userId", userId)
      )
      .unique();

    return member || null;
  },
});

// Query: fetch a member by ID with user details, if current user has access
export const getById = query({
  args: { id: v.id("members") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    const member = await ctx.db.get(args.id); // Fetch target member
    if (!member) return null;

    // Verify current user is part of the same workspace
    const currentMember = await ctx.db
      .query("members")
      .withIndex("by_workspace_id_user_id", (q) =>
        q.eq("workspaceId", member.workspaceId).eq("userId", userId)
      )
      .unique();
    if (!currentMember) return null;

    const user = await populateUser(ctx, member.userId); // Load user info
    if (!user) return null;

    return { ...member, user };
  },
});

// Query: list all members in a workspace, including user details, if authorized
export const get = query({
  args: { workspaceId: v.id("workspaces") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) return [];

    // Check current user's membership
    const member = await ctx.db
      .query("members")
      .withIndex("by_workspace_id_user_id", (q) =>
        q.eq("workspaceId", args.workspaceId).eq("userId", userId)
      )
      .unique();
    if (!member) return [];

    // Fetch all members in workspace
    const data = await ctx.db
      .query("members")
      .withIndex("by_workspace_id", (q) => q.eq("workspaceId", args.workspaceId))
      .collect();

    const members = [];
    for (const memberItem of data) {
      const user = await populateUser(ctx, memberItem.userId);
      if (user) members.push({ ...memberItem, user });
    }
    return members;
  },
});

// Mutation: update a member's role (admin or member)
export const update = mutation({
  args: { id: v.id("members"), role: v.union(v.literal("admin"), v.literal("member")) },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("Unauthorized");

    const member = await ctx.db.get(args.id);
    if (!member) throw new Error("Member not found");

    // Only admins can change roles
    const currentMember = await ctx.db
      .query("members")
      .withIndex("by_workspace_id_user_id", (q) =>
        q.eq("workspaceId", member.workspaceId).eq("userId", userId)
      )
      .unique();
    if (!currentMember || currentMember.role !== "admin") {
      throw new Error("Unauthorized");
    }

    await ctx.db.patch(args.id, { role: args.role }); // Persist role change
    return args.id;
  },
});

// Mutation: remove a member and clean up related data
export const remove = mutation({
  args: { id: v.id("members") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("Unauthorized");

    const member = await ctx.db.get(args.id);
    if (!member) throw new Error("Member not found");

    // Only workspace members can initiate removal
    const currentMember = await ctx.db
      .query("members")
      .withIndex("by_workspace_id_user_id", (q) =>
        q.eq("workspaceId", member.workspaceId).eq("userId", userId)
      )
      .unique();
    if (!currentMember) throw new Error("Unauthorized");

    // Prevent removing admins or self-removal by admin
    if (member.role === "admin") throw new Error("Admin cannot be removed");
    if (currentMember._id === args.id && currentMember.role === "admin") {
      throw new Error("Cannot remove yourself if you are an admin");
    }

    // Collect all related messages, reactions, conversations
    const [messages, reactions, conversations] = await Promise.all([
      ctx.db
        .query("messages")
        .withIndex("by_member_id", (q) => q.eq("memberId", member._id))
        .collect(),
      ctx.db
        .query("reactions")
        .withIndex("by_member_id", (q) => q.eq("memberId", member._id))
        .collect(),
      ctx.db
        .query("conversations")
        .filter((q) =>
          q.or(
            q.eq(q.field("memberOneId"), member._id),
            q.eq(q.field("memberTwoId"), member._id)
          )
        )
        .collect(),
    ]);

    // Delete related records
    for (const message of messages) await ctx.db.delete(message._id);
    for (const reaction of reactions) await ctx.db.delete(reaction._id);
    for (const conversation of conversations) await ctx.db.delete(conversation._id);

    await ctx.db.delete(args.id); // Remove member record
    return args.id;
  },
});
