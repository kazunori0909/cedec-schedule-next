"use client";

import { useState } from "react";
import { Hash, Radio, Star } from "lucide-react";
import type { UnifiedSession, ExtraEvent } from "@/types/schedule";
import { CategoryBadge } from "@/components/CategoryBadge";
import { RoomLink } from "@/components/ui/RoomLink";
import { ExternalTextLink } from "@/components/ui/ExternalTextLink";
import { resolveDetailUrl, getYoutubeURL, getFloorURL, isLiveUrlPending } from "@/lib/cedec";
import { isCanceledSession } from "@/lib/schedule";
import { cn, hashTagUrl } from "@/lib/utils";

interface Props {
  session: UnifiedSession;
  year: string;
  isFavorite: boolean;
  onToggleFavorite: () => void;
  cedilUrl?: string;
  hideSpecs: Record<string, boolean>;
  roomName: string;
}

// 外部 URL の検証（safeExternalUrl）と rel="noopener" は ExternalTextLink / RoomLink 側で行う
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
  const isCanceled = isCanceledSession(s.title);
  const isHidden = !!hideSpecs[s.category];

  if (isHidden) {
    return <div className="text-xs text-muted-foreground italic">（フィルター中）</div>;
  }

  return (
    <div
      className={cn(
        "flex flex-col gap-1.5 h-full text-xs leading-tight",
        isCanceled && "opacity-50"
      )}
    >
      <div className="flex items-center justify-between gap-1">
        <p className="font-semibold text-session-text inline-flex items-center gap-1">
          Room: <RoomLink name={roomName} url={getFloorURL(roomName, year)} />
          {s.is_invited && (
            <span className="inline-block rounded border border-amber-500 px-1 py-0.5 text-2xs font-bold leading-none text-amber-600">
              招待
            </span>
          )}
        </p>
        <button
          type="button"
          onClick={onToggleFavorite}
          aria-label="お気に入り切替"
          className="shrink-0 cursor-pointer"
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
            <CategoryBadge key={sub} category={sub} />
          ))}
        </div>
      )}

      <ExternalTextLink
        href={resolveDetailUrl(s.detail_url, year)}
        icon={false}
        className="inline font-bold text-session-link border-b border-dashed border-session-divider pb-1"
        fallback={
          <p className="font-bold border-b border-dashed border-session-divider pb-1">{s.title}</p>
        }
      >
        {s.title}
      </ExternalTextLink>

      <SpeakerList speakers={s.speakers} />

      <div className="flex flex-wrap items-center gap-2 mt-auto">
        <CedilStatus url={cedilUrl} />
        <ExternalTextLink
          href={getYoutubeURL(s)}
          className="text-session-media"
          fallback={isLiveUrlPending(s) ? <LiveUrlPendingBadge /> : null}
        >
          YouTube
        </ExternalTextLink>
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
          className="text-session-link-sub underline text-2xs cursor-pointer"
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
            className="text-left w-full cursor-pointer"
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
      <span className="text-session-meta text-2xs">{speaker.company}</span>
    </div>
  );
}

// Live 配信は行われるが、配信 URL がまだ公式に掲載されていないセッションの表示。
// リンクではないため <span> で「Live配信予定」を明記する（URL 掲載後は YouTube リンクに切り替わる）。
function LiveUrlPendingBadge() {
  return (
    <span className="inline-flex items-center gap-0.5 text-session-media text-2xs">
      <Radio className="size-3" />
      Live配信予定
    </span>
  );
}

function CedilStatus({ url }: { url?: string }) {
  return (
    <ExternalTextLink
      href={url ? `${url}#breadcrumbs` : undefined}
      className="text-session-cedil text-2xs gap-0.5"
      fallback={<span className="text-session-dim text-2xs">資料公開: 不明</span>}
    >
      資料公開: 公開済み
    </ExternalTextLink>
  );
}

function EventCellContent({ event, isCustom }: { event: ExtraEvent; isCustom: boolean }) {
  const isFullColspan = event.colspan === "all";
  const hashTags = event.hash_tag ?? [];

  return (
    <div
      className={cn(
        "flex flex-col gap-1 h-full text-xs leading-tight",
        isFullColspan && "items-center justify-center text-center text-2xl font-bold"
      )}
    >
      <h3 className={cn("font-bold", !isFullColspan && "text-sm")}>
        {isCustom && <span className="text-session-meta text-2xs block">【非公式】</span>}
        {event.title}
      </h3>

      {/* 詳細リンクはタイトル直下にボタン風で配置し、タップ領域を広げて誤タップを防ぐ */}
      <ExternalTextLink
        href={event.detail_url}
        className="w-fit rounded border border-session-divider px-2 py-1 text-2xs text-session-link-sub hover:bg-session-divider/20"
      >
        詳細
      </ExternalTextLink>

      {event.html && (
        <div
          className="text-session-subtle text-2xs"
          dangerouslySetInnerHTML={{ __html: event.html }}
        />
      )}

      {/* 会場・ハッシュタグはセル最下部にまとめ、詳細リンクから物理的に離す。
          ハッシュタグは会場表記の下に置き、詳細との距離を最大化して誤タップを防ぐ */}
      <div className="mt-auto flex flex-col gap-1">
        <div className="text-session-meta text-2xs">@ {event.room_no}</div>
        {hashTags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {hashTags.map((tag) => (
              <ExternalTextLink
                key={tag}
                href={hashTagUrl(tag)}
                icon={false}
                className="gap-0.5 rounded-full bg-session-divider/30 px-2 py-0.5 text-2xs text-session-link-sub"
                fallback={<span className="text-2xs text-session-link-sub">#{tag}</span>}
              >
                <Hash className="size-3" />
                {tag}
              </ExternalTextLink>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
