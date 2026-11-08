import { cn } from "@/shared/lib/cn";

interface Props {
  /** HTML already sanitized on the server (see `toSafeHtml` in `api.ts`). */
  html: string;
  className?: string;
}

/** Renders backend-authored HTML as is, with readable list and text spacing. */
export default function HtmlContent({ html, className }: Props) {
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
