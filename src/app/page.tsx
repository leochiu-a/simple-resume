import AccentProvider from "@/components/landing/accent";
import SiteNav from "@/components/landing/site-nav";
import Hero from "@/components/landing/hero";
import Outputs from "@/components/landing/outputs";
import Agent from "@/components/landing/agent";
import Privacy from "@/components/landing/privacy";
import SiteFooter from "@/components/landing/site-footer";

/**
 * The landing page argues the product in the order the visitor cares about it:
 * where the resume lives, what comes out of it, that an agent can write it, and
 * what exactly is and is not sent anywhere.
 *
 * `AccentProvider` holds the template and colour the hero's sheet is showing and
 * publishes the colour as `--ink`, which is why the sections under it can tint
 * themselves while staying server components.
 */
export default function Home() {
  return (
    <AccentProvider>
      <SiteNav />
      <main>
        <Hero />
        <Outputs />
        <Agent />
        <Privacy />
      </main>
      <SiteFooter />
    </AccentProvider>
  );
}
