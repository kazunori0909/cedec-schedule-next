import type { ComponentProps, ReactNode } from "react";
import { ExternalLink } from "lucide-react";
import { cn, safeExternalUrl } from "@/lib/utils";

interface Props extends Omit<ComponentProps<"a">, "href" | "target" | "rel"> {
  /** 未検証の URL。内部で safeExternalUrl を通すため呼び出し側での検証は不要 */
  href: string | undefined | null;
  /** 末尾に外部リンクアイコンを表示するか */
  icon?: boolean;
  /** URL が安全でない・空の場合に代わりに描画する内容 */
  fallback?: ReactNode;
}

/**
 * 外部リンクの共通コンポーネント。
 * SECURITY.md の「外部 URL は必ず safeExternalUrl() を経由する」ルールと
 * rel="noopener" の付与をコンポーネント側で強制する。
 * 外部サイトへの <a> はこのコンポーネントを使う。
 */
export function ExternalTextLink({
  href,
  icon = true,
  fallback = null,
  className,
  children,
  ...props
}: Props) {
  const safeUrl = safeExternalUrl(href);
  if (!safeUrl) return <>{fallback}</>;
  return (
    <a
      href={safeUrl}
      target="_blank"
      rel="noopener"
      className={cn("inline-flex items-center gap-1 hover:underline", className)}
      {...props}
    >
      {children}
      {icon && <ExternalLink className="size-3 shrink-0" />}
    </a>
  );
}
