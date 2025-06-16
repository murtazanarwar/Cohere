import { Button } from "@/components/ui/button";

import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
  } from "@/components/ui/dialog"
import { ChevronDown, TrashIcon } from "lucide-react";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { DialogClose } from "@radix-ui/react-dialog";
import { useChannelId } from "@/hooks/use-channel-id";
import { useUpdateChannel } from "@/features/channels/api/use-update-channel";
import { toast } from "sonner";
import { useRemoveChannel } from "@/features/channels/api/use-remove-channel";
import { useConfirm } from "@/hooks/use-confirm";
import { useRouter } from "next/navigation";
import { useWorkspaceId } from "@/hooks/use-workspace-id";
import { useCurrentMember } from "@/features/members/api/use-current-member";

interface HeaderProps {
    title: string;
}

export const Header = ({ title } : HeaderProps ) => {
    const channelId = useChannelId();

    const [editOpen, setEditOpen] = useState(false);
    const [value, setValue] = useState(title);
    const [ConfirmDialog, confirm] = useConfirm(
        "Delete this channel?",
        "you can't undo this action"
    );
    
    const router = useRouter();
    const workspaceId = useWorkspaceId();
    const { mutate: updateChannel, isPending: isUpdatingChannel } = useUpdateChannel()
    const { mutate: removeChannel, isPending: isRemovingChannel } = useRemoveChannel()
    const { data: member } = useCurrentMember({workspaceId});

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        updateChannel({ id: channelId, name: value },{
            onSuccess: () => {
                toast.success("Channel updated successfully");
                setEditOpen(false);
            },
            onError: () => {
                toast.error("Failed to update channel");
            }
        });
    }

    const handleDelete = async () => {
        const ok = await confirm();
        if(!ok) return;

        removeChannel({id: channelId}, {
            onSuccess: () => {
                router.push(`/workspace/${workspaceId}`);
                toast.success("Channel deleted successfully");
            },
            onError: () => {
                toast.error("Failed to delete channel");
            }
        });
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value.replace(/\s+/g, "-").toLowerCase();
        setValue(value);
    }

    const handleEditOpen = (value: boolean) => {
        if( member ?.role !== "admin") return;
        setEditOpen(value);
    }

    return (
        <div>
            <ConfirmDialog />
            <Dialog>
                <DialogTrigger asChild>
                    <Button
                    variant="regular"
                    className="overflow-hidden"
                    size="sm"
                    >
                        <span className="truncate text-black">{title}</span>
                        <ChevronDown className=" text-black"/>
                    </Button>
                </DialogTrigger>
                <DialogContent className="p-0 bg-gray-50 overflow-hidden">
                    <DialogHeader className="p-4 border-b bg-white">
                        <DialogTitle>
                            # {title}
                        </DialogTitle>
                    </DialogHeader>
                    <div className="px-4 pb-4 flex flex-col gap-y-2">
                        <Dialog open={editOpen} onOpenChange={handleEditOpen}>
                            <DialogTrigger asChild>
                                <div className="px-5 py-4 bg-white rounded-lg border cursor-pointer hover:bg-gray-50">
                                    <div className="flex items-center justify-between">
                                        <p className="text-sm font-semibold">Channel name</p>
                                        {member?.role === "admin" &&  (
                                            <p className="text-sm text-[#1264a3] hover:underline font-semibold">
                                                Edit
                                            </p>
                                        )}
                                    </div>
                                    <p className="text-sm"> # {title} </p>
                                </div>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>
                                        Reaname this channel
                                    </DialogTitle>
                                </DialogHeader>
                                <form className="space-y-4" onSubmit={handleSubmit}>
                                    <Input 
                                        value={value}
                                        disabled={isUpdatingChannel}
                                        onChange={handleChange}
                                        required
                                        autoFocus
                                        minLength={3}
                                        maxLength={80}
                                        placeholder="eg. marketing"
                                    />
                                    <DialogFooter>
                                        <DialogClose asChild>
                                            <Button variant="outline" disabled={isUpdatingChannel}>
                                                Cancel
                                            </Button>
                                        </DialogClose>
                                        <Button disabled={isUpdatingChannel}>
                                            Save
                                        </Button>
                                    </DialogFooter>
                                </form>
                            </DialogContent>
                        </Dialog>
                        {member?.role === "admin" && (
                            <button 
                                className="flex items-center gap-x-2 px-5 py-4 bg-white rounded-lg cursor-pointer border hover:bg-gray-50 text-rose-600"
                                onClick={handleDelete}
                                disabled={isRemovingChannel}    
                            >
                                <TrashIcon className="size-4" />
                                <p className="text-sm font-semibold">Delete Channel</p>
                            </button>
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    )
}