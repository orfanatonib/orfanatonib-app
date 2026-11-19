import {
  AttendanceDashboard,
  PendingAttendancePage,
} from "./features/attendance/pages";
import PendingVisitReportsPage from "./features/visit-reports/pages/PendingVisitReportsPage";
import { Suspense, lazy, useEffect, useState } from "react";
import { BrowserRouter, Navigate, Routes, Route } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  Box,
  Toolbar,
} from "@mui/material";

import "./App.css";
import "./styles/Global.css";

import Navbar from "./components/NavBar/Navbar";
import Footer from "./components/Footer/Footer";
import ProtectedRoute from "./components/ProtectedRoute/ProtectedRoute";
import RequireAdmin from "./components/RequireAdmin/RequireAdmin";
import AppBootScreen from "./components/AppBoot/AppBootScreen";
import NotFoundPage from "./pages/NotFound/NotFoundPage";
import PageRenderer from "./components/PageRenderer/PageRenderer";
import GlobalErrorBoundary from "./components/common/GlobalErrorBoundary";
import GlobalNotification from "./components/GlobalNotification/GlobalNotification";

import Home from "./pages/Home/Home";
import About from "./pages/About/About";
import Contact from "./pages/Contact/Contact";
import Login from "./pages/Login/Login";
import MemberArea from "./pages/MemberArea/MemberArea";
import {
  MemberAreaLayout,
  MemberAreaShell,
} from "./pages/MemberArea/components/Layout";
import {
  buildMemberContentPath,
  isMemberAreaEntityType,
} from "./pages/MemberArea/utils/navigation";
import {
  MEMBER_LEGACY_PATH_REDIRECTS,
  MEMBER_SUBPAGE_PATHS,
} from "./pages/MemberArea/constants/navigation";
import MemberDocumentsPage from "./pages/MemberArea/subpages/MemberDocumentsPage";
import MemberIdeasPage from "./pages/MemberArea/subpages/MemberIdeasPage";
import MemberVideosPage from "./pages/MemberArea/subpages/MemberVideosPage";
import MemberContentPage from "./pages/MemberArea/subpages/MemberContentPage";
import EmailVerificationInstructions from "./pages/EmailVerification/EmailVerificationInstructions";
import ConfirmEmail from "@/pages/EmailVerification/ConfirmEmail";
import ShelterFeedView from "./pages/PageView/ShelterFeedView/ShelterFeedView";
import ForgotPassword from "./pages/PasswordReset/ForgotPassword";
import ResetPassword from "./pages/PasswordReset/ResetPassword";
import MinistryInstructions from "./pages/MinistryInstructions/MinistryInstructions";

import MeditationPageCreator from "./components/Adm/PageCreator/Templates/MeditationPageCreator/MeditationPageCreator";
import ImagePageCreator from "./components/Adm/PageCreator/Templates/ImagePageCreator/ImagePageCreator";
import VideoPageCreator from "./components/Adm/PageCreator/Templates/VideoPageCreator/VideoPageCreator";
import VisitMaterialPageCreator from "./components/Adm/PageCreator/Templates/VisitMaterialPageCreator/VisitMaterialPageCreator";
import SelectPageTemplate from "./components/Adm/PageCreator/SelectPageTemplate";

import AdminDashboardPage from "./components/Adm/AdminDashboardPage";
import AdminLayout from "./components/Adm/AdminLayout/AdminLayout";

import { fetchRoutes } from "./store/slices/route/routeSlice";
import { UserRole, initAuth, logout } from "./store/slices/auth/authSlice";
import { fetchFeatureFlags } from "./store/slices/feature-flags/featureFlagsSlice";
import {
  FeatureFlagKeys,
  FeatureFlagRoute,
  useVisibleRoutes,
  FeatureFlagsPage,
} from "./features/feature-flags";
import { ObservabilityAuditPage } from "./features/observability-audit";
import {
  ContentPackageDetailPage,
  ContentStudioHomePage,
  ContentStudioShell,
  ContentStudioProductionPage,
  ContentStudioGuidelinesPage,
  ContentStudioReviewPage,
} from "./features/content-studio";

import type { RouteData as DynamicRouteType } from "./store/slices/route/routeSlice";
import { MediaTargetType } from "./store/slices/types";
import type {
  RootState as RootStateType,
  AppDispatch as AppDispatchType,
} from "./store/slices";

import { IdeasMaterialPageCreator } from "components/Adm/PageCreator/Templates/IdeasMaterialPageCreator/IdeasMaterialPageCreator";
import { VisitMaterialsList } from "./pages/MemberArea/components";
import ImageSectionPage from "./pages/MemberArea/ImageSection/ImageSectionPage";
import ImageSectionEditorAdmin from "./features/image-sections/ImageSectionEditorAdmin";
import { SiteFeedbackForm } from "./pages/MemberArea/components";

import LeaderProfilesManager from "./features/leaders/LeaderProfilesManager";
import MemberProfilesManager from "./features/members/MemberProfilesManager";
import SheltersManager from "./features/shelters/SheltersManager";
import ShelterFormPage from "./features/shelters/ShelterFormPage";
import ContactsManager from "./features/contacts/ContactsManager";
import MeditationManager from "./features/meditations/MeditationManager";
import ShelteredManager from "./features/sheltered/ShelteredManager";
import ShelteredBrowserPage from "./features/pagela-member/ShelteredBrowserPage";
import ShelteredPagelasPage from "./features/pagela-member/ShelteredPagelasPage";
import Register from "./pages/Register/Register";
import PagelaSheltersManager from "./features/pagela-shelters/PagelaSheltersManager";
import CommentsManager from "./features/comments/CommentsManager";
import FeedbackManager from "./features/feedback/FeedbackManager";
import UsersManager from "./features/users/UsersManager";
import InformativeBannerLManager from "./features/informatives/InformativeBannerLManager";
import ImageSectionManager from "./features/image-sections/ImageSectionManager";
import ImagePageManager from "./features/image-pages/ImagePageManager";
import IdeasSectionManager from "./features/ideas-sections/IdeasSectionManager";
import IdeasSectionPage from "./pages/MemberArea/IdeasSection/IdeasSectionPage";
import DocumentsManager from "./features/documents/DocumentsManager";
import IdeasManager from "./features/ideas-pages/IdeasManager";
import VideosManager from "./features/video-pages/VideosManager";
import VisitMaterialManager from "./features/visit-materials/VisitMaterialManager";
import { ProfilePage } from "./features/profile";
import EventosPage from "./pages/Event/EventosPage";
import ShelterScheduleManager from "./features/shelter-schedule/ShelterScheduleManager";
import ProfilesManager from "./features/profile/ProfilesManager";
import IntegrationManager from "./features/integration/IntegrationManager";
import IntegrationShelteredPage from "./features/integration/IntegrationShelteredPage";
import VisitReportsManager from "./features/visit-reports/VisitReportsManager";
import AtendentesManager from "./features/atendentes/AtendentesManager";

/** Prazo para a verificação da sessão antes de mostrar a falha com nova tentativa. */
const AiProvidersConfigPage = lazy(() =>
  import("./features/ai-providers/AiProvidersConfigPage").then((module) => ({
    default: module.AiProvidersConfigPage,
  })),
);

const BOOT_TIMEOUT_MS = 15_000;

function App() {
  const dispatch = useDispatch<AppDispatchType>();
  // Página de tipo desligado (flag) não vira rota: cai no 404.
  const dynamicRoutes = useVisibleRoutes();
  const { initialized, loadingUser, isAuthenticated, user } = useSelector(
    (state: RootStateType) => state.auth,
  );
  const [bootTimedOut, setBootTimedOut] = useState(false);
  const [bootAttempt, setBootAttempt] = useState(0);

  useEffect(() => {
    dispatch(fetchRoutes());
    dispatch(initAuth());

    // Passado o prazo sem sessão resolvida, mostra a falha (com "Tentar novamente").
    const timeout = setTimeout(() => setBootTimedOut(true), BOOT_TIMEOUT_MS);
    return () => clearTimeout(timeout);
  }, [dispatch, bootAttempt]);

  useEffect(() => {
    if (initialized) {
      void dispatch(fetchFeatureFlags());
    }
  }, [dispatch, initialized, isAuthenticated, user?.id, user?.role]);

  const handleLogout = () => {
    dispatch(logout());
  };

  const handleBootRetry = () => {
    setBootTimedOut(false);
    setBootAttempt((attempt) => attempt + 1);
  };

  if (!initialized || loadingUser) {
    return (
      <AppBootScreen
        timedOut={bootTimedOut}
        onRetry={handleBootRetry}
        onLogout={handleLogout}
      />
    );
  }

  return (
    <BrowserRouter>
      <Box
        data-testid="app-root"
        sx={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          background: "linear-gradient(135deg, #E8F5E9 0%, #FFFFFF 100%)",
          backgroundAttachment: "fixed",
        }}
      >
        <Navbar />

        <Box
          component="main"
          sx={{ flex: 1, display: "flex", flexDirection: "column" }}
        >
          <Toolbar />
          <Box
            className="mainContainer"
            sx={{ flex: 1, display: "flex", flexDirection: "column" }}
          >
            <GlobalErrorBoundary>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route
                  path="/sobre"
                  element={
                    <FeatureFlagRoute featureKey={FeatureFlagKeys.ABOUT_PAGE}>
                      <About />
                    </FeatureFlagRoute>
                  }
                />
                <Route
                  path="/contato"
                  element={
                    <FeatureFlagRoute featureKey={FeatureFlagKeys.CONTACT_FORM}>
                      <Contact />
                    </FeatureFlagRoute>
                  }
                />
                <Route
                  path="/eventos"
                  element={
                    <FeatureFlagRoute
                      featureKey={FeatureFlagKeys.EVENTS_SECTION}
                    >
                      <EventosPage />
                    </FeatureFlagRoute>
                  }
                />
                <Route
                  path="/feed-abrigos"
                  element={
                    <FeatureFlagRoute featureKey={FeatureFlagKeys.SHELTER_FEED}>
                      <ShelterFeedView feed />
                    </FeatureFlagRoute>
                  }
                />
                <Route path="/login" element={<Login />} />
                <Route
                  path="/verificar-email"
                  element={<EmailVerificationInstructions />}
                />
                <Route
                  path="/verificar-email/:token"
                  element={<ConfirmEmail />}
                />
                <Route
                  path="/cadastrar-google"
                  element={
                    <FeatureFlagRoute featureKey={FeatureFlagKeys.GOOGLE_LOGIN}>
                      <Register commonUser={false} />
                    </FeatureFlagRoute>
                  }
                />
                <Route
                  path="/cadastrar"
                  element={
                    <FeatureFlagRoute
                      featureKey={FeatureFlagKeys.PUBLIC_REGISTRATION}
                    >
                      <Register commonUser />
                    </FeatureFlagRoute>
                  }
                />
                <Route
                  path="/recuperar-senha/:token"
                  element={
                    <FeatureFlagRoute
                      featureKey={FeatureFlagKeys.PASSWORD_RECOVERY}
                    >
                      <ResetPassword />
                    </FeatureFlagRoute>
                  }
                />

                <Route element={<ProtectedRoute />}>
                  <Route
                    element={
                      <FeatureFlagRoute
                        featureKey={FeatureFlagKeys.MEMBER_AREA}
                      >
                        <MemberAreaLayout />
                      </FeatureFlagRoute>
                    }
                  >
                    <Route
                      path="/area-do-membro"
                      element={
                        <FeatureFlagRoute
                          featureKey={FeatureFlagKeys.MEMBER_AREA}
                        >
                          <MemberArea />
                        </FeatureFlagRoute>
                      }
                    />
                    <Route
                      path={MEMBER_SUBPAGE_PATHS.manual}
                      element={
                        <FeatureFlagRoute
                          featureKey={FeatureFlagKeys.MEMBER_MANUAL}
                        >
                          <MinistryInstructions />
                        </FeatureFlagRoute>
                      }
                    />
                    <Route
                      path={MEMBER_SUBPAGE_PATHS.photos}
                      element={
                        <FeatureFlagRoute
                          featureKey={FeatureFlagKeys.SHELTER_PHOTO_UPLOAD}
                        >
                          <ImageSectionPage />
                        </FeatureFlagRoute>
                      }
                    />
                    <Route
                      path={MEMBER_SUBPAGE_PATHS.materials}
                      element={
                        <FeatureFlagRoute
                          featureKey={FeatureFlagKeys.VISIT_MATERIALS}
                        >
                          <VisitMaterialsList />
                        </FeatureFlagRoute>
                      }
                    />
                    <Route
                      path={`${MEMBER_SUBPAGE_PATHS.materials}/:id`}
                      element={
                        <FeatureFlagRoute
                          featureKey={FeatureFlagKeys.VISIT_MATERIALS}
                        >
                          <MemberContentPage
                            entityType={MediaTargetType.VisitMaterialsPage}
                          />
                        </FeatureFlagRoute>
                      }
                    />
                    <Route
                      path={MEMBER_SUBPAGE_PATHS.rate}
                      element={
                        <FeatureFlagRoute
                          featureKey={FeatureFlagKeys.SITE_FEEDBACK}
                        >
                          <SiteFeedbackForm />
                        </FeatureFlagRoute>
                      }
                    />
                    <Route
                      path={MEMBER_SUBPAGE_PATHS.shareIdea}
                      element={
                        <FeatureFlagRoute
                          featureKey={FeatureFlagKeys.IDEA_SUBMISSION}
                        >
                          <IdeasSectionPage />
                        </FeatureFlagRoute>
                      }
                    />
                    <Route
                      path={MEMBER_SUBPAGE_PATHS.documents}
                      element={
                        <FeatureFlagRoute
                          featureKey={FeatureFlagKeys.DOCUMENTS_LIBRARY}
                        >
                          <MemberDocumentsPage />
                        </FeatureFlagRoute>
                      }
                    />
                    <Route
                      path={MEMBER_SUBPAGE_PATHS.ideas}
                      element={
                        <FeatureFlagRoute
                          featureKey={FeatureFlagKeys.IDEAS_SHARING}
                        >
                          <MemberIdeasPage />
                        </FeatureFlagRoute>
                      }
                    />
                    <Route
                      path={`${MEMBER_SUBPAGE_PATHS.ideas}/:id`}
                      element={
                        <FeatureFlagRoute
                          featureKey={FeatureFlagKeys.IDEAS_SHARING}
                        >
                          <MemberContentPage
                            entityType={MediaTargetType.IdeasPage}
                          />
                        </FeatureFlagRoute>
                      }
                    />
                    <Route
                      path={MEMBER_SUBPAGE_PATHS.videos}
                      element={
                        <FeatureFlagRoute
                          featureKey={FeatureFlagKeys.TRAINING_VIDEOS}
                        >
                          <MemberVideosPage />
                        </FeatureFlagRoute>
                      }
                    />
                    <Route
                      path={`${MEMBER_SUBPAGE_PATHS.videos}/:id`}
                      element={
                        <FeatureFlagRoute
                          featureKey={FeatureFlagKeys.TRAINING_VIDEOS}
                        >
                          <MemberContentPage
                            entityType={MediaTargetType.VideosPage}
                          />
                        </FeatureFlagRoute>
                      }
                    />
                    <Route
                      element={
                        <ProtectedRoute
                          requiredRole={[UserRole.ADMIN, UserRole.LEADER]}
                        />
                      }
                    >
                      <Route
                        path={MEMBER_SUBPAGE_PATHS.integrations}
                        element={
                          <FeatureFlagRoute
                            featureKey={FeatureFlagKeys.INTEGRATION}
                          >
                            <IntegrationManager />
                          </FeatureFlagRoute>
                        }
                      />
                    </Route>
                  </Route>
                  <Route
                    path="/area-dos-acolhidos"
                    element={
                      <FeatureFlagRoute
                        featureKey={FeatureFlagKeys.SHELTERED_AREA}
                      >
                        <ShelteredBrowserPage />
                      </FeatureFlagRoute>
                    }
                  />
                  <Route
                    path="/area-dos-acolhidos/:shelteredId"
                    element={
                      <FeatureFlagRoute
                        featureKey={FeatureFlagKeys.SHELTERED_AREA}
                      >
                        <ShelteredPagelasPage />
                      </FeatureFlagRoute>
                    }
                  />
                  <Route path="/perfil" element={<ProfilePage />} />
                  <Route
                    path="/presenca"
                    element={
                      <FeatureFlagRoute featureKey={FeatureFlagKeys.ATTENDANCE}>
                        <AttendanceDashboard />
                      </FeatureFlagRoute>
                    }
                  />
                  {/* A API é admin/líder (403 para membro): a rota também. */}
                  <Route
                    element={
                      <ProtectedRoute
                        requiredRole={[UserRole.ADMIN, UserRole.LEADER]}
                      />
                    }
                  >
                    <Route
                      path="/integracao"
                      element={
                        <FeatureFlagRoute
                          featureKey={FeatureFlagKeys.INTEGRATION}
                        >
                          <IntegrationShelteredPage />
                        </FeatureFlagRoute>
                      }
                    />
                  </Route>
                </Route>

                {/* Endereços antigos da Área do Membro (e Integrações FM, que saiu do /adm) redirecionam. */}
                {Object.entries(MEMBER_LEGACY_PATH_REDIRECTS).map(
                  ([from, to]) => (
                    <Route
                      key={from}
                      path={from}
                      element={<Navigate to={to} replace />}
                    />
                  ),
                )}

                <Route
                  element={
                    <ProtectedRoute
                      requiredRole={[UserRole.ADMIN, UserRole.LEADER]}
                    />
                  }
                >
                  <Route path="/adm" element={<AdminLayout />}>
                    <Route index element={<AdminDashboardPage />} />
                    <Route
                      path="presenca"
                      element={
                        <FeatureFlagRoute
                          featureKey={FeatureFlagKeys.ATTENDANCE}
                        >
                          <AttendanceDashboard />
                        </FeatureFlagRoute>
                      }
                    />
                    <Route
                      path="presenca/pendencias"
                      element={
                        <FeatureFlagRoute
                          featureKey={FeatureFlagKeys.ATTENDANCE}
                        >
                          <PendingAttendancePage />
                        </FeatureFlagRoute>
                      }
                    />
                    <Route
                      path="meditacoes"
                      element={
                        <FeatureFlagRoute
                          featureKey={FeatureFlagKeys.MEDITATION_MANAGEMENT}
                        >
                          <MeditationManager />
                        </FeatureFlagRoute>
                      }
                    />
                    <Route
                      path="comentarios"
                      element={
                        <FeatureFlagRoute
                          featureKey={FeatureFlagKeys.COMMENT_MODERATION}
                        >
                          <CommentsManager />
                        </FeatureFlagRoute>
                      }
                    />
                    <Route
                      path="documentos"
                      element={
                        <FeatureFlagRoute
                          featureKey={FeatureFlagKeys.DOCUMENT_MANAGEMENT}
                        >
                          <DocumentsManager />
                        </FeatureFlagRoute>
                      }
                    />
                    <Route
                      path="informativos"
                      element={
                        <FeatureFlagRoute
                          featureKey={FeatureFlagKeys.INFORMATIVE_MANAGEMENT}
                        >
                          <InformativeBannerLManager />
                        </FeatureFlagRoute>
                      }
                    />
                    <Route
                      path="feedbacks"
                      element={
                        <FeatureFlagRoute
                          featureKey={FeatureFlagKeys.FEEDBACK_MANAGEMENT}
                        >
                          <FeedbackManager />
                        </FeatureFlagRoute>
                      }
                    />
                    <Route
                      path="contatos"
                      element={
                        <FeatureFlagRoute
                          featureKey={FeatureFlagKeys.CONTACT_MANAGEMENT}
                        >
                          <ContactsManager />
                        </FeatureFlagRoute>
                      }
                    />
                    <Route
                      path="paginas-materiais-visita"
                      element={
                        <FeatureFlagRoute
                          featureKey={FeatureFlagKeys.PAGE_MANAGEMENT}
                        >
                          <VisitMaterialManager />
                        </FeatureFlagRoute>
                      }
                    />
                    <Route
                      path="paginas-fotos"
                      element={
                        <FeatureFlagRoute
                          featureKey={FeatureFlagKeys.PAGE_MANAGEMENT}
                        >
                          <ImagePageManager />
                        </FeatureFlagRoute>
                      }
                    />
                    <Route
                      path="fotos-abrigos"
                      element={
                        <FeatureFlagRoute
                          featureKey={FeatureFlagKeys.PHOTO_MODERATION}
                        >
                          <ImageSectionManager />
                        </FeatureFlagRoute>
                      }
                    />
                    <Route
                      path="ideias-compartilhadas"
                      element={
                        <FeatureFlagRoute
                          featureKey={FeatureFlagKeys.IDEA_MODERATION}
                        >
                          <IdeasSectionManager />
                        </FeatureFlagRoute>
                      }
                    />
                    <Route
                      path="paginas-videos"
                      element={
                        <FeatureFlagRoute
                          featureKey={FeatureFlagKeys.PAGE_MANAGEMENT}
                        >
                          <VideosManager />
                        </FeatureFlagRoute>
                      }
                    />
                    <Route
                      path="paginas-ideias"
                      element={
                        <FeatureFlagRoute
                          featureKey={FeatureFlagKeys.PAGE_MANAGEMENT}
                        >
                          <IdeasManager />
                        </FeatureFlagRoute>
                      }
                    />
                    <Route
                      path="criar-pagina"
                      element={
                        <FeatureFlagRoute
                          featureKey={FeatureFlagKeys.PAGE_MANAGEMENT}
                        >
                          <SelectPageTemplate />
                        </FeatureFlagRoute>
                      }
                    />
                    <Route
                      path="estudio"
                      element={
                        <RequireAdmin>
                          <FeatureFlagRoute
                            featureKey={FeatureFlagKeys.CONTENT_STUDIO}
                          >
                            <ContentStudioShell />
                          </FeatureFlagRoute>
                        </RequireAdmin>
                      }
                    >
                      <Route index element={<ContentStudioHomePage />} />
                      <Route
                        path="producao"
                        element={<ContentStudioProductionPage />}
                      />
                      <Route
                        path="pacotes/:id"
                        element={<ContentPackageDetailPage />}
                      />
                      <Route
                        path="orientacoes"
                        element={<ContentStudioGuidelinesPage />}
                      />
                      <Route
                        path="revisao"
                        element={
                          <FeatureFlagRoute
                            featureKey={FeatureFlagKeys.CONTENT_STUDIO_REVIEW}
                          >
                            <ContentStudioReviewPage />
                          </FeatureFlagRoute>
                        }
                      />
                    </Route>
                    <Route
                      path="config-provedores-ia"
                      element={
                        <RequireAdmin>
                          <FeatureFlagRoute
                            featureKey={FeatureFlagKeys.CONTENT_STUDIO}
                          >
                            <FeatureFlagRoute
                              featureKey={
                                FeatureFlagKeys.CONTENT_STUDIO_PROVIDER_ADMIN
                              }
                            >
                              <Suspense fallback={null}>
                                <AiProvidersConfigPage />
                              </Suspense>
                            </FeatureFlagRoute>
                          </FeatureFlagRoute>
                        </RequireAdmin>
                      }
                    />
                    <Route
                      path="provedores-ia"
                      element={<Navigate to="/adm/config-provedores-ia" replace />}
                    />
                    <Route
                      path="estudio/provedores-ia"
                      element={<Navigate to="/adm/config-provedores-ia" replace />}
                    />
                    <Route
                      path="estudio/config"
                      element={<Navigate to="/adm/config-provedores-ia" replace />}
                    />
                    <Route
                      path="usuarios"
                      element={
                        <FeatureFlagRoute
                          featureKey={FeatureFlagKeys.USER_MANAGEMENT}
                        >
                          <UsersManager />
                        </FeatureFlagRoute>
                      }
                    />
                    <Route
                      path="perfis"
                      element={
                        <FeatureFlagRoute
                          featureKey={FeatureFlagKeys.USER_MANAGEMENT}
                        >
                          <ProfilesManager />
                        </FeatureFlagRoute>
                      }
                    />
                    <Route
                      path="lideres"
                      element={
                        <FeatureFlagRoute
                          featureKey={FeatureFlagKeys.LEADER_MANAGEMENT}
                        >
                          <LeaderProfilesManager />
                        </FeatureFlagRoute>
                      }
                    />
                    <Route
                      path="membros"
                      element={
                        <FeatureFlagRoute
                          featureKey={FeatureFlagKeys.MEMBER_MANAGEMENT}
                        >
                          <MemberProfilesManager />
                        </FeatureFlagRoute>
                      }
                    />
                    <Route
                      path="acolhidos"
                      element={
                        <FeatureFlagRoute
                          featureKey={FeatureFlagKeys.SHELTERED_MANAGEMENT}
                        >
                          <ShelteredManager />
                        </FeatureFlagRoute>
                      }
                    />
                    <Route
                      path="abrigos"
                      element={
                        <FeatureFlagRoute
                          featureKey={FeatureFlagKeys.SHELTER_MANAGEMENT}
                        >
                          <SheltersManager />
                        </FeatureFlagRoute>
                      }
                    />
                    <Route
                      path="abrigos/novo"
                      element={
                        <FeatureFlagRoute
                          featureKey={FeatureFlagKeys.SHELTER_MANAGEMENT}
                        >
                          <ShelterFormPage />
                        </FeatureFlagRoute>
                      }
                    />
                    <Route
                      path="abrigos/:id/edit"
                      element={
                        <FeatureFlagRoute
                          featureKey={FeatureFlagKeys.SHELTER_MANAGEMENT}
                        >
                          <ShelterFormPage />
                        </FeatureFlagRoute>
                      }
                    />
                    <Route
                      path="pagelas"
                      element={
                        <FeatureFlagRoute featureKey={FeatureFlagKeys.PAGELAS}>
                          <PagelaSheltersManager />
                        </FeatureFlagRoute>
                      }
                    />
                    <Route
                      path="agendamentos"
                      element={
                        <FeatureFlagRoute
                          featureKey={FeatureFlagKeys.SHELTER_SCHEDULE}
                        >
                          <ShelterScheduleManager />
                        </FeatureFlagRoute>
                      }
                    />
                    <Route
                      path="antecedentes"
                      element={
                        <FeatureFlagRoute
                          featureKey={FeatureFlagKeys.CRIMINAL_RECORDS}
                        >
                          <AtendentesManager />
                        </FeatureFlagRoute>
                      }
                    />
                    <Route
                      path="observabilidade-auditoria"
                      element={
                        <RequireAdmin>
                          <FeatureFlagRoute
                            featureKey={FeatureFlagKeys.OBSERVABILITY_AUDIT}
                          >
                            <ObservabilityAuditPage />
                          </FeatureFlagRoute>
                        </RequireAdmin>
                      }
                    />
                    <Route
                      path="feature-flags"
                      element={
                        <RequireAdmin>
                          <FeatureFlagsPage />
                        </RequireAdmin>
                      }
                    />

                    <Route
                      path="editar-meditacao"
                      element={
                        <FeatureFlagRoute
                          featureKey={FeatureFlagKeys.MEDITATION_MANAGEMENT}
                        >
                          <MeditationPageCreator fromTemplatePage={false} />
                        </FeatureFlagRoute>
                      }
                    />
                    <Route
                      path="editar-pagina-imagens"
                      element={
                        <FeatureFlagRoute
                          featureKey={FeatureFlagKeys.PAGE_MANAGEMENT}
                        >
                          <ImagePageCreator fromTemplatePage={false} />
                        </FeatureFlagRoute>
                      }
                    />
                    <Route
                      path="editar-pagina-videos"
                      element={
                        <FeatureFlagRoute
                          featureKey={FeatureFlagKeys.PAGE_MANAGEMENT}
                        >
                          <VideoPageCreator fromTemplatePage={false} />
                        </FeatureFlagRoute>
                      }
                    />
                    <Route
                      path="editar-pagina-visita"
                      element={
                        <FeatureFlagRoute
                          featureKey={FeatureFlagKeys.PAGE_MANAGEMENT}
                        >
                          <VisitMaterialPageCreator fromTemplatePage={false} />
                        </FeatureFlagRoute>
                      }
                    />
                    <Route
                      path="editar-pagina-ideias"
                      element={
                        <FeatureFlagRoute
                          featureKey={FeatureFlagKeys.PAGE_MANAGEMENT}
                        >
                          <IdeasMaterialPageCreator fromTemplatePage={false} />
                        </FeatureFlagRoute>
                      }
                    />
                    <Route
                      path="editar-imagens-shelter"
                      element={
                        <FeatureFlagRoute
                          featureKey={FeatureFlagKeys.PHOTO_MODERATION}
                        >
                          <ImageSectionEditorAdmin />
                        </FeatureFlagRoute>
                      }
                    />
                    <Route
                      path="editar-ideias-compartilhadas"
                      element={
                        <FeatureFlagRoute
                          featureKey={FeatureFlagKeys.IDEA_MODERATION}
                        >
                          <IdeasSectionPage />
                        </FeatureFlagRoute>
                      }
                    />

                    <Route
                      path="relatorios-visita"
                      element={
                        <FeatureFlagRoute
                          featureKey={FeatureFlagKeys.VISIT_REPORTS}
                        >
                          <VisitReportsManager />
                        </FeatureFlagRoute>
                      }
                    />
                    <Route
                      path="relatorios/pendencias"
                      element={
                        <FeatureFlagRoute
                          featureKey={FeatureFlagKeys.VISIT_REPORTS}
                        >
                          <PendingVisitReportsPage />
                        </FeatureFlagRoute>
                      }
                    />
                  </Route>
                </Route>

                {dynamicRoutes.map((route: DynamicRouteType) => {
                  const page = (
                    <PageRenderer
                      entityType={route.entityType}
                      idToFetch={route.idToFetch}
                    />
                  );
                  // Endereço antigo por slug (material, ideia ou vídeo): logado, vai para o endereço da Área do Membro.
                  const memberPath = isAuthenticated
                    ? buildMemberContentPath(route.entityType, route.idToFetch)
                    : null;
                  if (memberPath) {
                    return (
                      <Route
                        key={route.id}
                        path={`/${route.path}`}
                        element={<Navigate to={memberPath} replace />}
                      />
                    );
                  }
                  // Páginas de conteúdo do membro abrem dentro da casca (sidebar) quando há login.
                  const element =
                    isAuthenticated &&
                    isMemberAreaEntityType(route.entityType) ? (
                      <MemberAreaShell>{page}</MemberAreaShell>
                    ) : (
                      page
                    );
                  return (
                    <Route
                      key={route.id}
                      path={`/${route.path}`}
                      element={element}
                    />
                  );
                })}
                <Route path="*" element={<NotFoundPage />} />
              </Routes>
            </GlobalErrorBoundary>
          </Box>
        </Box>
        <Footer />
        <GlobalNotification />
      </Box>
    </BrowserRouter>
  );
}

export default App;
