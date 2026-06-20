import type { CedilData, CedilItem } from "@/types/schedule";

const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
const cache: Record<string, CedilData> = {};

export async function fetchCedil(year: string): Promise<CedilData | null> {
  if (cache[year]) return cache[year];

  try {
    const res = await fetch(`${BASE_PATH}/web_data/${year}/cedil.json`, { cache: "no-store" });
    if (!res.ok) return null;
    const data = (await res.json()) as CedilData;
    cache[year] = data;
    return data;
  } catch {
    return null;
  }
}

// セッションタイトルの正規化（空白除去）
function normalizeTitle(title: string): string {
  return title.replace(/[\s　]/g, "");
}

// CEDiL データ取得日時（ISO 8601）を "YYYY/MM/DD HH:MM" 表示形式に整形する
export function formatCedilDate(iso: string): string {
  const d = new Date(iso);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const mi = String(d.getMinutes()).padStart(2, "0");
  return `${yyyy}/${mm}/${dd} ${hh}:${mi}`;
}

// セッションIDをキーに、CEDiL の URL を返すマップを生成
export function buildCedilLookup(
  cedilList: CedilItem[],
  sessions: Array<{ id: string; title: string; day: string }>,
  dateList: Date[]
): Record<string, string> {
  const lookup: Record<string, string> = {};

  for (const session of sessions) {
    const dayIdx = parseInt(session.day, 10) - 1;
    if (dayIdx < 0 || dayIdx >= dateList.length) continue;
    const sessionDate = dateList[dayIdx].getDate();
    const normalizedTitle = normalizeTitle(session.title);

    for (const item of cedilList) {
      if (item.date !== undefined && item.date !== sessionDate) continue;
      if (!normalizedTitle.includes(normalizeTitle(item.title))) continue;
      lookup[session.id] = item.url;
      break;
    }
  }
  return lookup;
}
