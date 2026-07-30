import type { Border, Borders, Fill } from "exceljs";
import type { ScheduleData } from "@/types/schedule";
import { buildMatrix, buildScheduleViewModel, getSessionId } from "@/lib/schedule";
import { findYearSetting, getDateList } from "@/lib/cedec";
import { resolveCategoryHex } from "@/components/categoryBadgeColors";

const thinBorder: Border = { style: "thin", color: { argb: "FF000000" } };
const allBorders: Partial<Borders> = {
  top: thinBorder,
  left: thinBorder,
  bottom: thinBorder,
  right: thinBorder,
};

// セッションセル背景色の淡色化レート（0: 元色のまま / 1: 白）。
// 画面のバッジ色をそのまま塗ると濃すぎて文字が読みにくいため白に寄せる
const FILL_LIGHTEN_RATE = 0.7;

// hex 6桁 + レートで白に近づける → ARGB 文字列を返す
function lightenToArgb(hex6: string, rate: number): string {
  const r = parseInt(hex6.slice(0, 2), 16);
  const g = parseInt(hex6.slice(2, 4), 16);
  const b = parseInt(hex6.slice(4, 6), 16);
  const lr = Math.round(r + (255 - r) * rate);
  const lg = Math.round(g + (255 - g) * rate);
  const lb = Math.round(b + (255 - b) * rate);
  const toHex = (n: number) => n.toString(16).padStart(2, "0").toUpperCase();
  return `FF${toHex(lr)}${toHex(lg)}${toHex(lb)}`;
}

function makeSolidFill(argb: string): Fill {
  return { type: "pattern", pattern: "solid", fgColor: { argb } };
}

// 時間帯を除いたセル内容を組み立てる
function formatCellContent(session: Parameters<typeof getSessionId>[0], isFav: boolean): string {
  const star = isFav ? "★ " : "";
  if (session.kind === "session") {
    const d = session.data;
    const speakers = d.speakers.map((s) => `${s.name}（${s.company}）`).join(", ");
    const cat = d.category ? `[${d.category}]` : "";
    return [star + d.title, speakers, cat].filter(Boolean).join("\n");
  }
  return star + session.data.title;
}

export async function exportScheduleToExcel(
  scheduleData: ScheduleData,
  year: string,
  favorites: Record<string, boolean>
): Promise<void> {
  const { Workbook } = await import("exceljs");
  const wb = new Workbook();

  const setting = findYearSetting(year);
  const dateList = getDateList(setting);

  for (let dayIndex = 0; dayIndex < dateList.length; dayIndex++) {
    const date = dateList[dayIndex];
    // お気に入りは★印で表現するためフィルターせず、画面と同じ導出ロジックを使う
    const { displayColumns: columns, timeRows } = buildScheduleViewModel(
      scheduleData,
      year,
      dayIndex,
      false,
      {}
    );
    if (columns.length === 0) continue;

    const matrix = buildMatrix(timeRows, columns);

    const m = date.getMonth() + 1;
    const d = date.getDate();
    const ws = wb.addWorksheet(`Day${dayIndex + 1} (${m}-${d})`);

    // 列幅: 時刻列 + 部屋列
    ws.getColumn(1).width = 7;
    columns.forEach((_, i) => {
      ws.getColumn(i + 2).width = 30;
    });

    // ヘッダー行（部屋名）— スチールブルー系の背景
    const headerRow = ws.addRow(["時刻", ...columns.map((c) => c.name)]);
    headerRow.eachCell({ includeEmpty: true }, (cell, colNumber) => {
      if (colNumber > columns.length + 1) return;
      cell.border = allBorders;
      cell.alignment = { vertical: "middle", horizontal: "center" };
      cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
      cell.fill = makeSolidFill("FF2D5F8A");
    });

    // データ行
    timeRows.forEach((time, rowIdx) => {
      const rowValues: (string | null)[] = [time];
      columns.forEach((_, colIdx) => {
        const cellInfo = matrix[rowIdx][colIdx];
        if (cellInfo.kind === "session" || cellInfo.kind === "event") {
          const session = cellInfo.session!;
          const sessionId = getSessionId(session, dayIndex);
          rowValues.push(formatCellContent(session, !!favorites[sessionId]));
        } else if (cellInfo.kind === "empty") {
          rowValues.push("");
        } else {
          // occupied: マージ範囲内のため空値
          rowValues.push(null);
        }
      });

      const row = ws.addRow(rowValues);

      // 時刻セル
      const timeCell = row.getCell(1);
      timeCell.border = allBorders;
      timeCell.alignment = { vertical: "middle", horizontal: "center" };

      // 部屋セル（occupied 以外）
      columns.forEach((_, colIdx) => {
        const cellInfo = matrix[rowIdx][colIdx];
        if (cellInfo.kind === "occupied") return;

        const wsCell = row.getCell(colIdx + 2);
        wsCell.border = allBorders;
        wsCell.alignment = {
          vertical: "middle",
          wrapText: cellInfo.kind === "session" || cellInfo.kind === "event",
        };

        // セッションセルにカテゴリ背景色を適用（淡色化レート適用・文字は黒）
        if (cellInfo.kind === "session" && cellInfo.session!.kind === "session") {
          const hex6 = resolveCategoryHex(cellInfo.session!.data.category);
          if (hex6) {
            wsCell.fill = makeSolidFill(lightenToArgb(hex6, FILL_LIGHTEN_RATE));
            wsCell.font = { color: { argb: "FF333333" } };
          }
        }
      });
    });

    // セルマージ（全行追加後に適用）
    timeRows.forEach((_, rowIdx) => {
      const excelRow = rowIdx + 2; // 1行目はヘッダー
      columns.forEach((_, colIdx) => {
        const cellInfo = matrix[rowIdx][colIdx];
        if (cellInfo.kind !== "session" && cellInfo.kind !== "event") return;
        const rowSpan = cellInfo.rowSpan ?? 1;
        const colSpan = cellInfo.isFullSpan ? columns.length : 1;
        if (rowSpan <= 1 && colSpan <= 1) return;
        ws.mergeCells(excelRow, colIdx + 2, excelRow + rowSpan - 1, colIdx + colSpan + 1);
      });
    });
  }

  // ブラウザ用: Buffer → Blob → ダウンロード
  const buffer = await wb.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `CEDEC${year}_schedule.xlsx`;
  a.click();
  URL.revokeObjectURL(url);
}
