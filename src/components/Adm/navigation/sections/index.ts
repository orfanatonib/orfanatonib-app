import type { AdminNavigationSection } from "../types";

import { ADMIN_CONTENT_STUDIO_SECTION } from "./contentStudio";
import { ADMIN_PEOPLE_SECTION } from "./people";
import { ADMIN_SHELTERS_AND_VISITS_SECTION } from "./sheltersAndVisits";
import { ADMIN_CONTENT_SECTION } from "./content";
import { ADMIN_PAGES_AND_MEDIA_SECTION } from "./pagesAndMedia";
import { ADMIN_INTERACTION_SECTION } from "./interaction";
import { ADMIN_MESSAGES_SECTION } from "./messages";

/** Ordem de exibição no menu e no painel. */
export const ADMIN_NAVIGATION_SECTIONS: readonly AdminNavigationSection[] = [
  ADMIN_PEOPLE_SECTION,
  ADMIN_SHELTERS_AND_VISITS_SECTION,
  ADMIN_CONTENT_STUDIO_SECTION,
  ADMIN_CONTENT_SECTION,
  ADMIN_PAGES_AND_MEDIA_SECTION,
  ADMIN_INTERACTION_SECTION,
  ADMIN_MESSAGES_SECTION,
];
