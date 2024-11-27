import Link from "next/link";

import { Typography } from "@/components/ui/typography";
import ShimmerButton from "@/components/magicui/shimmer-button";
import SparklesText from "@/components/magicui/sparkles-text";
import DotPattern from "@/components/magicui/dot-pattern";

export default function Home() {
  return (
    <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      <main className="flex flex-col gap-4 row-start-2 items-center sm:items-start relative z-10">
        <SparklesText text="Simple Resume" />
        <Typography variant="p" affects="removePMargin">
          A online tool to create a resume
        </Typography>

        <Link href="/resume-editor">
          <ShimmerButton>
            <div className="text-white">
              Create Resume
            </div>
          </ShimmerButton>
        </Link>
      </main>
      <DotPattern className="[mask-image:radial-gradient(400px_circle_at_center,white,transparent)]" />
    </div>
  );
}
