import { Suspense } from "react";
import { ScheduleView } from "@/components/ScheduleView";

export const dynamic = "force-static";

export default function Home() {
  return (
    <Suspense fallback={<div className="p-8 text-center">読み込み中...</div>}>
      <ScheduleView />
    </Suspense>
  );
}
