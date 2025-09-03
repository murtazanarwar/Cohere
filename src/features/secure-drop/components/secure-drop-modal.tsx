'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { XIcon, Paperclip, Send, LinkIcon } from 'lucide-react';
import { useSecureDrop } from '../api/use-secure-drop';
import { useGetMember } from '@/features/members/api/use-get-member';
import { Id } from '../../../../convex/_generated/dataModel';

type Props = {
  currentUserId: Id<"members">;
  targetUserId: Id<"members">;
  onClose: () => void;
};

/**
 * SecureDropModal
 * - Uses your useSecureDrop hook for WebRTC DataChannel transfers.
 * - Auto-starts the drop when mounted (since Profile opens the modal as initiator).
 * - Cleans up on close. Responsive + consistent with other Dialog-based modals.
 */
export default function SecureDropModal({ currentUserId, targetUserId, onClose }: Props) {
  const { initiateDrop, sendText, sendFile, endDrop, connected, messages } = useSecureDrop({ currentUserId });
  const [input, setInput] = useState('');
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement | null>(null);
  const getMember = useGetMember({ id: targetUserId });

  // Auto-initiate when the modal opens (Profile calls this as initiator)
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        await initiateDrop(targetUserId);
      } catch (err) {
        // non-blocking: show small toast + allow user to retry
        console.warn('initiateDrop error', err);
        toast.error('Failed to start secure drop (network).');
      }
    })();

    return () => {
      // cleanup on unmount
      if (mounted) {
        try {
          endDrop(targetUserId);
        } catch {}
      }
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUserId, targetUserId]);

  // close handler: ensure we teardown the connection then notify parent
  const handleClose = () => {
    try {
      endDrop(targetUserId);
    } catch {}
    onClose();
  };

  const handleSend = () => {
    const text = input.trim();
    if (!text) return;
    try {
      sendText(text);
      setInput('');
    } catch (err) {
      console.warn(err);
      toast.error('Failed to send message.');
    }
  };

  const handleFilePick = async (file?: File) => {
    const f = file || fileRef.current?.files?.[0];
    if (!f) return;
    setUploading(true);
    try {
      await sendFile(f);
      toast.success('File sent');
    } catch (err) {
      console.warn('sendFile failed', err);
      toast.error('File transfer failed');
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  return (
    <Dialog open onOpenChange={(open) => { if (!open) handleClose(); }}>
      <DialogContent className="max-w-3xl w-full sm:w-[720px] md:w-[820px] [&>button]:hidden" >
        <DialogHeader>
          <div className="flex items-center justify-between w-full">
            <DialogTitle className="flex items-center gap-3">
              <span className="text-base font-semibold">Secure Drop</span>
              <span className={`text-xs px-2 py-1 rounded-full ${connected ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                {connected ? 'Connected' : 'Connecting...'}
              </span>
            </DialogTitle>

            <div className="flex items-center gap-2">
              <Button variant="ghost" size="iconSm" onClick={handleClose} aria-label="Close secure drop">
                <XIcon className="size-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="mt-2 grid grid-cols-1 md:grid-cols-12 gap-4">
          {/* Left: member summary */}
          <div className="md:col-span-4 p-4 bg-white/50 dark:bg-slate-800/40 rounded-lg border">
            <p className="text-sm text-muted-foreground">Private, ephemeral channel</p>
            <p className="mt-3 font-medium">{`With: ${getMember.data?.user.name?.split(" ")[0].toUpperCase()}`}</p>
            <p className="mt-1 text-xs text-muted-foreground">Messages & files go peer-to-peer and are not stored on the server.</p>

            <Separator className="my-3" />

            <div className="flex flex-col gap-2">
              <div className="text-xs text-muted-foreground">Status</div>
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${connected ? 'bg-green-500' : 'bg-yellow-500'}`} />
                <div className="text-sm">{connected ? 'Peer connected' : 'Waiting for peer...'}</div>
              </div>

              <div className="flex gap-2 mt-4">
                <Button disabled={!connected} onClick={() => fileRef.current?.click()} className="flex-1" aria-label="Attach file">
                  <Paperclip className="mr-2 size-4" /> Attach
                </Button>
                <input ref={fileRef} type="file" className="hidden" onChange={(e) => { if (e.target.files?.[0]) handleFilePick(e.target.files[0]); }} />
                <Button variant="outline" onClick={() => { toast('Secure Drop active'); }} className="px-3">Help</Button>
              </div>
            </div>
          </div>

          {/* Right: messages */}
          <div className="md:col-span-8 flex flex-col h-[420px] bg-white/50 dark:bg-slate-800/40 rounded-lg border overflow-hidden">
            <div className="px-4 py-3 border-b">
              <p className="text-sm font-medium">Secure Conversation</p>
              <p className="text-xs text-muted-foreground">Closed when you exit — no history retained on server.</p>
            </div>

            <div className="flex-1 px-4 py-3 overflow-y-auto" id="secure-drop-messages">
              {messages.length === 0 && (
                <div className="h-full flex items-center justify-center text-sm text-muted-foreground">No messages yet</div>
              )}

              <div className="flex flex-col gap-3">
                {messages.map((m) => (
                  <div key={m.id} className={`max-w-[85%] ${m.fromMe ? 'ml-auto text-right' : ''}`}>
                    <div className={`${m.fromMe ? 'inline-block bg-blue-600 text-white' : 'inline-block bg-gray-100 dark:bg-slate-700 text-slate-900 dark:text-white'} px-3 py-2 rounded-lg break-words`}>
                      {m.text}
                      {m.url && (
                        <div className="mt-2">
                          <a href={m.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-sm underline">
                            <LinkIcon className="size-4" /> Download
                          </a>
                        </div>
                      )}
                    </div>
                    <div className="text-[11px] text-muted-foreground mt-1">{new Date(m.time).toLocaleTimeString()}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="px-4 py-3 border-t bg-white/60 dark:bg-slate-900/50 flex gap-2 items-center">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={connected ? "Type a private message..." : "Waiting for peer..."}
                disabled={!connected}
                onKeyDown={(e) => { if (e.key === 'Enter') handleSend(); }}
              />
              <input type="file" className="hidden" ref={fileRef} onChange={(e) => { if (e.target.files?.[0]) handleFilePick(e.target.files[0]); }} />
              <Button disabled={!connected || uploading} onClick={handleSend} aria-label="Send message">
                <Send className="size-4" />
              </Button>
              <Button variant="ghost" onClick={handleClose} className="ml-2">
                Close
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
