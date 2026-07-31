import { FC } from "react";
import { FaRobot } from "react-icons/fa6";

import { Tooltip } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { WebMcpStatus } from "@/lib/webmcp";

interface WebMcpStatusBadgeProps {
  status: WebMcpStatus;
  toolCount: number;
}

const WebMcpStatusBadge: FC<WebMcpStatusBadgeProps> = ({ status, toolCount }) => {
  if (status === "checking") return null;

  const label = status === "ready" ? `Agent ready · ${toolCount} tools` : "Agent unavailable";

  const hint = {
    ready: "Ask your browser agent to fill in this resume",
    unsupported: "Needs Edge 147+ or chrome://flags/#enable-webmcp-testing",
    error: "Registering the WebMCP tools failed",
    checking: "",
  }[status];

  return (
    // Status, not an action — so it earns an icon in the nav rather than a strip
    // of text. The wording it used to spell out moves into the tooltip, which was
    // already here for the hint.
    <Tooltip title={`${label} — ${hint}`}>
      <span
        className={cn(
          "flex size-9 items-center justify-center rounded-sm border",
          status === "ready"
            ? "border-emerald-600/30 text-emerald-700 dark:text-emerald-400"
            : "border-muted-foreground/30 text-muted-foreground",
        )}
      >
        <FaRobot className="size-3.5" />
        {/* Kept in the DOM rather than swapped for an aria-label: a plain span
            with aria-label is announced inconsistently, and the status is the
            whole point of the badge. */}
        <span className="sr-only">{label}</span>
      </span>
    </Tooltip>
  );
};

export default WebMcpStatusBadge;
