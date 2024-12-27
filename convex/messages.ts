import { getAuthUserId } from "@convex-dev/auth/server";
import { mutation, query, QueryCtx } from "./_generated/server";
import { v } from "convex/values";
import { Doc, Id } from "./_generated/dataModel";
import { paginationOptsValidator } from "convex/server";

const populateThread = async (ctx: QueryCtx, messageId: Id<"messages">) => {
    const messages = await ctx.db
      .query("messages")
      .withIndex("by_parent_message_id", (q) =>
        q.eq("parentMessageId", messageId)
      )
      .collect();
  
    if (messages.length === 0) {
      return {
        count: 0,
        image: undefined,
        timestamp: 0,
        name: "",
      };
    }
  
    const lastMessage = messages.at(-1)!;
    const lastMessageMember = await populateMember(ctx, lastMessage?.memberId);
  
    if (!lastMessageMember) {
      return {
        count: messages.length,
        image: undefined,
        timestamp: 0,
        name: "",
      };
    }
  
    const lastMessageUser = await populateUser(ctx, lastMessageMember.userId);
  
    return {
      count: messages.length,
      image: lastMessageUser?.image,
      timeStamp: lastMessage._creationTime,
      name: lastMessageUser?.name,
    };
};
  
const populateReactions = (ctx: QueryCtx, messageId: Id<"messages">) => {
    return ctx.db
      .query("reactions")
      .withIndex("by_message_id", (q) => q.eq("messageId", messageId))
      .collect();
};
  
const populateUser = (ctx: QueryCtx, userId: Id<"users">) => {
    return ctx.db.get(userId);
};
  
const populateMember = (ctx: QueryCtx, memberId: Id<"members">) => {
    return ctx.db.get(memberId);
};
  

const getMember = async ( 
    ctx: QueryCtx, 
    workspaceId: Id<"workspaces">, 
    userId: Id<"users"> 
) => {
    return ctx.db
        .query("members")
        .withIndex("by_workspace_id_user_id" , (q) => 
            q.eq("workspaceId", workspaceId).eq("userId", userId),
        )
        .unique();
};

export const get = query({
    args: {
      channelId: v.optional(v.id("channels")),
      conversationId: v.optional(v.id("conversations")),
      parentMessageId: v.optional(v.id("messages")),
      paginationOpts: paginationOptsValidator,
    },
    handler: async (ctx, args) => {
      const userId = await getAuthUserId(ctx);
  
      if (!userId) {
        throw new Error("Unauthorized");
      }
  
      let _conversationId = args.conversationId;
  
      if (!args.conversationId && !args.channelId && args.parentMessageId) {
        const parentMessage = await ctx.db.get(args.parentMessageId);
  
        if (!parentMessage) {
          throw new Error("Parent message not found");
        }
  
        _conversationId = parentMessage.conversationId;
      }
  
      const result = await ctx.db
        .query("messages")
        .withIndex("by_channel_id_parent_message_id_conversation_id", (q) =>
          q
            .eq("channelId", args.channelId)
            .eq("parentMessageId", args.parentMessageId)
            .eq("conversationId", _conversationId)
        )
        .order("desc")
        .paginate(args.paginationOpts);
  
      return {
        ...result,
  
        page: (
          await Promise.all(
            result.page.map(async (message) => {
              const member = await populateMember(ctx, message.memberId);
              const user = member ? await populateUser(ctx, member.userId) : null;
  
              if (!member || !user) {
                return null;
              }
  
              const reactions = await populateReactions(ctx, message._id);
              const thread = await populateThread(ctx, message._id);
              const image = message.image
                ? await ctx.storage.getUrl(message.image)
                : undefined;
  
              const reactionsWithCounts = reactions.map((reaction) => {
                return {
                  ...reaction,
                  count: reactions.filter((r) => r.value === reaction.value)
                    .length,
                };
              });
  
              const dedupedReactions = reactionsWithCounts.reduce(
                (acc, reaction) => {
                  const existingReaction = acc.find(
                    (r) => r.value === reaction.value
                  );
  
                  if (existingReaction) {
                    existingReaction.memberIds = Array.from(
                      new Set([...existingReaction.memberIds, reaction.memberId])
                    );
                  } else {
                    acc.push({ ...reaction, memberIds: [reaction.memberId] });
                  }
                  return acc;
                },
                [] as (Doc<"reactions"> & {
                  count: number;
                  memberIds: Id<"members">[];
                })[]
              );
  
              const reactionsWithoutMemberId = dedupedReactions.map(
                ({ memberId, ...rest }) => rest
              );
  
              return {
                ...message,
                image,
                member,
                user,
                reactions: reactionsWithoutMemberId,
                threadCount: thread.count,
                threadImage: thread.image,
                threadTimestamp: thread.timeStamp,
              };
            })
          )
        ).filter((message) => message !== null),
      };
    },
});

export const create = mutation({
    args: {
        body: v.string(),
        image: v.optional(v.id("_storage")),
        workspaceId: v.id("workspaces"),
        channelId: v.optional(v.id("channels")),
        conversationId: v.optional(v.id("conversations")),
        parentMessageId: v.optional(v.id("messages")),
    },
    handler: async (ctx, args) => {
        const userId = await getAuthUserId(ctx);

        if(!userId) {
            throw new Error("Unauthorised");
        }

        const member = await getMember(ctx, args.workspaceId, userId);

        if(!member){
            throw new Error("Unauthorized");
        }

        let _conversationId = args.conversationId;
        
        if(!args.conversationId && !args.channelId && args.parentMessageId){
            const parentMessage = await ctx.db.get(args.parentMessageId);
            if(!parentMessage){
                throw new Error("parent message not found");
            }

            _conversationId = parentMessage.conversationId;
        }

        const messageId = await ctx.db.insert("messages", {
            memberId: member._id,
            body: args.body,
            image: args.image,
            channelId: args.channelId,
            conversationId: _conversationId,
            workspaceId: args.workspaceId,
            parentMessageId: args.parentMessageId,
        });
        
        return messageId;
    },
});