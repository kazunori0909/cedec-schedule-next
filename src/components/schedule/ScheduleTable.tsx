"use client";

import { useMemo } from "react";
import type { RoomColumn } from "@/types/schedule";
import { generateTimeRows, getSessionId, buildMatrix } from "@/lib/schedule";
import { getFloorURL } from "@/lib/cedec";
import { SessionCell } from "@/components/schedule/SessionCell";
import { RoomLink } from "@/components/ui/RoomLink";
import { sessionTdVariants, resolveSessionState } from "@/components/ui/sessionVariants";
import { tableHeaderVariants, tableCellVariants } from "@/components/ui/tableVariants";

interface Props {
  columns: RoomColumn[];
  timeRange: { min: number; max: number };
  dayIndex: number;
  year: string;
  favorites: Record<string, boolean>;
  hideSpecs: Record<string, boolean>;
  cedilLookup: Record<string, string>;
  currentTimeStr?: string; // ハイライト対象の時刻文字列
  onToggleFavorite: (sessionId: string) => void;
}

export function ScheduleTable({
  columns,
  timeRange,
  dayIndex,
  year,
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
  const matrix = useMemo(() => buildMatrix(timeRows, columns), [timeRows, columns]);

  return (
    <div className="overflow-x-auto">
      <table className="border-collapse w-full min-w-300">
        <thead>
          <tr>
            <th className={tableHeaderVariants({ kind: "time" })}></th>
            {columns.map((col) => (
              <th key={col.key} className={tableHeaderVariants({ kind: "room" })}>
                <RoomLink name={col.name} url={getFloorURL(col.name, year)} />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {timeRows.map((time, rowIdx) => {
            const isCurrent = currentTimeStr === time;
            return (
              <tr key={time} data-time={time}>
                <td className={tableCellVariants({ kind: "time", highlight: isCurrent })}>
                  {time}
                </td>
                {columns.map((col, colIdx) => {
                  const cell = matrix[rowIdx][colIdx];
                  if (cell.kind === "occupied") return null;
                  if (cell.kind === "empty") {
                    return (
                      <td
                        key={col.key}
                        className={tableCellVariants({ kind: "empty", highlight: isCurrent })}
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
                      className={sessionTdVariants({
                        state: resolveSessionState(session, isFav),
                        fullSpan: cell.isFullSpan,
                      })}
                    >
                      <SessionCell
                        session={session}
                        year={year}
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
