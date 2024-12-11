import { PropsWithChildren } from "react";

import { Card } from "@/components/ui/card";
import { Typography } from "@/components/ui/typography";
import { cn } from "@/lib/utils";

export const SectionTitle = ({ children }: PropsWithChildren) => {
  return (
    <Typography variant="h4" className="flex items-center gap-2">
      {children}
    </Typography>
  );
};

export const SectionBody = ({
  children,
  className,
}: PropsWithChildren<{ className?: string }>) => {
  return <div className={cn("mt-4 space-y-4", className)}>{children}</div>;
};

export const SectionCard = ({
  children,
  className,
}: PropsWithChildren<{ className?: string }>) => {
  return <Card className={cn("p-6 mb-8 rounded-lg", className)}>{children}</Card>;
};
