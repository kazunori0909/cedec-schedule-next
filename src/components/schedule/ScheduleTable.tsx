"use client";

import type { RoomColumn } from "@/types/schedule";
import { getSessionId, getSessionRoom, buildMatrix } from "@/lib/schedule";
import { getFloorURL } from "@/lib/cedec";
import { SessionCell } from "@/components/schedule/SessionCell";
import { RoomLink } from "@/components/ui/RoomLink";
import { sessionTdVariants, resolveSessionState } from "@/components/ui/sessionVariants";
import { tableHeaderVariants, tableCellVariants } from "@/components/ui/tableVariants";

interface Props {
  columns: RoomColumn[];
  timeRows: string[];
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
  timeRows,
  dayIndex,
  year,
  favorites,
  hideSpecs,
  cedilLookup,
  currentTimeStr,
  onToggleFavorite,
}: Props) {
  // 導出値のメモ化は React Compiler が行う（手動 useMemo は不要）
  // 2D マトリクス [rowIdx][colIdx] = CellInfo
  const matrix = buildMatrix(timeRows, columns);

  return (
    <div className="overflow-x-auto">
      <table className="border-collapse w-full min-w-300">
        <thead>
          <tr>
            <th className={tableHeaderVariants({ kind: "time" })}></th>
            {columns.map((col) => (
              <th key={col.key} className={tableHeaderVariants({ kind: "room" })}>
                <RoomLink
                  name={col.name}
                  url={col.roomName ? getFloorURL(col.roomName, year) : undefined}
                />
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
                        // 複数会場が混在するカラム（お気に入りモード）ではセッション自身の会場を使う
                        roomName={col.roomName ?? getSessionRoom(session)}
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
