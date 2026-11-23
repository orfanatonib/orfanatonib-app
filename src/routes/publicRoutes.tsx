import { Route } from "react-router-dom";
import { FeatureFlagKeys } from "@/features/feature-flags";
import { LegacyFeedRedirect } from "@/features/shelter-feed/LegacyFeedRedirect";
import { SHELTER_FEED_PATH } from "@/features/shelter-feed/routes";
import {
  PUBLIC_MEDIA_BASE_PATH,
  PUBLIC_MEDIA_KIND_PATH,
  PublicMediaKind,
} from "@/features/public-media";
import Home from "@/pages/Home/Home";
import { flaggedElement } from "./flaggedElement";
import { lazyElement } from "./lazyElement";
import * as Pages from "./lazyPages";

/** Rotas públicas. Chamada como função (não como componente): `<Routes>` só aceita `<Route>`/fragmento. */
export function renderPublicRoutes() {
  return (
    <>
      <Route path="/" element={<Home />} />
      <Route
        path="/sobre"
        element={flaggedElement(FeatureFlagKeys.ABOUT_PAGE, <Pages.About />)}
      />
      <Route
        path="/contato"
        element={flaggedElement(FeatureFlagKeys.CONTACT_FORM, <Pages.Contact />)}
      />
      <Route
        path="/eventos"
        element={flaggedElement(
          FeatureFlagKeys.EVENTS_SECTION,
          <Pages.EventosPage />,
        )}
      />
      <Route
        path={PUBLIC_MEDIA_BASE_PATH}
        element={lazyElement(<Pages.PublicMediaGalleryPage />)}
      />
      <Route
        path={`${PUBLIC_MEDIA_KIND_PATH[PublicMediaKind.Photos]}/:id`}
        element={lazyElement(
          <Pages.PublicMediaDetailPage kind={PublicMediaKind.Photos} />,
        )}
      />
      <Route
        path={`${PUBLIC_MEDIA_KIND_PATH[PublicMediaKind.Videos]}/:id`}
        element={lazyElement(
          <Pages.PublicMediaDetailPage kind={PublicMediaKind.Videos} />,
        )}
      />
      <Route path="/feed-abrigos" element={<LegacyFeedRedirect />} />
      <Route
        path={SHELTER_FEED_PATH}
        element={flaggedElement(
          FeatureFlagKeys.SHELTER_FEED,
          <Pages.ShelterFeedView feed />,
        )}
      />
      <Route path="/login" element={lazyElement(<Pages.Login />)} />
      <Route
        path="/verificar-email"
        element={lazyElement(<Pages.EmailVerificationInstructions />)}
      />
      <Route
        path="/verificar-email/:token"
        element={lazyElement(<Pages.ConfirmEmail />)}
      />
      <Route
        path="/cadastrar-google"
        element={flaggedElement(
          FeatureFlagKeys.GOOGLE_LOGIN,
          <Pages.Register commonUser={false} />,
        )}
      />
      <Route
        path="/cadastrar"
        element={flaggedElement(
          FeatureFlagKeys.PUBLIC_REGISTRATION,
          <Pages.Register commonUser />,
        )}
      />
      <Route
        path="/esqueci-minha-senha"
        element={flaggedElement(
          FeatureFlagKeys.PASSWORD_RECOVERY,
          <Pages.ForgotPassword />,
        )}
      />
      <Route
        path="/recuperar-senha/:token"
        element={flaggedElement(
          FeatureFlagKeys.PASSWORD_RECOVERY,
          <Pages.ResetPassword />,
        )}
      />
    </>
  );
}
