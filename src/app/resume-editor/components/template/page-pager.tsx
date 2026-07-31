"use client";

import { Button } from "@/components/ui/button";

/**
 * Pages through the preview one sheet at a time.
 *
 * A resume is a handful of pages at most, so every page gets its own button and
 * any page is one click away — there is nothing for prev/next arrows to add.
 * Nothing renders for a single-page resume, where a pager would be pure noise.
 */
const PagePager = ({
  pageCount,
  page,
  onSelect,
}: {
  pageCount: number;
  /** Zero-based, matching the sheet offset it drives. */
  page: number;
  onSelect: (page: number) => void;
}) => {
  if (pageCount < 2) return null;

  return (
    <nav aria-label="Resume pages" className="flex items-center gap-1">
      {Array.from({ length: pageCount }, (_, index) => (
        <Button
          key={index}
          variant={index === page ? "default" : "outline"}
          size="icon"
          type="button"
          aria-label={`Page ${index + 1}`}
          aria-current={index === page ? "page" : undefined}
          onClick={() => onSelect(index)}
          className="tabular-nums"
        >
          {index + 1}
        </Button>
      ))}
    </nav>
  );
};

export default PagePager;
