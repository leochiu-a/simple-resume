"use client";

import { useRef, useState } from "react";
import { Pause, Play, RotateCcw } from "lucide-react";

/**
 * The recording of the agent run.
 *
 * It autoplays muted and loops, because it is evidence rather than content — a
 * visitor should see the score move without deciding to press anything. The
 * controls exist for the opposite case: 38 seconds of someone else's resume
 * filling itself in is exactly the sort of thing a reader wants to stop.
 *
 * `playsInline` matters more than it looks: without it iOS Safari takes any
 * playing video fullscreen, which turns a figure in the middle of an argument
 * into a takeover.
 */
const DemoVideo = ({
  sources,
  poster,
  caption,
}: {
  sources: { src: string; type: string }[];
  poster: string;
  caption: React.ReactNode;
}) => {
  const video = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(true);

  const toggle = () => {
    const el = video.current;
    if (!el) return;
    if (el.paused) {
      void el.play();
    } else {
      el.pause();
    }
  };

  const restart = () => {
    const el = video.current;
    if (!el) return;
    el.currentTime = 0;
    void el.play();
  };

  return (
    <figure className="m-0">
      <div className="border border-[var(--rule)] bg-[var(--paper-raised)] p-2">
        <video
          ref={video}
          poster={poster}
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          className="block w-full"
        >
          {sources.map((source) => (
            <source key={source.src} src={source.src} type={source.type} />
          ))}
        </video>
      </div>

      <div className="mt-4 flex items-start gap-4">
        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={toggle}
            aria-label={playing ? "Pause the recording" : "Play the recording"}
            className="flex size-8 items-center justify-center border border-[var(--rule)] text-[var(--graphite-soft)] transition-colors duration-200 hover:border-[var(--accent)] hover:text-[var(--graphite)]"
          >
            {playing ? (
              <Pause aria-hidden className="size-3.5" />
            ) : (
              <Play aria-hidden className="size-3.5" />
            )}
          </button>
          <button
            type="button"
            onClick={restart}
            aria-label="Restart the recording"
            className="flex size-8 items-center justify-center border border-[var(--rule)] text-[var(--graphite-soft)] transition-colors duration-200 hover:border-[var(--accent)] hover:text-[var(--graphite)]"
          >
            <RotateCcw aria-hidden className="size-3.5" />
          </button>
        </div>

        <figcaption className="text-[0.85rem] leading-[1.6] text-[var(--graphite-soft)]">
          {caption}
        </figcaption>
      </div>
    </figure>
  );
};

export default DemoVideo;
