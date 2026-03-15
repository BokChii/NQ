"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

export function SignOutButton() {
  const router = useRouter();
  const supabase = createClient();
  const [open, setOpen] = useState(false);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  };

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        className="w-full text-muted-foreground"
        onClick={() => setOpen(true)}
      >
        로그아웃
      </Button>
      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title="로그아웃 하시겠어요?"
        confirmLabel="로그아웃"
        onConfirm={handleSignOut}
      />
    </>
  );
}
