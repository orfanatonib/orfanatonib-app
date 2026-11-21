import type { AdminNavigationSection } from "../types";

import { ADMIN_CONTENT_STUDIO_SECTION } from "./contentStudio";
import { ADMIN_PEOPLE_SECTION } from "./people";
import { ADMIN_SHELTERS_AND_VISITS_SECTION } from "./sheltersAndVisits";
import { ADMIN_CONTENT_SECTION } from "./content";
import { ADMIN_MATERIALS_AND_IDEAS_SECTION } from "./materialsAndIdeas";
import { ADMIN_MEDIA_SECTION } from "./media";
import { ADMIN_COMMUNICATION_SECTION } from "./communication";

/** Ordem de exibição no menu e no painel (a mesma do catálogo original). */
export const ADMIN_NAVIGATION_SECTIONS: readonly AdminNavigationSection[] = [
  ADMIN_CONTENT_STUDIO_SECTION,
  ADMIN_PEOPLE_SECTION,
  ADMIN_SHELTERS_AND_VISITS_SECTION,
  ADMIN_CONTENT_SECTION,
  ADMIN_MATERIALS_AND_IDEAS_SECTION,
  ADMIN_MEDIA_SECTION,
  ADMIN_COMMUNICATION_SECTION,
];
