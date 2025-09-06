// secure-drop-modal.tsx
"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useEffect, useRef, useState } from "react";
import { useSecureDropContext } from "@/components/secure-drop-provider";
import { PaperclipIcon, FileIcon, SendIcon } from "lucide-react";
import { motion } from "framer-motion";

type Props = {
  peerId: string;
  waiting?: boolean;
  onClose: () => void;
};

export default function SecureDropModal({ peerId, waiting, onClose }: Props) {
  const { sendMessage, sendFile, messages } = useSecureDropContext();
  const [text, setText] = useState("");
  const [sendingFile, setSendingFile] = useState<null | { name: string; status: "sending" | "sent" }>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function onSendText() {
    if (!text.trim()) return;
    try {
      sendMessage(text.trim());
      setText("");
    } catch (err) {
      console.warn("send message failed", err);
    }
  }

  function onChooseFile() {
    fileInputRef.current?.click();
  }

  async function onFilePicked(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setSendingFile({ name: f.name, status: "sending" });
    try {
      await sendFile(f);
      setSendingFile({ name: f.name, status: "sent" });
      e.currentTarget.value = "";
    } catch (err) {
      console.warn("file send failed", err);
      setSendingFile(null);
    }
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-xl rounded-2xl shadow-2xl border border-gray-200 bg-gradient-to-br from-white to-gray-50">
        <DialogHeader>
          <DialogTitle>Secure Drop</DialogTitle>
          <p className="text-xs text-gray-500 mt-1">
            {waiting ? "Waiting for peer..." : `Connected with ${peerId}`}
          </p>
        </DialogHeader>

        {waiting ? (
          <div className="flex flex-col items-center justify-center py-10 text-gray-500">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
              className="w-10 h-10 border-4 border-blue-400 border-t-transparent rounded-full mb-4"
            />
            <p className="text-sm">Waiting for {peerId} to accept...</p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {/* Chat area */}
            <div className="border rounded-xl p-4 max-h-72 overflow-auto bg-white/70 backdrop-blur-md shadow-inner">
              {messages.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center">No messages yet</p>
              ) : (
                messages.map((m) => {
                  const isOut = m.direction === "out";
                  return (
                    <motion.div
                      key={m.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2 }}
                      className={`mb-3 flex ${isOut ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`px-3 py-2 rounded-2xl max-w-[75%] shadow-sm ${
                          isOut
                            ? "bg-blue-600 text-white rounded-br-none"
                            : "bg-gray-100 text-gray-900 rounded-bl-none"
                        }`}
                      >
                        {"text" in m && <div className="whitespace-pre-wrap">{m.text}</div>}

                        {"file" in m && m.file && (
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-2">
                              <FileIcon size={16} />
                              <span className="text-sm font-medium truncate">{m.file.name}</span>
                            </div>
                            <div className="text-xs text-gray-400">
                              {Math.round(m.file.size / 1024)} KB
                            </div>
                            {m.direction === "in" && (
                              <a
                                className="text-xs underline"
                                href={URL.createObjectURL(m.file)}
                                target="_blank"
                                rel="noreferrer"
                                download={m.file.name}
                              >
                                Download
                              </a>
                            )}
                            {m.direction === "out" && (
                              <div className="text-xs">{m.status === "sending" ? "Sending..." : "Sent"}</div>
                            )}
                          </div>
                        )}
                      </div>
                    </motion.div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Controls */}
            <div className="flex gap-2 items-center bg-gray-50 rounded-full px-3 py-2 shadow-sm">
              <input
                className="flex-1 bg-transparent outline-none text-sm"
                placeholder="Type a message..."
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    onSendText();
                  }
                }}
              />
              <input ref={fileInputRef} type="file" className="hidden" onChange={onFilePicked} />
              <button
                type="button"
                onClick={onChooseFile}
                className="p-2 rounded-full hover:bg-gray-200"
                title="Send file"
              >
                <PaperclipIcon size={18} />
              </button>
              <Button
                size="sm"
                className="rounded-full px-4 flex items-center gap-1"
                onClick={onSendText}
              >
                <SendIcon size={16} /> Send
              </Button>
            </div>

            {/* End button */}
            <div className="flex justify-end pt-2">
              <Button variant="destructive" onClick={onClose} className="rounded-full px-6">
                End Session
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
