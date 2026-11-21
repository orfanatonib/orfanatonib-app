import { lazy, type ComponentType } from "react";

/** `lazy` para módulos com export nomeado (os demais usam `export default`). */
function lazyNamed<K extends string, P>(
  loader: () => Promise<Record<K, ComponentType<P>>>,
  name: K,
) {
  return lazy(() => loader().then((module) => ({ default: module[name] })));
}

// Públicas
export const About = lazy(() => import("@/pages/About/About"));
export const Contact = lazy(() => import("@/pages/Contact/Contact"));
export const EventosPage = lazy(() => import("@/pages/Event/EventosPage"));
export const ShelterFeedView = lazy(
  () => import("@/pages/PageView/ShelterFeedView/ShelterFeedView"),
);
export const Login = lazy(() => import("@/pages/Login/Login"));
export const EmailVerificationInstructions = lazy(
  () => import("@/pages/EmailVerification/EmailVerificationInstructions"),
);
export const ConfirmEmail = lazy(
  () => import("@/pages/EmailVerification/ConfirmEmail"),
);
export const Register = lazy(() => import("@/pages/Register/Register"));
export const ForgotPassword = lazy(
  () => import("@/pages/PasswordReset/ForgotPassword"),
);
export const ResetPassword = lazy(
  () => import("@/pages/PasswordReset/ResetPassword"),
);
export const PageRenderer = lazy(
  () => import("@/components/PageRenderer/PageRenderer"),
);

// Área do membro
export const MemberAreaLayout = lazy(
  () => import("@/pages/MemberArea/components/Layout/MemberAreaLayout"),
);
export const MemberAreaShell = lazy(
  () => import("@/pages/MemberArea/components/Layout/MemberAreaShell"),
);
export const MemberArea = lazy(() => import("@/pages/MemberArea/MemberArea"));
export const MinistryInstructions = lazy(
  () => import("@/pages/MinistryInstructions/MinistryInstructions"),
);
export const ImageSectionPage = lazy(
  () => import("@/pages/MemberArea/ImageSection/ImageSectionPage"),
);
export const IdeasSectionPage = lazy(
  () => import("@/pages/MemberArea/IdeasSection/IdeasSectionPage"),
);
export const VisitMaterialsList = lazy(
  () => import("@/pages/MemberArea/components/Sections/VisitMaterialsList"),
);
export const SiteFeedbackForm = lazy(
  () => import("@/pages/MemberArea/components/Forms/SiteFeedbackForm"),
);
export const MemberDocumentsPage = lazy(
  () => import("@/pages/MemberArea/subpages/MemberDocumentsPage"),
);
export const MemberIdeasPage = lazy(
  () => import("@/pages/MemberArea/subpages/MemberIdeasPage"),
);
export const MemberVideosPage = lazy(
  () => import("@/pages/MemberArea/subpages/MemberVideosPage"),
);
export const MemberContentPage = lazy(
  () => import("@/pages/MemberArea/subpages/MemberContentPage"),
);
export const IntegrationManager = lazy(
  () => import("@/features/integration/IntegrationManager"),
);
export const IntegrationShelteredPage = lazy(
  () => import("@/features/integration/IntegrationShelteredPage"),
);
export const ShelteredBrowserPage = lazy(
  () => import("@/features/pagela-member/ShelteredBrowserPage"),
);
export const ShelteredPagelasPage = lazy(
  () => import("@/features/pagela-member/ShelteredPagelasPage"),
);
export const ProfilePage = lazy(() => import("@/pages/Profile/ProfilePage"));
export const AttendanceIndexRedirect = lazy(
  () => import("@/features/attendance/pages/AttendanceIndexRedirect"),
);

// Painel administrativo
export const AdminLayout = lazy(
  () => import("@/components/Adm/AdminLayout/AdminLayout"),
);
export const AdminDashboardPage = lazy(
  () => import("@/components/Adm/AdminDashboardPage"),
);
export const AttendanceLayout = lazy(
  () => import("@/features/attendance/pages/AttendanceLayout"),
);
export const AttendanceDashboard = lazy(
  () => import("@/features/attendance/pages/AttendanceDashboard"),
);
export const AttendanceTeamPage = lazy(
  () => import("@/features/attendance/pages/AttendanceTeamPage"),
);
export const ListSheets = lazy(
  () => import("@/features/attendance/components/ListSheets"),
);
export const PendingAttendancePage = lazy(
  () => import("@/features/attendance/pages/PendingAttendancePage"),
);
export const MeditationManager = lazy(
  () => import("@/features/meditations/MeditationManager"),
);
export const CommentsManager = lazy(
  () => import("@/features/comments/CommentsManager"),
);
export const DocumentsManager = lazy(
  () => import("@/features/documents/DocumentsManager"),
);
export const InformativeBannerLManager = lazy(
  () => import("@/features/informatives/InformativeBannerLManager"),
);
export const FeedbackManager = lazy(
  () => import("@/features/feedback/FeedbackManager"),
);
export const ContactsManager = lazy(
  () => import("@/features/contacts/ContactsManager"),
);
export const VisitMaterialManager = lazy(
  () => import("@/features/visit-materials/VisitMaterialManager"),
);
export const ImagePageManager = lazy(
  () => import("@/features/image-pages/ImagePageManager"),
);
export const ImageSectionManager = lazy(
  () => import("@/features/image-sections/ImageSectionManager"),
);
export const ImageSectionEditorAdmin = lazy(
  () => import("@/features/image-sections/ImageSectionEditorAdmin"),
);
export const FeedCommentsManager = lazyNamed(
  () => import("@/features/feed-comments/FeedCommentsManager"),
  "FeedCommentsManager",
);
export const IdeasSectionManager = lazy(
  () => import("@/features/ideas-sections/IdeasSectionManager"),
);
export const VideosManager = lazy(
  () => import("@/features/video-pages/VideosManager"),
);
export const IdeasManager = lazy(
  () => import("@/features/ideas-pages/IdeasManager"),
);
export const SelectPageTemplate = lazy(
  () => import("@/components/Adm/PageCreator/SelectPageTemplate/SelectPageTemplate"),
);
export const MeditationPageCreator = lazy(
  () =>
    import(
      "@/components/Adm/PageCreator/Templates/MeditationPageCreator/MeditationPageCreator"
    ),
);
export const ImagePageCreator = lazy(
  () =>
    import(
      "@/components/Adm/PageCreator/Templates/ImagePageCreator/ImagePageCreator"
    ),
);
export const VideoPageCreator = lazy(
  () =>
    import(
      "@/components/Adm/PageCreator/Templates/VideoPageCreator/VideoPageCreator"
    ),
);
export const VisitMaterialPageCreator = lazy(
  () =>
    import(
      "@/components/Adm/PageCreator/Templates/VisitMaterialPageCreator/VisitMaterialPageCreator"
    ),
);
export const IdeasMaterialPageCreator = lazyNamed(
  () =>
    import(
      "@/components/Adm/PageCreator/Templates/IdeasMaterialPageCreator/IdeasMaterialPageCreator"
    ),
  "IdeasMaterialPageCreator",
);
export const ContentStudioShell = lazyNamed(
  () => import("@/features/content-studio/shell/ContentStudioShell"),
  "ContentStudioShell",
);
export const ContentStudioHomePage = lazyNamed(
  () => import("@/features/content-studio/pages/ContentStudioHomePage"),
  "ContentStudioHomePage",
);
export const ContentStudioProductionPage = lazyNamed(
  () => import("@/features/content-studio/pages/ContentStudioProductionPage"),
  "ContentStudioProductionPage",
);
export const ContentPackageDetailPage = lazyNamed(
  () => import("@/features/content-studio/pages/ContentPackageDetailPage"),
  "ContentPackageDetailPage",
);
export const ContentStudioGuidelinesPage = lazyNamed(
  () => import("@/features/content-studio/pages/ContentStudioGuidelinesPage"),
  "ContentStudioGuidelinesPage",
);
export const ContentStudioReviewPage = lazyNamed(
  () => import("@/features/content-studio/pages/ContentStudioReviewPage"),
  "ContentStudioReviewPage",
);
export const ContentReviewPackagePage = lazyNamed(
  () => import("@/features/content-studio/pages/ContentReviewPackagePage"),
  "ContentReviewPackagePage",
);
export const AiProvidersConfigPage = lazyNamed(
  () => import("@/features/ai-providers/AiProvidersConfigPage"),
  "AiProvidersConfigPage",
);
export const UsersManager = lazy(
  () => import("@/features/users/UsersManager"),
);
export const ProfilesManager = lazy(
  () => import("@/features/profile/ProfilesManager"),
);
export const LeaderProfilesManager = lazy(
  () => import("@/features/leaders/LeaderProfilesManager"),
);
export const MemberProfilesManager = lazy(
  () => import("@/features/members/MemberProfilesManager"),
);
export const ShelteredManager = lazy(
  () => import("@/features/sheltered/ShelteredManager"),
);
export const SheltersManager = lazy(
  () => import("@/features/shelters/SheltersManager"),
);
export const ShelterFormPage = lazy(
  () => import("@/features/shelters/ShelterFormPage"),
);
export const PagelaSheltersManager = lazy(
  () => import("@/features/pagela-shelters/PagelaSheltersManager"),
);
export const ShelterScheduleManager = lazy(
  () => import("@/features/shelter-schedule/ShelterScheduleManager"),
);
export const AtendentesManager = lazy(
  () => import("@/features/atendentes/AtendentesManager"),
);
export const ObservabilityAuditPage = lazy(
  () => import("@/features/observability-audit/ObservabilityAuditPage"),
);
export const FeatureFlagsPage = lazy(
  () => import("@/features/feature-flags/components/FeatureFlagsPage"),
);
export const VisitReportsManager = lazy(
  () => import("@/features/visit-reports/VisitReportsManager"),
);
export const PendingVisitReportsPage = lazy(
  () => import("@/features/visit-reports/pages/PendingVisitReportsPage"),
);
