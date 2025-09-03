'use client';

import React from 'react';
import { initSocket, getSocket } from '@/lib/socket'; // use project alias
import { Button } from '@/components/ui/button';
import { MessageSquareLock } from 'lucide-react';

type Props = {
  targetUserId: string;
  currentUserId: string;
  onOpen?: () => void; // callback to open modal in parent
  className?: string;
};

export default function SecureDropButton({ targetUserId, currentUserId, onOpen, className }: Props) {
  const onClick = async () => {
    try {
      // initialize socket (idempotent)
      initSocket(currentUserId);

      // ensure socket is ready
      const socket = getSocket();

      // emit invite to recipient
      socket.emit('secure-drop-request', { toUserId: targetUserId, fromUserId: currentUserId });

      // open modal in parent (parent will render SecureDropModal)
      onOpen?.();
    } catch (err) {
      console.error('SecureDropButton error', err);
      // optionally show toast here
    }
  };

  return (
    <Button
      variant="outline"
      className={`w-full flex items-center gap-2 justify-center ${className ?? ''}`}
      onClick={onClick}
      aria-label="Start secure drop"
    >
      <div className="size-9 flex items-center justify-center">
        <MessageSquareLock className="size-4" />
      </div>
      <span>Secure Drop</span>
    </Button>
  );
}
