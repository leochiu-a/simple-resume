"use client";

import { PointerEvent, ReactNode, useCallback, useEffect, useRef, useState } from "react";
import { useFormContext, useWatch } from "react-hook-form";

import { applySubsetOrder, normaliseSectionOrder } from "@/lib/resume-sections";
import { Resume, SECTION_IDS, SectionId } from "@/types/resume";

import type { TemplateDefinition } from "../template/registry";
import Information from "./information";
import SocialLinks from "./social-links";
import Skills from "./skills";
import Educations from "./educations";
import EmploymentHistory from "./employment-history";
import Profile from "./profile";
import Projects from "./projects";
import SectionOrderPopover, { type Grab } from "./section-order-popover";
import { SectionSlotProvider } from "./section";

const SECTION_COMPONENTS: Record<SectionId, ReactNode> = {
  profile: <Profile />,
  socialLinks: <SocialLinks />,
  skills: <Skills />,
  employmentHistory: <EmploymentHistory />,
  projects: <Projects />,
  educations: <Educations />,
};

/** "01", "02" — the form has always numbered its sections and now has to count. */
const pad = (position: number) => String(position).padStart(2, "0");

/**
 * The form, in the order the resume is laid out.
 *
 * The order is edited here rather than in a list tucked inside the appearance panel:
 * a control for arranging the document is worth finding, and a panel opened over the
 * preview is not where anyone looks for it. Every builder that has this feature puts
 * the handle on the section itself — Rezi on the heading, Resumonk on the section
 * tab.
 *
 * Pressing a handle floats the running order over that spot as a compact list and
 * hands the same press straight to it, so one gesture can grab a section, see where
 * everything else is, and drop it. The list then stays — pressing without moving is
 * how you open it to rearrange several — and closing it is what applies the result.
 *
 * Nothing behind it moves until then; see `draft` below for why that took three
 * attempts to get right. The form never reflows under the popover either way, which
 * is a separate and equally load-bearing thing — `section-order-popover.tsx` has it.
 */
const ResumeForm = ({ template }: { template: TemplateDefinition }) => {
  const { control, setValue } = useFormContext<Resume>();
  const resume = useWatch({ control }) as Resume;
  const order = normaliseSectionOrder(resume.sectionOrder);

  const [grab, setGrab] = useState<Grab | null>(null);

  /**
   * What the popover is showing, and the only thing that moves while it is open.
   *
   * The resume is not touched until the popover closes. Nothing behind it changes —
   * not the form, not the sheet — and that stillness is the point rather than a
   * side effect.
   *
   * Two earlier versions wrote through as you went. Writing on every swap made the
   * document thrash three or four times on the way to one destination. Writing on
   * every drop was calmer but still wrong, and in a way that took a while to name:
   * this popover is positioned against the heading it was opened from, so the moment
   * that section moves, the anchor points at nothing. Suppressing the form's half of
   * the movement only traded that for a worse problem — the form and the sheet
   * showing two different orders at once, in an editor whose whole premise is that
   * they agree.
   *
   * So: the list in front is the working copy, the document behind is untouched, and
   * dismissal is what reconciles them. The order being arranged is legible in the
   * popover the entire time, which for this particular edit is the whole of the
   * feedback anyone needs.
   *
   * Kept in a ref as well as in state: state is what the popover renders from, and
   * the ref is what the listeners below read, since they are registered once and
   * would otherwise close over the draft as it stood when the press began.
   */
  const [draft, setDraft] = useState<SectionId[] | null>(null);
  const draftRef = useRef<SectionId[] | null>(null);

  /**
   * False only for as long as the press that opened the popover is still down.
   *
   * The list stays open afterwards whatever that press did — dragged a section into
   * place or merely opened the list and let go. An earlier version closed it on a
   * completed drag and kept it for a click, which sounds tidy and is not: the line
   * between the two is whether the pointer happened to move, and a hand that twitches
   * three pixels crosses it. Nobody can see that line, so nobody can aim for it.
   *
   * What the flag still decides is internal. While the opening press is down the
   * gesture belongs to the grabbed row and is handed to it; once it is up, every row
   * listens for its own, and several sections can be rearranged in one sitting.
   */
  const [latched, setLatched] = useState(false);

  /* What the popover offers: the sections this template actually lays out in a flow.
     On a two-column template that is four of the six, and the other two are not
     merely tagged but absent — a row you can drag in a list that cannot move it is a
     control that lies. Their heading says where they went instead. */
  const sortable = order.filter((id) => template.orderedSections.includes(id));

  /**
   * Applies whatever the popover ended up showing, and puts it away.
   *
   * One write for the whole session, however many sections were moved inside it.
   *
   * A `useCallback` because the release listener below closes over it and is
   * registered for the length of a gesture — recreating it every render would tear
   * the listener down and put it back on each swap.
   */
  const close = useCallback(() => {
    if (draftRef.current) {
      /* Merged back rather than stored as-is: the popover only held the sortable
         subset, and the sidebar's sections keep the slots they already had. */
      setValue("sectionOrder", applySubsetOrder(order, draftRef.current), { shouldDirty: true });
    }

    draftRef.current = null;
    setDraft(null);
    setLatched(false);
    setGrab(null);
  }, [order, setValue]);

  /* Listened for on the window, because the release that ends the opening press
     lands wherever the pointer happens to be — routinely outside both the popover
     and the handle. `pointercancel` counts too, or a gesture the browser takes back
     for its own scrolling leaves the scrim up with nothing to dismiss it. */
  useEffect(() => {
    // Once it is latched the release has already happened and means nothing more.
    if (!grab || latched) return;

    // Whatever the press did, the list stays. Esc or a click outside applies it and
    // closes.
    const release = () => setLatched(true);

    window.addEventListener("pointerup", release);
    window.addEventListener("pointercancel", release);

    return () => {
      window.removeEventListener("pointerup", release);
      window.removeEventListener("pointercancel", release);
    };
  }, [grab, latched]);

  const startGrab = (id: SectionId) => (event: PointerEvent<HTMLElement>) => {
    // Or the browser starts a text selection across everything the drag passes over.
    event.preventDefault();
    setLatched(false);
    setGrab({ id, rect: event.currentTarget.getBoundingClientRect() });
  };

  return (
    <div>
      <SectionSlotProvider slot={{ index: "01" }}>
        <Information />
      </SectionSlotProvider>

      {order.map((id, index) => (
        <SectionSlotProvider
          key={id}
          slot={{
            // Information is 01 and does not move, so the list starts at 02.
            index: pad(index + 2),
            /* No grip on a section this template draws in its sidebar, because the
               popover does not carry it either. A handle is a promise that the
               section can be moved, and here it cannot be. */
            onGrab: template.orderedSections.includes(id) ? startGrab(id) : undefined,
            pinnedNote: template.orderedSections.includes(id)
              ? undefined
              : `${template.label} lays this out in its sidebar, so the running order does not place it.`,
          }}
        >
          {SECTION_COMPONENTS[id]}
        </SectionSlotProvider>
      ))}

      {grab && (
        <SectionOrderPopover
          grab={grab}
          /* The draft while one exists — the form below keeps rendering the
             committed order, so nothing behind the scrim moves until the drop. */
          order={draft ?? sortable}
          hiddenSections={SECTION_IDS.filter((id) => !resume.visibility[id])}
          latched={latched}
          onReorder={(next) => {
            draftRef.current = next;
            setDraft(next);
          }}
          onDismiss={close}
        />
      )}
    </div>
  );
};

export default ResumeForm;
