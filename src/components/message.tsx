import dynamic from "next/dynamic";
import { toast } from "sonner";


import { cn } from "@/lib/utils";
import { Doc, Id } from "../../convex/_generated/dataModel";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { format, isToday, isYesterday } from "date-fns";
import { useConfirm } from "@/hooks/use-confirm";
import { Hint } from "./hint";
import { Thumbnail } from "./thumbnail";
import { Toolbar } from "./toolbar";
import { ThreadBar } from "./thread-bar";
import { Reactions } from "./reactions";
import { useUpdateMessage } from "@/features/messages/api/use-update-message";
import { useRemoveMessage } from "@/features/messages/api/use-remove-message";
import { useToggleReaction } from "@/features/reactions/api/use-toggle-reaction";

const Renderer = dynamic(() => import("@/components/renderer"), { ssr: false });
const Editor = dynamic(() => import("@/components/editor"), { ssr: false });

interface MessageProps {
    id: Id<"messages">;
    memberId: Id<"members">;
    authorImage?: string;
    authorName?: string;
    isAuthor: boolean;
    reactions: Array<
        Omit<Doc<"reactions">, "memberId"> & {
            count: number;
            memberIds: Id<"members">[];
        }
    >;
    body: Doc<"messages">["body"];
    image?: string | null;
    createdAt: Doc<"messages">["_creationTime"];
    updatedAt: Doc<"messages">["updatedAt"];
    isEditing: boolean;
    isCompact?: boolean;
    hideThreadButton?: boolean;
    threadCount?: number;
    threadImage?: string;
    threadTimestamp?: number;
    threadName?: string;
    setEditingId: (id: Id<"messages"> | null) => void;
}

const formatFullTime = (date: Date) => {
    if (isToday(date)) return "Today";
    else if (isYesterday(date)) return "Yesterday";
    return format(date, "MMM D, YYYY") + " at " + format(date, "h:mm:ss a");
};

export const Message = ({
    body,
    createdAt,
    id,
    isEditing,
    memberId,
    reactions,
    updatedAt,
    authorImage,
    authorName = "Member",
    hideThreadButton,
    image,
    isCompact,
    threadCount,
    threadImage,
    threadTimestamp,
    threadName,
    isAuthor,
    setEditingId,
}: MessageProps) => {
    //   const {
    //     parentMessageId,
    //     openMessage,
    //     openProfile,
    //     close: closeMessage,
    //   } = usePanel();
    const [ConfirmDialog, confirm] = useConfirm(
        "Delete message?",
        "Are you sure you want to delete this message? This cannot be undone"
    );
    const { mutate: updateMessage, isPending: isUpdatingMessage } = useUpdateMessage();
    const { mutate: removeMessage, isPending: isRemovingMessage } = useRemoveMessage();

    const { mutate: toggleReaction, isPending: isTogglingReaction } = useToggleReaction();

    const isPending = isUpdatingMessage || isRemovingMessage || isTogglingReaction;

    const handleUpdate = ({ body }: { body: string }) => {
        updateMessage({ id, body }, {
            onSuccess: () => {
                toast.success("Message updated");
                setEditingId(null);
            },
            onError: () => {
                toast.error("Failed to update message")
            }
        })
    };

    const handleRemove = async () => {
        const ok = await confirm();
        if (!ok) return;

        removeMessage({ id }, {
            onSuccess: () => {
                toast.success("Message removed");
            },
            onError: () => {
                toast.error("Failed to remove message")
            }
        })
    };
    
    const handleReaction = ( value: string ) => {
        toggleReaction({ messageId: id, value }, {
            onError: () => {
                toast.error("Failed to toggle reaction")
            }
        })
    };


    if (isCompact) {
        return (
            <>
                <ConfirmDialog />
                <div
                    className={cn(
                        "flex flex-col gap-2 p-1.5 px-5 hover:bg-gray-100/60 group relative",
                        isEditing && "bg-[#F2C74433] hover:bg-[#F2C74433]",
                        isRemovingMessage &&
                        "bg-rose-500/50 transform transition-all scale-y-0 origin-bottom duration-200"
                    )}
                >
                    <div className="flex items-start gap-2">
                        <Hint label={formatFullTime(new Date(createdAt))}>
                            <button className="text-xs text-muted-foreground opacity-0 group-hover:opacity-100 w-[40px] leading-[22px] text-center hover:underline">
                                {format(new Date(createdAt), "hh:mm")}
                            </button>
                        </Hint>
                        {isEditing ? (
                            <div className="w-full h-full">
                                <Editor
                                    onSubmit={handleUpdate}
                                    disabled={isPending}
                                    defaultValue={JSON.parse(body)}
                                    onCancel={() => setEditingId(null)}
                                    variant="update"
                                />
                            </div>
                        ) : (
                            <div className="flex flex-col w-full">
                                <Renderer value={body} />
                                <Thumbnail url={image} />
                                {updatedAt ? (
                                    <span className="text-xs text-muted-foreground">
                                        (edited)
                                    </span>
                                ) : null}
                                <Reactions data={reactions} onChange={handleReaction} />
                                <ThreadBar
                                    count={threadCount}
                                    image={threadImage}
                                    name={threadName}
                                    timestamp={threadTimestamp}
                                    onClick={() => {}}
                                    // onClick={() => openMessage(id)}
                                />
                            </div>
                        )}
                    </div>
                    {!isEditing && (
                        <Toolbar
                            isAuthor={isAuthor}
                            isPending={isPending}
                            hideThreadButton={hideThreadButton}
                            handleEdit={() => setEditingId(id)}
                            // onThread={() => openMessage(id)}
                            handleThread={() => { }}
                            handleDelete={handleRemove}
                            handleReaction={handleReaction}
                        />
                    )}
                </div>
            </>
        );
    }

    return (
        <>
            <ConfirmDialog />
            <div
                className={cn(
                    "flex flex-col gap-2 p-1.5 px-5 hover:bg-gray-100/60 group relative",
                    isEditing && "bg-[#F2C74433] hover:bg-[#F2C74433]",
                    isRemovingMessage &&
                    "bg-rose-500/50 transform transition-all scale-y-0 origin-bottom duration-200"
                )}
            >
                <div className="flex items-start gap-2">
                    {/* <button onClick={() => openProfile(memberId)}> */}
                    <button onClick={() => { }}>
                        <Avatar>
                            <AvatarImage src={authorImage} />
                            <AvatarFallback>
                                {authorName?.charAt(0).toUpperCase()}
                            </AvatarFallback>
                        </Avatar>
                    </button>
                    {isEditing ? (
                        <div className="w-full h-full">
                            <Editor
                                onSubmit={handleUpdate}
                                disabled={isPending}
                                defaultValue={JSON.parse(body)}
                                onCancel={() => setEditingId(null)}
                                variant="update"
                            />
                        </div>
                    ) : (
                        <div className="flex flex-col w-full overflow-hidden">
                            <div className="text-sm">
                                <button
                                    className="font-bold text-primary hover:underline"
                                    // onClick={() => openProfile(memberId)}
                                    onClick={() => { }}
                                >
                                    {authorName}
                                </button>
                                <span>&nbsp;&nbsp;</span>
                                <Hint label={formatFullTime(new Date(createdAt))}>
                                    <button className="text-xs text-muted-foreground hover:underline">
                                        {format(new Date(createdAt), "h:mm a")}
                                    </button>
                                </Hint>
                            </div>
                            <Renderer value={body} />
                            <Thumbnail url={image} />
                            {updatedAt ? (
                                <span className="text-xs text-muted-foreground">(edited)</span>
                            ) : null}
                            <Reactions data={reactions} onChange={handleReaction} />
                            <ThreadBar
                                count={threadCount}
                                image={threadImage}
                                name={threadName}
                                timestamp={threadTimestamp}
                                // onClick={() => openMessage(id)}
                                onClick={() => {}}
                            />
                        </div>
                    )}
                </div>
                {!isEditing && (
                    <Toolbar
                        isAuthor={isAuthor}
                        isPending={isPending}
                        hideThreadButton={hideThreadButton}
                        handleEdit={() => setEditingId(id)}
                        // onThread={() => openMessage(id)}
                        handleThread={() => { }}
                        handleDelete={handleRemove}
                        handleReaction={handleReaction}
                    />
                )}
            </div>
        </>
    );
};