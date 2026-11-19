import { FeatureFlagTargetRole } from './types';

const ADMIN = FeatureFlagTargetRole.ADMIN;
const LEADER = FeatureFlagTargetRole.LEADER;
const MEMBER = FeatureFlagTargetRole.MEMBER;

/**
 * Público esperado de cada flag de interface (espelha o catálogo da API).
 * Lista vazia = qualquer visitante. A flag nunca amplia o acesso: o guard de
 * perfil da rota continua soberano — o painel usa isto só para AVISAR quando
 * o público escolhido esconde o recurso de quem tem acesso a ele.
 */
export const FEATURE_PROFILE_RULES: Readonly<
  Record<string, readonly FeatureFlagTargetRole[]>
> = {
  public_registration: [],
  google_login: [],
  password_recovery: [],
  contact_form: [],
  events_section: [],
  shelter_feed: [],
  home_comments: [],
  public_galleries: [],
  public_videos: [],
  shelter_pages: [],
  about_page: [],
  shelter_address: [],
  member_area: [ADMIN, LEADER, MEMBER],
  visit_materials: [ADMIN, LEADER, MEMBER],
  documents_library: [ADMIN, LEADER, MEMBER],
  training_videos: [ADMIN, LEADER, MEMBER],
  ideas_sharing: [ADMIN, LEADER, MEMBER],
  idea_submission: [ADMIN, LEADER, MEMBER],
  shelter_photo_upload: [ADMIN, LEADER, MEMBER],
  site_feedback: [ADMIN, LEADER, MEMBER],
  member_manual: [ADMIN, LEADER, MEMBER],
  weekly_meditation: [ADMIN, LEADER, MEMBER],
  informative_banners: [ADMIN, LEADER, MEMBER],
  comment_submission: [ADMIN, LEADER, MEMBER],
  sheltered_area: [ADMIN, LEADER, MEMBER],
  accepted_christs: [ADMIN, LEADER, MEMBER],
  attendance: [ADMIN, LEADER, MEMBER],
  integration: [ADMIN, LEADER],
  comment_moderation: [ADMIN],
  document_management: [ADMIN],
  informative_management: [ADMIN],
  feedback_management: [ADMIN],
  contact_management: [ADMIN],
  page_management: [ADMIN],
  meditation_management: [ADMIN],
  event_management: [ADMIN],
  photo_moderation: [ADMIN],
  idea_moderation: [ADMIN],
  user_management: [ADMIN],
  leader_management: [ADMIN, LEADER],
  member_management: [ADMIN, LEADER],
  shelter_management: [ADMIN, LEADER],
  sheltered_management: [ADMIN, LEADER],
  pagelas: [ADMIN, LEADER],
  shelter_schedule: [ADMIN, LEADER],
  criminal_records: [ADMIN, LEADER],
  visit_reports: [ADMIN, LEADER],
  content_studio: [ADMIN],
  content_studio_generation: [ADMIN],
  content_studio_review: [ADMIN],
  content_studio_publication: [ADMIN],
  content_studio_provider_admin: [ADMIN],
  observability_audit: [ADMIN],
};
