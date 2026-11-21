import { Navigate, Outlet, Route } from "react-router-dom";
import ProtectedRoute from "@/components/ProtectedRoute/ProtectedRoute";
import RequireAdmin from "@/components/RequireAdmin/RequireAdmin";
import { PAGE_TEMPLATE_OPTIONS } from "@/components/Adm/PageCreator/SelectPageTemplate/constants";
import { FeatureFlagRoute, FeatureFlagKeys } from "@/features/feature-flags";
import { FEED_COMMENTS_ADMIN_PATH } from "@/features/feed-comments/constants";
import { UserRole } from "@/store/slices/auth/authSlice";
import { ADMIN_FALLBACK_PATH, LEGACY_AI_PROVIDERS_PATHS } from "./constants";
import { flaggedElement } from "./flaggedElement";
import { lazyElement } from "./lazyElement";
import * as Pages from "./lazyPages";

/** Painel `/adm` (admin e líder; as áreas só de admin têm `RequireAdmin`). */
export function renderAdminRoutes() {
  return (
    <Route
      element={
        <ProtectedRoute requiredRole={[UserRole.ADMIN, UserRole.LEADER]} />
      }
    >
      <Route path="/adm" element={lazyElement(<Pages.AdminLayout />)}>
        <Route index element={lazyElement(<Pages.AdminDashboardPage />)} />
        <Route
          path="presenca"
          element={flaggedElement(
            FeatureFlagKeys.ATTENDANCE,
            <Pages.AttendanceLayout />,
          )}
        >
          <Route
            index
            element={lazyElement(<Pages.AttendanceIndexRedirect />)}
          />
          <Route
            path="lancar"
            element={lazyElement(<Pages.AttendanceDashboard />)}
          />
          <Route
            path="equipes/:teamId"
            element={lazyElement(<Pages.AttendanceTeamPage />)}
          />
          <Route path="consultar" element={lazyElement(<Pages.ListSheets />)} />
          <Route
            path="pendencias"
            element={lazyElement(<Pages.PendingAttendancePage />)}
          />
        </Route>
        <Route
          path="meditacoes"
          element={flaggedElement(
            FeatureFlagKeys.MEDITATION_MANAGEMENT,
            <Pages.MeditationManager />,
          )}
        />
        <Route
          path="comentarios"
          element={flaggedElement(
            FeatureFlagKeys.COMMENT_MODERATION,
            <Pages.CommentsManager />,
          )}
        />
        <Route
          path="documentos"
          element={flaggedElement(
            FeatureFlagKeys.DOCUMENT_MANAGEMENT,
            <Pages.DocumentsManager />,
          )}
        />
        <Route
          path="informativos"
          element={flaggedElement(
            FeatureFlagKeys.INFORMATIVE_MANAGEMENT,
            <Pages.InformativeBannerLManager />,
          )}
        />
        <Route
          path="feedbacks"
          element={flaggedElement(
            FeatureFlagKeys.FEEDBACK_MANAGEMENT,
            <Pages.FeedbackManager />,
          )}
        />
        <Route
          path="contatos"
          element={flaggedElement(
            FeatureFlagKeys.CONTACT_MANAGEMENT,
            <Pages.ContactsManager />,
          )}
        />
        <Route
          path="paginas-materiais-visita"
          element={flaggedElement(
            FeatureFlagKeys.PAGE_MANAGEMENT,
            <Pages.VisitMaterialManager />,
          )}
        />
        <Route
          path="paginas-fotos"
          element={flaggedElement(
            FeatureFlagKeys.PAGE_MANAGEMENT,
            <Pages.ImagePageManager />,
          )}
        />
        <Route
          path="fotos-abrigos"
          element={flaggedElement(
            FeatureFlagKeys.PHOTO_MODERATION,
            <Pages.ImageSectionManager />,
          )}
        />
        <Route
          path={FEED_COMMENTS_ADMIN_PATH}
          element={
            <FeatureFlagRoute featureKey={FeatureFlagKeys.SHELTER_FEED}>
              {flaggedElement(
                FeatureFlagKeys.SHELTER_FEED_COMMENTS,
                <Pages.FeedCommentsManager />,
              )}
            </FeatureFlagRoute>
          }
        />
        <Route
          path="ideias-compartilhadas"
          element={flaggedElement(
            FeatureFlagKeys.IDEA_MODERATION,
            <Pages.IdeasSectionManager />,
          )}
        />
        <Route
          path="paginas-videos"
          element={flaggedElement(
            FeatureFlagKeys.PAGE_MANAGEMENT,
            <Pages.VideosManager />,
          )}
        />
        <Route
          path="paginas-ideias"
          element={flaggedElement(
            FeatureFlagKeys.PAGE_MANAGEMENT,
            <Pages.IdeasManager />,
          )}
        />
        <Route
          path="criar-pagina"
          element={flaggedElement(FeatureFlagKeys.PAGE_MANAGEMENT, <Outlet />)}
        >
          <Route index element={lazyElement(<Pages.SelectPageTemplate />)} />
          {PAGE_TEMPLATE_OPTIONS.map((option) => (
            <Route
              key={option.key}
              path={option.path}
              element={lazyElement(
                <Pages.SelectPageTemplate templateKey={option.key} />,
              )}
            />
          ))}
        </Route>
        <Route
          path="estudio"
          element={
            <RequireAdmin>
              {flaggedElement(
                FeatureFlagKeys.CONTENT_STUDIO,
                <Pages.ContentStudioShell />,
              )}
            </RequireAdmin>
          }
        >
          <Route
            index
            element={lazyElement(<Pages.ContentStudioHomePage />)}
          />
          <Route
            path="producao"
            element={lazyElement(<Pages.ContentStudioProductionPage />)}
          />
          <Route
            path="pacotes/:id"
            element={lazyElement(<Pages.ContentPackageDetailPage />)}
          />
          <Route
            path="orientacoes"
            element={lazyElement(<Pages.ContentStudioGuidelinesPage />)}
          />
          <Route
            path="revisao"
            element={flaggedElement(
              FeatureFlagKeys.CONTENT_STUDIO_REVIEW,
              <Pages.ContentStudioReviewPage />,
            )}
          />
          <Route
            path="revisao/:id"
            element={flaggedElement(
              FeatureFlagKeys.CONTENT_STUDIO_REVIEW,
              <Pages.ContentReviewPackagePage />,
            )}
          />
        </Route>
        <Route
          path="config-provedores-ia"
          element={
            <RequireAdmin>
              <FeatureFlagRoute featureKey={FeatureFlagKeys.CONTENT_STUDIO}>
                {flaggedElement(
                  FeatureFlagKeys.CONTENT_STUDIO_PROVIDER_ADMIN,
                  <Pages.AiProvidersConfigPage />,
                )}
              </FeatureFlagRoute>
            </RequireAdmin>
          }
        />
        {LEGACY_AI_PROVIDERS_PATHS.map((legacyPath) => (
          <Route
            key={legacyPath}
            path={legacyPath}
            element={<Navigate to={ADMIN_FALLBACK_PATH} replace />}
          />
        ))}
        <Route
          path="usuarios"
          element={flaggedElement(
            FeatureFlagKeys.USER_MANAGEMENT,
            <Pages.UsersManager />,
          )}
        />
        <Route
          path="perfis"
          element={flaggedElement(
            FeatureFlagKeys.USER_MANAGEMENT,
            <Pages.ProfilesManager />,
          )}
        />
        <Route
          path="lideres"
          element={flaggedElement(
            FeatureFlagKeys.LEADER_MANAGEMENT,
            <Pages.LeaderProfilesManager />,
          )}
        />
        <Route
          path="membros"
          element={flaggedElement(
            FeatureFlagKeys.MEMBER_MANAGEMENT,
            <Pages.MemberProfilesManager />,
          )}
        />
        <Route
          path="acolhidos"
          element={flaggedElement(
            FeatureFlagKeys.SHELTERED_MANAGEMENT,
            <Pages.ShelteredManager />,
          )}
        />
        <Route
          path="abrigos"
          element={flaggedElement(
            FeatureFlagKeys.SHELTER_MANAGEMENT,
            <Pages.SheltersManager />,
          )}
        />
        <Route
          path="abrigos/novo"
          element={flaggedElement(
            FeatureFlagKeys.SHELTER_MANAGEMENT,
            <Pages.ShelterFormPage />,
          )}
        />
        <Route
          path="abrigos/:id/edit"
          element={flaggedElement(
            FeatureFlagKeys.SHELTER_MANAGEMENT,
            <Pages.ShelterFormPage />,
          )}
        />
        <Route
          path="pagelas"
          element={flaggedElement(
            FeatureFlagKeys.PAGELAS,
            <Pages.PagelaSheltersManager />,
          )}
        />
        <Route
          path="agendamentos"
          element={flaggedElement(
            FeatureFlagKeys.SHELTER_SCHEDULE,
            <Pages.ShelterScheduleManager />,
          )}
        />
        <Route
          path="antecedentes"
          element={flaggedElement(
            FeatureFlagKeys.CRIMINAL_RECORDS,
            <Pages.AtendentesManager />,
          )}
        />
        <Route
          path="observabilidade-auditoria"
          element={
            <RequireAdmin>
              {flaggedElement(
                FeatureFlagKeys.OBSERVABILITY_AUDIT,
                <Pages.ObservabilityAuditPage />,
              )}
            </RequireAdmin>
          }
        />
        <Route
          path="feature-flags"
          element={
            <RequireAdmin>{lazyElement(<Pages.FeatureFlagsPage />)}</RequireAdmin>
          }
        />

        <Route
          path="editar-meditacao"
          element={flaggedElement(
            FeatureFlagKeys.MEDITATION_MANAGEMENT,
            <Pages.MeditationPageCreator fromTemplatePage={false} />,
          )}
        />
        <Route
          path="editar-pagina-imagens"
          element={flaggedElement(
            FeatureFlagKeys.PAGE_MANAGEMENT,
            <Pages.ImagePageCreator fromTemplatePage={false} />,
          )}
        />
        <Route
          path="editar-pagina-videos"
          element={flaggedElement(
            FeatureFlagKeys.PAGE_MANAGEMENT,
            <Pages.VideoPageCreator fromTemplatePage={false} />,
          )}
        />
        <Route
          path="editar-pagina-visita"
          element={flaggedElement(
            FeatureFlagKeys.PAGE_MANAGEMENT,
            <Pages.VisitMaterialPageCreator fromTemplatePage={false} />,
          )}
        />
        <Route
          path="editar-pagina-ideias"
          element={flaggedElement(
            FeatureFlagKeys.PAGE_MANAGEMENT,
            <Pages.IdeasMaterialPageCreator fromTemplatePage={false} />,
          )}
        />
        <Route
          path="editar-imagens-shelter"
          element={flaggedElement(
            FeatureFlagKeys.PHOTO_MODERATION,
            <Pages.ImageSectionEditorAdmin />,
          )}
        />
        <Route
          path="editar-ideias-compartilhadas"
          element={flaggedElement(
            FeatureFlagKeys.IDEA_MODERATION,
            <Pages.IdeasSectionPage />,
          )}
        />

        <Route
          path="relatorios-visita"
          element={flaggedElement(
            FeatureFlagKeys.VISIT_REPORTS,
            <Pages.VisitReportsManager />,
          )}
        />
        <Route
          path="relatorios/pendencias"
          element={flaggedElement(
            FeatureFlagKeys.VISIT_REPORTS,
            <Pages.PendingVisitReportsPage />,
          )}
        />
      </Route>
    </Route>
  );
}
