import { MarkdownTextPrimitive } from "@assistant-ui/react-markdown";
import { memo } from "react";

export const MarkdownText = memo(() => {
  return <MarkdownTextPrimitive />;
});
MarkdownText.displayName = "MarkdownText";
