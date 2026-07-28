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
    <Tooltip title={hint}>
      <span
        className={cn(
          "flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs",
          status === "ready"
            ? "border-emerald-600/30 text-emerald-700 dark:text-emerald-400"
            : "border-muted-foreground/30 text-muted-foreground",
        )}
      >
        <FaRobot className="size-3" />
        {label}
      </span>
    </Tooltip>
  );
};

export default WebMcpStatusBadge;
