"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

type Props = {
  fromUserName: string;
  onAccept: () => void;
  onDecline: () => void;
};

export default function SecureDropConfirmModal({
  fromUserName,
  onAccept,
  onDecline,
}: Props) {
  return (
    <Dialog open onOpenChange={(open) => !open && onDecline()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Secure Drop Request</DialogTitle>
        </DialogHeader>
        <p className="text-sm mt-2">
          {fromUserName} wants to start a Secure Drop with you. Accept?
        </p>
        <div className="flex gap-2 mt-4 justify-end">
          <Button variant="outline" onClick={onDecline}>
            Decline
          </Button>
          <Button onClick={onAccept}>Accept</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
