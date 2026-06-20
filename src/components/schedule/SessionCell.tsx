"use client";

import { useState } from "react";
import { ExternalLink, Hash, Star } from "lucide-react";
import type { UnifiedSession, ExtraEvent } from "@/types/schedule";
import { CategoryBadge } from "@/components/CategoryBadge";
import { RoomLink } from "@/components/ui/RoomLink";
import { resolveDetailUrl, getYoutubeURL, getFloorURL } from "@/lib/cedec";
import { isCanceledSession } from "@/lib/schedule";
import { cn, safeExternalUrl, hashTagUrl } from "@/lib/utils";

interface Props {
  session: UnifiedSession;
  year: string;
  isFavorite: boolean;
  onToggleFavorite: () => void;
  cedilUrl?: string;
  hideSpecs: Record<string, boolean>;
  roomName: string;
}

export function SessionCell({
  session,
  year,
  isFavorite,
  onToggleFavorite,
  cedilUrl,
  hideSpecs,
  roomName,
}: Props) {
  if (session.kind === "event") {
    return <EventCellContent event={session.data} isCustom={!!session.isCustom} />;
  }

  const s = session.data;
  // 外部 URL は safeExternalUrl で http(s) スキームに限定し XSS を防ぐ
  const detailUrl = safeExternalUrl(resolveDetailUrl(s.detail_url, year));
  const youtubeUrl = safeExternalUrl(getYoutubeURL(s));
  const safeCedilUrl = safeExternalUrl(cedilUrl);
  const isCanceled = isCanceledSession(s.title);
  const isHidden = !!hideSpecs[s.category];

  if (isHidden) {
    return <div className="text-xs text-muted-foreground italic">（フィルター中）</div>;
  }

  const floorURL = safeExternalUrl(getFloorURL(roomName, year));

  return (
    <div
      className={cn(
        "flex flex-col gap-1.5 h-full text-xs leading-tight",
        isCanceled && "opacity-50"
      )}
    >
      <div className="flex items-center justify-between gap-1">
        <p className="font-semibold text-session-text">
          Room: <RoomLink name={roomName} url={floorURL ?? undefined} />
        </p>
        <button
          type="button"
          onClick={onToggleFavorite}
          aria-label="お気に入り切替"
          className="shrink-0"
        >
          <Star
            className={cn(
              "w-4 h-4 transition-colors",
              isFavorite ? "fill-star text-star" : "text-session-dim hover:text-star"
            )}
          />
        </button>
      </div>

      <hr className="border-dashed border-session-divider" />

      {(s.category || (s.sub_category && s.sub_category.length > 0)) && (
        <div className="flex flex-wrap gap-1">
          {s.category && <CategoryBadge category={s.category} />}
          {s.sub_category?.map((sub) => (
            <CategoryBadge key={sub} category={sub} variant="sub" />
          ))}
        </div>
      )}

      {detailUrl ? (
        <a
          href={detailUrl}
          target="_blank"
          rel="noopener"
          className="font-bold text-session-link hover:underline border-b border-dashed border-session-divider pb-1"
        >
          {s.title}
        </a>
      ) : (
        <p className="font-bold border-b border-dashed border-session-divider pb-1">{s.title}</p>
      )}

      <SpeakerList speakers={s.speakers} />

      <div className="flex flex-wrap items-center gap-2 mt-auto">
        <CedilStatus url={safeCedilUrl} />
        {youtubeUrl && (
          <a
            href={youtubeUrl}
            target="_blank"
            rel="noopener"
            className="inline-flex items-center gap-1 text-session-media hover:underline"
          >
            <ExternalLink className="w-3 h-3" /> YouTube
          </a>
        )}
      </div>
    </div>
  );
}

function SpeakerList({ speakers }: { speakers: { name: string; company: string }[] }) {
  const [expanded, setExpanded] = useState(false);
  if (!speakers || speakers.length === 0) return null;

  const main = speakers[0];
  const rest = speakers.slice(1);
  return (
    <div className="space-y-0.5">
      <SpeakerItem speaker={main} />
      {rest.length > 0 && !expanded && (
        <button
          type="button"
          onClick={() => setExpanded(true)}
          className="text-session-link-sub underline text-[10px]"
        >
          ほか{rest.length}名
        </button>
      )}
      {expanded &&
        rest.map((sp, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setExpanded(false)}
            className="text-left w-full"
          >
            <SpeakerItem speaker={sp} />
          </button>
        ))}
    </div>
  );
}

function SpeakerItem({ speaker }: { speaker: { name: string; company: string } }) {
  return (
    <div className="flex flex-col">
      <span className="text-session-text">{speaker.name}</span>
      <span className="text-session-meta text-[10px]">{speaker.company}</span>
    </div>
  );
}

function CedilStatus({ url }: { url?: string }) {
  if (!url) {
    return <span className="text-session-dim text-[10px]">資料公開: 不明</span>;
  }
  return (
    <a
      href={`${url}#breadcrumbs`}
      target="_blank"
      rel="noopener"
      className="text-session-cedil hover:underline text-[10px] inline-flex items-center gap-0.5"
    >
      資料公開: 公開済み
      <ExternalLink className="w-3 h-3" />
    </a>
  );
}

function EventCellContent({ event, isCustom }: { event: ExtraEvent; isCustom: boolean }) {
  const isFullColspan = event.colspan === "all";
  const detailUrl = safeExternalUrl(event.detail_url);
  // ハッシュタグはカンマ区切り。各タグの X ハッシュタグページ URL を生成する
  const hashTags = (event.hash_tag ?? "")
    .split(",")
    .map((tag) => tag.trim())
    .filter((tag) => tag !== "")
    .map((tag) => ({ tag, url: safeExternalUrl(hashTagUrl(tag)) }));

  return (
    <div
      className={cn(
        "flex flex-col gap-1 h-full text-xs leading-tight",
        isFullColspan && "items-center justify-center text-center text-2xl font-bold"
      )}
    >
      <h3 className={cn("font-bold", !isFullColspan && "text-sm")}>
        {isCustom && <span className="text-session-meta text-[10px] block">【非公式】</span>}
        {event.title}
      </h3>

      {/* 詳細リンクはタイトル直下にボタン風で配置し、タップ領域を広げて誤タップを防ぐ */}
      {detailUrl && (
        <a
          href={detailUrl}
          target="_blank"
          rel="noopener"
          className="inline-flex w-fit items-center gap-1 rounded border border-session-divider px-2 py-1 text-[10px] text-session-link-sub hover:bg-session-divider/20 hover:underline"
        >
          <ExternalLink className="w-3 h-3" /> 詳細
        </a>
      )}

      {event.html && (
        <div
          className="text-session-subtle text-[10px]"
          dangerouslySetInnerHTML={{ __html: event.html }}
        />
      )}

      {/* 会場・ハッシュタグはセル最下部にまとめ、詳細リンクから物理的に離す。
          ハッシュタグは会場表記の下に置き、詳細との距離を最大化して誤タップを防ぐ */}
      <div className="mt-auto flex flex-col gap-1">
        <div className="text-session-meta text-[10px]">@ {event.room_no}</div>
        {hashTags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {hashTags.map(({ tag, url }) =>
              url ? (
                <a
                  key={tag}
                  href={url}
                  target="_blank"
                  rel="noopener"
                  className="inline-flex items-center gap-0.5 rounded-full bg-session-divider/30 px-2 py-0.5 text-[10px] text-session-link-sub hover:underline"
                >
                  <Hash className="w-3 h-3" />
                  {tag}
                </a>
              ) : (
                <span key={tag} className="text-[10px] text-session-link-sub">
                  #{tag}
                </span>
              )
            )}
          </div>
        )}
      </div>
    </div>
  );
}
