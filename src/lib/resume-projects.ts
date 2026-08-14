import { Project } from "@/types/resume";

/**
 * The project entries worth printing.
 *
 * Adding a project appends a blank entry for the user to fill in, and until they
 * do it is not a project — printing it puts an empty headline under the section
 * title. Every HTML export already dropped these; the PDF did not, so the same
 * resume came out with a stray blank line depending on which button was pressed.
 *
 * A url on its own is not enough to keep an entry: a bare link with nothing
 * naming or describing it tells a reader nothing, and it is what a half-finished
 * entry looks like rather than a deliberate one.
 */
export const filledProjects = (projects: Project[] = []): Project[] =>
  projects.filter(({ name, description }) => name.trim() !== "" || description.trim() !== "");
