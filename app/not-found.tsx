import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function NotFound() {
  return (
    <main className="min-h-[60vh] flex flex-col items-center justify-center p-6">
      <Card className="w-full max-w-[320px]">
        <CardContent className="pt-6 text-center space-y-4">
          <p className="font-medium">페이지를 찾을 수 없습니다.</p>
          <p className="text-sm text-muted-foreground">
            주소를 확인하거나 아래 버튼으로 이동해 주세요.
          </p>
          <div className="flex flex-col gap-2">
            <Link href="/arena">
              <Button className="w-full">아레나로</Button>
            </Link>
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
