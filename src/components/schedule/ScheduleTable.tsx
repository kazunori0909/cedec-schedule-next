"use client";

import { useMemo } from "react";
import type { RoomColumn, UnifiedSession } from "@/types/schedule";
import {
  generateTimeRows,
  getRowSpan,
  getSessionStartString,
  getSessionEndString,
  getSessionId,
} from "@/lib/schedule";
import { getFloorURL } from "@/lib/cedec";
import { SessionCell } from "@/components/schedule/SessionCell";
import { cn } from "@/lib/utils";

interface Props {
  columns: RoomColumn[];
  timeRange: { min: number; max: number };
  dayIndex: number;
  year: string;
  domain: string;
  favorites: Record<string, boolean>;
  hideSpecs: Record<string, boolean>;
  cedilLookup: Record<string, string>;
  currentTimeStr?: string; // ハイライト対象の時刻文字列
  onToggleFavorite: (sessionId: string) => void;
}

interface CellInfo {
  kind: "session" | "event" | "empty" | "occupied";
  session?: UnifiedSession;
  rowSpan?: number;
  colSpan?: number;
  isFullSpan?: boolean;
}

export function ScheduleTable({
  columns,
  timeRange,
  dayIndex,
  year,
  domain,
  favorites,
  hideSpecs,
  cedilLookup,
  currentTimeStr,
  onToggleFavorite,
}: Props) {
  const timeRows = useMemo(
    () => generateTimeRows(timeRange.min, timeRange.max),
    [timeRange.min, timeRange.max]
  );

  // 2D マトリクス [rowIdx][colIdx] = CellInfo
  const matrix = useMemo(
    () => buildMatrix(timeRows, columns, dayIndex),
    [timeRows, columns, dayIndex]
  );

  return (
    <div className="overflow-x-auto">
      <table className="border-collapse w-full min-w-[1200px]">
        <thead>
          <tr>
            <th className="w-10 sticky left-0 bg-card z-10 border border-border text-center text-xs"></th>
            {columns.map((col) => {
              const floorURL = getFloorURL(col.name, year);
              return (
                <th
                  key={col.key}
                  className="border border-border bg-secondary px-2 py-2 text-base font-semibold text-secondary-foreground min-w-[140px]"
                >
                  {floorURL ? (
                    <a
                      href={floorURL}
                      target="_blank"
                      rel="noopener"
                      className="text-blue-600 hover:underline"
                    >
                      {col.name}
                    </a>
                  ) : (
                    col.name
                  )}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {timeRows.map((time, rowIdx) => {
            const isCurrent = currentTimeStr === time;
            return (
              <tr key={time} data-time={time}>
                <td
                  className={cn(
                    "w-10 sticky left-0 bg-card z-10 border border-border text-center text-[11px] text-muted-foreground align-top",
                    isCurrent && "bg-cyan-100 font-bold"
                  )}
                >
                  {time}
                </td>
                {columns.map((col, colIdx) => {
                  const cell = matrix[rowIdx][colIdx];
                  if (cell.kind === "occupied") return null;
                  if (cell.kind === "empty") {
                    return (
                      <td
                        key={col.key}
                        className={cn("border border-border align-top", isCurrent && "bg-cyan-100")}
                      ></td>
                    );
                  }
                  const session = cell.session!;
                  const sessionId = getSessionId(session, dayIndex);
                  const isFav = !!favorites[sessionId];
                  return (
                    <td
                      key={col.key}
                      rowSpan={cell.rowSpan}
                      colSpan={cell.colSpan}
                      className={cn(
                        "border border-border align-top p-2 rounded-md",
                        isFav ? "bg-pink-100" : "bg-zinc-100",
                        session.kind === "event" && session.isCustom && "bg-orange-100",
                        session.kind === "event" && !session.isCustom && "bg-white",
                        cell.isFullSpan && "text-center"
                      )}
                    >
                      <SessionCell
                        session={session}
                        year={year}
                        domain={domain}
                        isFavorite={isFav}
                        onToggleFavorite={() => onToggleFavorite(sessionId)}
                        cedilUrl={cedilLookup[sessionId]}
                        hideSpecs={hideSpecs}
                        roomName={col.name}
                      />
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// 2Dマトリクスを構築（rowspan/colspanの占有領域を計算）
function buildMatrix(timeRows: string[], columns: RoomColumn[], _dayIndex: number): CellInfo[][] {
  const rowCount = timeRows.length;
  const colCount = columns.length;
  const matrix: CellInfo[][] = Array.from({ length: rowCount }, () =>
    Array.from({ length: colCount }, () => ({ kind: "empty" }) as CellInfo)
  );
  const timeIndex = new Map<string, number>();
  timeRows.forEach((t, i) => timeIndex.set(t, i));

  for (let colIdx = 0; colIdx < columns.length; colIdx++) {
    const col = columns[colIdx];
    for (const session of col.sessions) {
      const startStr = getSessionStartString(session);
      const endStr = getSessionEndString(session);
      const startIdx = timeIndex.get(startStr);
      if (startIdx === undefined) continue;
      const rowSpan = getRowSpan(startStr, endStr);

      const isFullSpan = session.kind === "event" && session.data.colspan === "all";
      const colSpan = isFullSpan ? colCount : 1;

      matrix[startIdx][colIdx] = {
        kind: session.kind,
        session,
        rowSpan,
        colSpan,
        isFullSpan,
      };

      // rowSpan/colSpan の占有領域をマーク
      for (let r = 0; r < rowSpan; r++) {
        for (let c = 0; c < colSpan; c++) {
          if (r === 0 && c === 0) continue;
          if (startIdx + r >= rowCount) break;
          if (colIdx + c >= colCount) break;
          matrix[startIdx + r][colIdx + c] = { kind: "occupied" };
        }
      }
    }
  }

  return matrix;
}
