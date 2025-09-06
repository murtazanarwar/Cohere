// secure-drop-modal.tsx
"use client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useEffect, useRef, useState } from "react";
import { useSecureDropContext } from "@/components/secure-drop-provider";
import { PaperclipIcon } from "lucide-react";

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
    // auto-scroll to bottom when messages change
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
      // reset input so same file can be picked again
      e.currentTarget.value = "";
    } catch (err) {
      console.warn("file send failed", err);
      setSendingFile(null);
    }
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            Secure Drop {waiting ? "(Waiting...)" : ""}
          </DialogTitle>
        </DialogHeader>

        {waiting ? (
          <p className="text-sm">Waiting for {peerId} to accept...</p>
        ) : (
          <div className="flex flex-col gap-4">
            <p className="text-sm">Connected with {peerId}</p>

            {/* Chat area */}
            <div className="border rounded-md p-3 max-h-64 overflow-auto bg-white/80">
              {messages.length === 0 ? (
                <p className="text-sm text-muted-foreground">No messages yet</p>
              ) : (
                messages.map((m) => {
                  const isOut = m.direction === "out";
                  return (
                    <div key={m.id} className={`mb-2 flex ${isOut ? "justify-end" : "justify-start"}`}>
                      <div className={`p-2 rounded-md max-w-[75%] ${isOut ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-900"}`}>
                        {("text" in m) && <div className="whitespace-pre-wrap">{m.text}</div>}
                        {("file" in m) && m.file && (
                          <div className="flex flex-col gap-1">
                            <div className="text-sm font-medium">{m.file.name}</div>
                            <div className="text-xs text-muted-foreground">
                              {Math.round(m.file.size / 1024)} KB
                            </div>
                            {/* Download link for received files */}
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
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Controls */}
            <div className="flex gap-2 items-center">
              <input
                className="flex-1 border rounded-md p-2"
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
                className="inline-flex items-center gap-2 px-3 py-2 border rounded-md hover:bg-gray-50"
                title="Send file"
              >
                <PaperclipIcon size={16} />
              </button>
              <Button onClick={onSendText}>Send</Button>
            </div>

            {/* End button */}
            <div className="flex justify-end pt-2">
              <Button variant="destructive" onClick={onClose}>
                End
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
