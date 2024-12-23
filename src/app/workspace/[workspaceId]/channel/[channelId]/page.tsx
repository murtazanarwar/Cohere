"use client";

import { useGetChannel } from "@/features/channels/api/use-get-channel";
import { useChannelId } from "@/hooks/use-channel-id";
import { Loader, TriangleAlert } from "lucide-react";
import { Header } from "./header";
import { ChatInput } from "./chat-input";


const ChannelPage = () => {
    const channelId = useChannelId();
    const { data: channel , isLoading: channelLoading } = useGetChannel({ id: channelId });

    if(channelLoading){
        <div className="flex-1 flex justify-center items-center h-full">
            <Loader className="animate-spin size-5 text-muted-foreground" />
        </div>
    }

    if(!channel){
        return (
            <div className="flex-1 flex flex-col gap-y-4 justify-center items-center h-full">
                <TriangleAlert className="size-6 text-muted-foreground" />
                <span className="text-muted-foreground text-sm">
                    Channel not found
                </span>
            </div>
        )

    }
    return (
        <div className="flex flex-col h-full">
            <Header title={channel.name} />
            <div className="flex-1" />
            <ChatInput
                placeholder={`Message # ${channel.name}`}
            />
        </div>
    );
}
export default ChannelPage;