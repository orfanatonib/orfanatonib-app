import { Navigate, Route } from "react-router-dom";
import ProtectedRoute from "@/components/ProtectedRoute/ProtectedRoute";
import { FeatureFlagKeys } from "@/features/feature-flags";
import {
  MEMBER_LEGACY_PATH_REDIRECTS,
  MEMBER_SUBPAGE_PATHS,
} from "@/pages/MemberArea/constants/navigation";
import { UserRole } from "@/store/slices/auth/authSlice";
import { MediaTargetType } from "@/store/slices/types";
import { flaggedElement } from "./flaggedElement";
import { lazyElement } from "./lazyElement";
import * as Pages from "./lazyPages";

const ADMIN_OR_LEADER = [UserRole.ADMIN, UserRole.LEADER];

/** Rotas autenticadas (Área do Membro, acolhidos, perfil, presença, integração). */
export function renderMemberRoutes() {
  return (
    <>
      <Route element={<ProtectedRoute />}>
        <Route
          element={flaggedElement(
            FeatureFlagKeys.MEMBER_AREA,
            <Pages.MemberAreaLayout />,
          )}
        >
          <Route
            path="/area-do-membro"
            element={flaggedElement(
              FeatureFlagKeys.MEMBER_AREA,
              <Pages.MemberArea />,
            )}
          />
          <Route
            path={MEMBER_SUBPAGE_PATHS.manual}
            element={flaggedElement(
              FeatureFlagKeys.MEMBER_MANUAL,
              <Pages.MinistryInstructions />,
            )}
          />
          <Route
            path={MEMBER_SUBPAGE_PATHS.photos}
            element={flaggedElement(
              FeatureFlagKeys.SHELTER_PHOTO_UPLOAD,
              <Pages.ImageSectionPage />,
            )}
          />
          <Route
            path={MEMBER_SUBPAGE_PATHS.materials}
            element={flaggedElement(
              FeatureFlagKeys.VISIT_MATERIALS,
              <Pages.VisitMaterialsList />,
            )}
          />
          <Route
            path={`${MEMBER_SUBPAGE_PATHS.materials}/:id`}
            element={flaggedElement(
              FeatureFlagKeys.VISIT_MATERIALS,
              <Pages.MemberContentPage
                entityType={MediaTargetType.VisitMaterialsPage}
              />,
            )}
          />
          <Route
            path={MEMBER_SUBPAGE_PATHS.rate}
            element={flaggedElement(
              FeatureFlagKeys.SITE_FEEDBACK,
              <Pages.SiteFeedbackForm />,
            )}
          />
          <Route
            path={MEMBER_SUBPAGE_PATHS.shareIdea}
            element={flaggedElement(
              FeatureFlagKeys.IDEA_SUBMISSION,
              <Pages.IdeasSectionPage />,
            )}
          />
          <Route
            path={MEMBER_SUBPAGE_PATHS.documents}
            element={flaggedElement(
              FeatureFlagKeys.DOCUMENTS_LIBRARY,
              <Pages.MemberDocumentsPage />,
            )}
          />
          <Route
            path={MEMBER_SUBPAGE_PATHS.ideas}
            element={flaggedElement(
              FeatureFlagKeys.IDEAS_SHARING,
              <Pages.MemberIdeasPage />,
            )}
          />
          <Route
            path={`${MEMBER_SUBPAGE_PATHS.ideas}/:id`}
            element={flaggedElement(
              FeatureFlagKeys.IDEAS_SHARING,
              <Pages.MemberContentPage entityType={MediaTargetType.IdeasPage} />,
            )}
          />
          <Route
            path={MEMBER_SUBPAGE_PATHS.videos}
            element={flaggedElement(
              FeatureFlagKeys.TRAINING_VIDEOS,
              <Pages.MemberVideosPage />,
            )}
          />
          <Route
            path={`${MEMBER_SUBPAGE_PATHS.videos}/:id`}
            element={flaggedElement(
              FeatureFlagKeys.TRAINING_VIDEOS,
              <Pages.MemberContentPage entityType={MediaTargetType.VideosPage} />,
            )}
          />
          <Route element={<ProtectedRoute requiredRole={ADMIN_OR_LEADER} />}>
            <Route
              path={MEMBER_SUBPAGE_PATHS.integrations}
              element={flaggedElement(
                FeatureFlagKeys.INTEGRATION,
                <Pages.IntegrationManager />,
              )}
            />
          </Route>
        </Route>
        <Route
          path="/area-dos-acolhidos"
          element={flaggedElement(
            FeatureFlagKeys.SHELTERED_AREA,
            <Pages.ShelteredBrowserPage />,
          )}
        />
        <Route
          path="/area-dos-acolhidos/:shelteredId"
          element={flaggedElement(
            FeatureFlagKeys.SHELTERED_AREA,
            <Pages.ShelteredPagelasPage />,
          )}
        />
        <Route path="/perfil" element={lazyElement(<Pages.ProfilePage />)} />
        <Route
          path="/presenca"
          element={lazyElement(<Pages.AttendanceIndexRedirect />)}
        />
        {/* A API é admin/líder (403 para membro): a rota também. */}
        <Route element={<ProtectedRoute requiredRole={ADMIN_OR_LEADER} />}>
          <Route
            path="/integracao"
            element={flaggedElement(
              FeatureFlagKeys.INTEGRATION,
              <Pages.IntegrationShelteredPage />,
            )}
          />
        </Route>
      </Route>

      {/* Endereços antigos da Área do Membro (e Integrações FM, que saiu do /adm) redirecionam. */}
      {Object.entries(MEMBER_LEGACY_PATH_REDIRECTS).map(([from, to]) => (
        <Route
          key={from}
          path={from}
          element={<Navigate to={to} replace />}
        />
      ))}
    </>
  );
}
