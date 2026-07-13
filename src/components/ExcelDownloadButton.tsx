"use client";

import { useState } from "react";
import { Download } from "lucide-react";
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
      size="sm"
      onClick={handleClick}
      disabled={loading}
      title="Excelとしてダウンロード"
      className="border-emerald-600 text-emerald-700 hover:bg-emerald-600 hover:text-white"
    >
      <Download />
      {loading ? "生成中..." : "Excel DL"}
    </Button>
  );
}
