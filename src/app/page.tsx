"use client";
import { useAuthActions } from "@convex-dev/auth/react"
import { UserButton } from "./auth/user-button";

export default function Home() {
  const { signOut } = useAuthActions();
  return (
    <div>
      <UserButton />
    </div>
  );
}