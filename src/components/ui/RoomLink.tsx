interface Props {
  name: string;
  url?: string;
}

/** 会場URLがある場合はリンク、ない場合はテキストとしてルーム名を描画する */
export function RoomLink({ name, url }: Props) {
  if (!url) return <>{name}</>;
  return (
    <a href={url} target="_blank" rel="noopener" className="text-session-link-sub hover:underline">
      {name}
    </a>
  );
}
