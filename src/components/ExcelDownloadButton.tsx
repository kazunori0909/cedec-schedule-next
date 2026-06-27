"use client";

import { useState } from "react";
import { Download } from "lucide-react";
import type { ScheduleData } from "@/types/schedule";
import { exportScheduleToExcel } from "@/lib/exportExcel";

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
    <button
      onClick={handleClick}
      disabled={loading}
      title="Excelとしてダウンロード"
      className="flex items-center gap-1.5 rounded-md border border-emerald-600 text-emerald-700 px-3 py-1.5 text-sm font-medium hover:bg-emerald-600 hover:text-white cursor-pointer disabled:opacity-50 transition-colors"
    >
      <Download size={15} />
      <span>{loading ? "生成中..." : "Excel DL"}</span>
    </button>
  );
}
