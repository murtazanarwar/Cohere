"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ShieldCheck, XCircle } from "lucide-react";
import { motion } from "framer-motion";

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
      <DialogContent className="max-w-md rounded-2xl shadow-xl border border-gray-200">
        <DialogHeader className="flex flex-col items-center">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-blue-100 p-3 rounded-full mb-2"
          >
            <ShieldCheck className="w-6 h-6 text-blue-600" />
          </motion.div>
          <DialogTitle className="text-lg font-semibold">
            Incoming Secure Drop Request
          </DialogTitle>
        </DialogHeader>

        <motion.p
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="text-center text-sm text-gray-600 mt-2"
        >
          <span className="font-medium text-gray-800">{fromUserName}</span> wants
          to start a Secure Drop with you. Do you want to accept?
        </motion.p>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex gap-3 mt-6 justify-center"
        >
          <Button
            variant="outline"
            className="flex items-center gap-1 border-red-300 text-red-600 hover:bg-red-50"
            onClick={onDecline}
          >
            <XCircle className="w-4 h-4" /> Decline
          </Button>
          <Button
            className="flex items-center gap-1 bg-blue-600 hover:bg-blue-700"
            onClick={onAccept}
          >
            <ShieldCheck className="w-4 h-4" /> Accept
          </Button>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
}
