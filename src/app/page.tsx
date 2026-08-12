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
