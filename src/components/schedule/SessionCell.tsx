"use client";

import { useState } from "react";
import { ExternalLink, Star } from "lucide-react";
import type { UnifiedSession, ExtraEvent } from "@/types/schedule";
import { CategoryBadge } from "@/components/CategoryBadge";
import { RoomLink } from "@/components/ui/RoomLink";
import { resolveDetailUrl, getYoutubeURL, getFloorURL } from "@/lib/cedec";
import { cn, safeExternalUrl } from "@/lib/utils";

interface Props {
  session: UnifiedSession;
  year: string;
  domain: string;
  isFavorite: boolean;
  onToggleFavorite: () => void;
  cedilUrl?: string;
  hideSpecs: Record<string, boolean>;
  roomName: string;
}

export function SessionCell({
  session,
  year,
  domain,
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
  const detailUrl = safeExternalUrl(resolveDetailUrl(s.detail_url, domain));
  const youtubeUrl = safeExternalUrl(getYoutubeURL(s));
  const safeCedilUrl = safeExternalUrl(cedilUrl);
  const isCanceled = s.title.includes("【講演キャンセル】");
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
              isFavorite
                ? "fill-yellow-500 text-yellow-500"
                : "text-session-dim hover:text-yellow-500"
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
      {event.hash_tag &&
        event.hash_tag.split(",").map((tag) => (
          <div key={tag} className="text-session-link-sub text-[10px]">
            #{tag}
          </div>
        ))}
      {detailUrl && (
        <a
          href={detailUrl}
          target="_blank"
          rel="noopener"
          className="inline-flex items-center gap-1 text-session-link-sub hover:underline text-[10px]"
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
      <div className="text-session-meta text-[10px] mt-auto">@ {event.room_no}</div>
    </div>
  );
}
