"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dot } from "lucide-react";

const users = [
  {
    src: "https://github.com/shadcn.png",
    fallback: "CN",
    alt: "@shadcn",
  },
  {
    src: "https://github.com/leerob.png",
    fallback: "LR",
    alt: "@leerob",
  },
  {
    src: "https://github.com/evilrabbit.png",
    fallback: "ER",
    alt: "@evilrabbit",
  },
];

const LiveUsers = () => {
  return (
    <div className="ml-auto">
      <div className="flex items-center gap-2 border border-zinc-300 rounded-full px-2 py-1 h-10 w-fit bg-white shadow-sm">
        <div className="flex -space-x-2">
          {users.map((user, index) => (
            <Avatar
              key={index}
              className="w-8 h-8 ring-2 ring-white data-[slot=avatar]:grayscale rounded-full"
            >
              <AvatarImage src={user.src} alt={user.alt} />
              <AvatarFallback>{user.fallback}</AvatarFallback>
            </Avatar>
          ))}
        </div>
        <span className="text-sm font-medium flex items-center text-zinc-700 -ml-4">
          <Dot size={40} color="#ff0000" className="-mr-2" />
          {users.length}
        </span>
      </div>
    </div>
  );
};

export default LiveUsers;
