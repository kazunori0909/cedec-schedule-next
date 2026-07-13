import { ExternalTextLink } from "@/components/ui/ExternalTextLink";

interface Props {
  name: string;
  url?: string | null;
}

/** 会場URLがある場合はリンク、ない場合はテキストとしてルーム名を描画する */
export function RoomLink({ name, url }: Props) {
  return (
    <ExternalTextLink
      href={url}
      icon={false}
      fallback={name}
      className="inline text-session-link-sub"
    >
      {name}
    </ExternalTextLink>
  );
}
