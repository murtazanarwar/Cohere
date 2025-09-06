"use client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

type Props = {
  peerId: string;
  waiting?: boolean;
  onClose: () => void;
};

export default function SecureDropModal({ peerId, waiting, onClose }: Props) {
  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Secure Drop {waiting ? "(Waiting...)" : ""}</DialogTitle>
        </DialogHeader>
        {waiting ? (
          <p className="text-sm">Waiting for {peerId} to accept...</p>
        ) : (
          <div className="flex flex-col gap-4">
            <p className="text-sm">Connected with {peerId}</p>
            {/* chat / file UI goes here */}
            <Button onClick={onClose}>End</Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
