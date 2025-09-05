"use client";

import React, { useEffect, useRef, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { XIcon, Send } from "lucide-react";
import { useGetMember } from "@/features/members/api/use-get-member";
import { Id } from "../../../../convex/_generated/dataModel";
import { useSecureDrop } from "../api/use-secure-drop";

type Props = {
  currentUserId: Id<"members">;
  targetUserId: Id<"members">;
  initiator?: boolean;
  onClose: () => void;
};

export default function SecureDropModal({
  currentUserId,
  targetUserId,
  initiator = false,
  onClose,
}: Props) {
  const { initiate, sendMessage, end, state } = useSecureDrop(currentUserId);

  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<{ id: string; text: string; fromMe: boolean; time: number }[]>([]);
  const getMember = useGetMember({ id: targetUserId });

  // Auto-initiate if I’m the initiator
  useEffect(() => {
    if (initiator) {
      initiate(targetUserId).catch(() => {
        toast.error("Failed to start secure drop.");
      });
    }

    return () => {
      end(targetUserId);
    };
  }, [initiator, targetUserId]);

  const handleSend = () => {
    const text = input.trim();
    if (!text) return;
    try {
      sendMessage(text);
      setMessages((prev) => [
        ...prev,
        { id: crypto.randomUUID(), text, fromMe: true, time: Date.now() },
      ]);
      setInput("");
    } catch {
      toast.error("Failed to send message.");
    }
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl w-full sm:w-[720px] md:w-[820px] [&>button]:hidden">
        <DialogHeader>
          <div className="flex items-center justify-between w-full">
            <DialogTitle className="flex items-center gap-3">
              <span className="text-base font-semibold">Secure Drop</span>
              <span
                className={`text-xs px-2 py-1 rounded-full ${
                  state.type === "chat"
                    ? "bg-green-100 text-green-700"
                    : "bg-yellow-100 text-yellow-700"
                }`}
              >
                {state.type === "chat" ? "Connected" : "Connecting..."}
              </span>
            </DialogTitle>

            <Button variant="ghost" size="iconSm" onClick={onClose}>
              <XIcon className="size-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="mt-2 grid grid-cols-1 md:grid-cols-12 gap-4">
          {/* Left: member info */}
          <div className="md:col-span-4 p-4 bg-white/50 dark:bg-slate-800/40 rounded-lg border">
            <p className="text-sm text-muted-foreground">Private channel</p>
            <p className="mt-3 font-medium">
              {`With: ${getMember.data?.user.name?.split(" ")[0].toUpperCase()}`}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Messages go peer-to-peer.
            </p>

            <Separator className="my-3" />

            <div className="text-xs text-muted-foreground mb-2">Status</div>
            <div className="flex items-center gap-2">
              <div
                className={`w-2 h-2 rounded-full ${
                  state.type === "chat" ? "bg-green-500" : "bg-yellow-500"
                }`}
              />
              <div className="text-sm">
                {state.type === "chat" ? "Peer connected" : "Waiting for peer..."}
              </div>
            </div>
          </div>

          {/* Right: messages */}
          <div className="md:col-span-8 flex flex-col h-[420px] rounded-lg border overflow-hidden">
            <div className="flex-1 px-4 py-3 overflow-y-auto">
              {messages.length === 0 && (
                <div className="h-full flex items-center justify-center text-sm text-muted-foreground">
                  No messages yet
                </div>
              )}

              <div className="flex flex-col gap-3">
                {messages.map((m) => (
                  <div
                    key={m.id}
                    className={`max-w-[85%] ${
                      m.fromMe ? "ml-auto text-right" : ""
                    }`}
                  >
                    <div
                      className={`${
                        m.fromMe
                          ? "inline-block bg-blue-600 text-white"
                          : "inline-block bg-gray-100 dark:bg-slate-700 text-slate-900 dark:text-white"
                      } px-3 py-2 rounded-lg break-words`}
                    >
                      {m.text}
                    </div>
                    <div className="text-[11px] text-muted-foreground mt-1">
                      {new Date(m.time).toLocaleTimeString()}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="px-4 py-3 border-t flex gap-2 items-center">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={
                  state.type === "chat" ? "Type a private message..." : "Waiting for peer..."
                }
                disabled={state.type !== "chat"}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
              />
              <Button
                disabled={state.type !== "chat"}
                onClick={handleSend}
                aria-label="Send message"
              >
                <Send className="size-4" />
              </Button>
              <Button variant="ghost" onClick={onClose}>
                Close
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
