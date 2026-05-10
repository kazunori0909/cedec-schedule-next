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
