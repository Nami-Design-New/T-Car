import { cn } from "@/shared/lib/cn";

export interface HtmlContentProps {
  /** HTML already sanitized on the server with `sanitizeBackendHtml`. */
  html: string;
  className?: string;
}

/** Renders sanitized backend-authored HTML with readable list and text spacing. */
export function HtmlContent({ html, className }: HtmlContentProps) {
  return (
    <div
      className={cn(
        "text-start [&_a]:underline [&_li+li]:mt-2 [&_ol]:list-decimal [&_ol]:ps-5 [&_p]:m-0 [&_ul]:list-disc [&_ul]:ps-5 [&>*+*]:mt-2",
        className,
      )}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
