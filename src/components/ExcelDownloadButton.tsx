"use client";

import { useState } from "react";
import { Download, Loader2 } from "lucide-react";
import type { ScheduleData } from "@/types/schedule";
import { exportScheduleToExcel } from "@/lib/exportExcel";
import { Button } from "@/components/ui/button";

interface Props {
  scheduleData: ScheduleData;
  year: string;
  favorites: Record<string, boolean>;
}

export function ExcelDownloadButton({ scheduleData, year, favorites }: Props) {
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    setLoading(true);
    try {
      await exportScheduleToExcel(scheduleData, year, favorites);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      variant="outline"
      size="icon-sm"
      onClick={handleClick}
      disabled={loading}
      title="Excelとしてダウンロード"
      aria-label={loading ? "Excelを生成中" : "Excelとしてダウンロード"}
      className="border-emerald-600 text-emerald-700 hover:bg-emerald-600 hover:text-white"
    >
      {loading ? <Loader2 className="animate-spin" /> : <Download />}
    </Button>
  );
}
