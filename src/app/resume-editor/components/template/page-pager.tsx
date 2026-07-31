"use client";

import {
  Pagination,
  PaginationButton,
  PaginationContent,
  PaginationItem,
} from "@/components/ui/pagination";

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
    <Pagination aria-label="Resume pages">
      <PaginationContent>
        {Array.from({ length: pageCount }, (_, index) => (
          <PaginationItem key={index}>
            <PaginationButton
              isActive={index === page}
              aria-label={`Page ${index + 1}`}
              onClick={() => onSelect(index)}
            >
              {index + 1}
            </PaginationButton>
          </PaginationItem>
        ))}
      </PaginationContent>
    </Pagination>
  );
};

export default PagePager;
