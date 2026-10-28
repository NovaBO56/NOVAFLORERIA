import { cn } from "cn";
import { Notice, type NoticeProps } from "@/components/ui/notice";

/** Existing shop API backed by the same accessible feedback used in admin. */
export function ShoppingNotice(props: NoticeProps) {
  return <Notice {...props} className={cn("rounded-2xl", props.className)} />;
}
