"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="min-h-[60vh] flex flex-col items-center justify-center p-6">
      <Card className="w-full max-w-[320px]">
        <CardContent className="pt-6 text-center space-y-4">
          <p className="font-medium">문제가 발생했습니다.</p>
          <p className="text-sm text-muted-foreground">
            잠시 후 다시 시도해 주세요.
          </p>
          <div className="flex flex-col gap-2">
            <Button onClick={reset}>다시 시도</Button>
            <Link href="/">
              <Button variant="outline" className="w-full">
                홈으로
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
