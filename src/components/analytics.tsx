"use client";

import { Analytics as VercelAnalytics, type BeforeSendEvent } from "@vercel/analytics/react";

/**
 * Web analytics, with the URL cut back to a path before anything is sent.
 *
 * A share link carries the whole resume in its fragment (see `lib/share-link`),
 * and that is only private because browsers never put a fragment on the wire.
 * The analytics script is not the browser — it is JavaScript running *in* the
 * page, where `location.href` includes the fragment, and it reports the URL it
 * finds. Left alone, opening a shared resume would post that resume to an
 * analytics endpoint: the one path by which this app's promise breaks without
 * anyone doing anything wrong.
 *
 * So the origin and the pathname are all that survive. The query goes too —
 * today it only carries an appearance link's template and tint, which arrive
 * as a real event anyway, and an allowlist would be one more thing to remember
 * to update the next time a parameter is added.
 *
 * A URL this cannot parse is dropped rather than passed along. `beforeSend` runs
 * inside the third-party script's own send path, and what that script does with
 * a thrown exception — swallow it and send the original, or lose the event — is
 * not something this repo pins. Returning `null` cancels the event, which is the
 * right answer either way: a lost pageview costs nothing, and an uncut one costs
 * the promise the whole app is built on.
 *
 * This is a client component because `beforeSend` is a function, and a server
 * component cannot hand a function to a client one.
 */
const sanitize = (event: BeforeSendEvent): BeforeSendEvent | null => {
  try {
    const url = new URL(event.url);

    return { ...event, url: `${url.origin}${url.pathname}` };
  } catch {
    // A URL this cannot read is a URL it cannot prove is safe to send.
    return null;
  }
};

const Analytics = () => <VercelAnalytics beforeSend={sanitize} />;

export default Analytics;
