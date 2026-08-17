import AccentProvider from "@/components/landing/accent";
import SiteNav from "@/components/landing/site-nav";
import Hero from "@/components/landing/hero";
import Templates from "@/components/landing/templates";
import Outputs from "@/components/landing/outputs";
import OnDevice from "@/components/landing/on-device";
import Agent from "@/components/landing/agent";
import Privacy from "@/components/landing/privacy";
import Closing from "@/components/landing/closing";
import SiteFooter from "@/components/landing/site-footer";
import JsonLd from "@/components/json-ld";
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "@/constants/site";

/**
 * What the site is, in the vocabulary a search engine and an answer engine both read.
 *
 * `WebApplication` rather than `SoftwareApplication`: there is nothing to install and
 * `url` is the editor itself, which is the thing being described. The price is stated
 * because a `WebApplication` with no `offers` is read as unknown cost rather than free,
 * and free with no account is most of the argument this page makes.
 *
 * The `@id`s are what let the guide pages point back here instead of each restating
 * the product — one node, referenced.
 */
const GRAPH = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      "@id": `${SITE_URL}#website`,
      url: SITE_URL,
      name: SITE_NAME,
      description: SITE_DESCRIPTION,
    },
    {
      "@type": "WebApplication",
      "@id": `${SITE_URL}#app`,
      name: SITE_NAME,
      url: `${SITE_URL}/resume-editor`,
      description: SITE_DESCRIPTION,
      isPartOf: { "@id": `${SITE_URL}#website` },
      applicationCategory: "BusinessApplication",
      operatingSystem: "Any device with a modern web browser",
      browserRequirements: "Requires JavaScript",
      offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
      featureList: [
        "Resume editor that saves to the browser's local storage",
        "Several typeset templates with an adjustable accent colour",
        "Export to PDF or to one self-contained HTML file",
        "Share a resume as a link that carries it in the URL fragment",
        "Rewriting and translation by the browser's own on-device AI model",
        "WebMCP tools that let an agent read, score and edit the resume",
      ],
    },
  ],
};

/**
 * The landing page argues the product in the order the visitor cares about it:
 * where the resume lives, what comes out of it, that a model can help write it
 * without leaving the machine, that an agent can drive the whole editor, and
 * what exactly is and is not sent anywhere.
 *
 * On-device AI comes before the agent section because it ships and the agent is
 * still experimental — the order tracks what a visitor can actually use today.
 *
 * `AccentProvider` holds the template and colour the hero's sheet is showing and
 * publishes the colour as `--ink`, which is why the sections under it can tint
 * themselves while staying server components.
 */
export default function Home() {
  return (
    <AccentProvider>
      <JsonLd data={GRAPH} />
      <SiteNav />
      <main>
        <Hero />
        <Templates />
        <Outputs />
        <OnDevice />
        <Agent />
        <Privacy />
        <Closing />
      </main>
      <SiteFooter />
    </AccentProvider>
  );
}
