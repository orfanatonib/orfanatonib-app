import { AttendanceDashboard } from './features/attendance/pages';
import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Box, CircularProgress, Toolbar, Button, Typography } from '@mui/material';

import './App.css';
import './styles/Global.css';

import Navbar from './components/NavBar/Navbar';
import Footer from './components/Footer/Footer';
import ProtectedRoute from './components/ProtectedRoute/ProtectedRoute';
import PageRenderer from './components/PageRenderer/PageRenderer';

import Home from './pages/Home/Home';
import About from './pages/About/About';
import Contact from './pages/Contact/Contact';
import Login from './pages/Login/Login';
import TeacherArea from './pages/TeacherArea/TeacherArea';
import EmailVerificationInstructions from './pages/EmailVerification/EmailVerificationInstructions';
import ShelterFeedView from './pages/PageView/ShelterFeedView/ShelterFeedView';

import MeditationPageCreator from './components/Adm/PageCreator/Templates/MeditationPageCreator/MeditationPageCreator';
import ImagePageCreator from './components/Adm/PageCreator/Templates/ImagePageCreator/ImagePageCreator';
import VideoPageCreator from './components/Adm/PageCreator/Templates/VideoPageCreator/VideoPageCreator';
import VisitMaterialPageCreator from './components/Adm/PageCreator/Templates/VisitMaterialPageCreator/VisitMaterialPageCreator';
import SelecPageTemplate from './components/Adm/PageCreator/SelectPageTemplate/SelecPageTemplate';

import AdminDashboardPage from './components/Adm/AdminDashboardPage';
import AdminLayout from './components/Adm/AdminLayout/AdminLayout';

import { fetchRoutes } from './store/slices/route/routeSlice';
import { UserRole, initAuth, logout } from './store/slices/auth/authSlice';
import { fetchFeatureFlags } from './store/slices/feature-flags/featureFlagsSlice';
import { FeatureFlagRoute, FeatureFlagKeys } from './features/feature-flags';

import type { RouteData as DynamicRouteType } from './store/slices/route/routeSlice';
import type { RootState as RootStateType, AppDispatch as AppDispatchType } from './store/slices';

import { IdeasMaterialPageCreator } from 'components/Adm/PageCreator/Templates/IdeasMaterialPageCreator/IdeasMaterialPageCreator';
import { VisitMaterialsList } from './pages/TeacherArea/components';
import ImageSectionPage from './pages/TeacherArea/ImageSection/ImageSectionPage';
import ImageSectionEditorAdmin from './features/image-sections/ImageSectionEditorAdmin';
import { SiteFeedbackForm } from './pages/TeacherArea/components';

import LeaderProfilesManager from './features/leaders/LeaderProfilesManager';
import TeacherProfilesManager from './features/teachers/TeacherProfilesManager';
import SheltersManager from './features/shelters/SheltersManager';
import ShelterFormPage from './features/shelters/ShelterFormPage';
import ContactsManager from './features/contacts/ContactsManager';
import MeditationManager from './features/meditations/MeditationManager';
import ShelteredManager from './features/sheltered/ShelteredManager';
import ShelteredBrowserPage from './features/pagela-teacher/ShelteredBrowserPage';
import ShelteredPagelasPage from './features/pagela-teacher/ShelteredPagelasPage';
import Register from './pages/Register/Register';
import PagelaSheltersManager from './features/pagela-shelters/PagelaSheltersManager';
import CommentsManager from './features/comments/CommentsManager';
import FeedbackManager from './features/feedback/FeedbackManager';
import UsersManager from './features/users/UsersManager';
import InformativeBannerLManager from './features/informatives/InformativeBannerLManager';
import ImageSectionManager from './features/image-sections/ImageSectionManager';
import ImagePageManager from './features/image-pages/ImagePageManager';
import IdeasSectionManager from './features/ideas-sections/IdeasSectionManager';
import IdeasSectionPage from './pages/TeacherArea/IdeasSection/IdeasSectionPage';
import DocumentsManager from './features/documents/DocumentsManager';
import IdeasManager from './features/ideas-pages/IdeasManager';
import VideosManager from './features/video-pages/VideosManager';
import VisitMaterialManager from './features/visit-materials/VisitMaterialManager';
import { ProfilePage } from './features/profile';
import EventosPage from './pages/Event/EventosPage';
import ShelterScheduleManager from './features/shelter-schedule/ShelterScheduleManager';
import ProfilesManager from './features/profile/ProfilesManager';

function App() {
  const dispatch = useDispatch<AppDispatchType>();
  const dynamicRoutes = useSelector((state: RootStateType) => state.routes.routes);
  const { initialized, loadingUser, isAuthenticated, user } = useSelector((state: RootStateType) => state.auth);
  const [forceReady, setForceReady] = useState(false);

  useEffect(() => {
    dispatch(fetchRoutes());
    dispatch(initAuth());

    const fallbackTimeout = setTimeout(() => {

      setForceReady(true);
    }, 15000);

    return () => clearTimeout(fallbackTimeout);
  }, [dispatch]);

  useEffect(() => {
    if (isAuthenticated) {
      dispatch(fetchFeatureFlags());
    }
  }, [dispatch, isAuthenticated]);

  const handleLogout = () => {
    dispatch(logout());
    setForceReady(true);
  };

  if (!forceReady && (!initialized || loadingUser)) {
    return (
      <Box
        sx={{
          height: '100vh',
          width: '100vw',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          background: 'linear-gradient(135deg, #E8F5E9 0%, #FFFFFF 100%)',
          backgroundAttachment: 'fixed',
          gap: 3,
          px: 2,
        }}
      >
        <CircularProgress size={48} />
        <Typography variant="body1" color="text.secondary">
          Verificando autenticação...
        </Typography>
        <Button
          variant="outlined"
          color="error"
          onClick={handleLogout}
          sx={{
            mt: 2,
            borderWidth: 2,
            '&:hover': {
              borderWidth: 2,
              bgcolor: 'rgba(211, 47, 47, 0.04)',
            }
          }}
        >
          Sair
        </Button>
      </Box>
    );
  }

  return (
    <BrowserRouter>
      <Box sx={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        background: 'linear-gradient(135deg, #E8F5E9 0%, #FFFFFF 100%)',
        backgroundAttachment: 'fixed',
      }}>
        <Navbar />

        <Box component="main" sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <Toolbar />
          <Box className="mainContainer" sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/sobre" element={<About />} />
              <Route path="/contato" element={<Contact />} />
              <Route path="/eventos" element={<EventosPage />} />
              <Route path="/feed-abrigos" element={<ShelterFeedView feed />} />
              <Route path="/login" element={<Login />} />
              <Route path="/verificar-email" element={<EmailVerificationInstructions />} />
              <Route path="/cadastrar-google" element={<Register commonUser={false} />} />
              <Route path="/cadastrar" element={<Register commonUser />} />
              <Route path="*" element={<Home />} />

              <Route element={<ProtectedRoute />}>
                <Route path="/area-do-membro" element={<TeacherArea />} />
                <Route path="/perfil" element={<ProfilePage />} />
                <Route path="/presenca" element={<AttendanceDashboard />} />
                <Route path="/imagens-abrigo" element={<ImageSectionPage />} />
                <Route path="/lista-materias-visita" element={<VisitMaterialsList />} />
                <Route path="/avaliar-site" element={<SiteFeedbackForm />} />
                <Route
                  path="/area-dos-abrigados"
                  element={
                    <FeatureFlagRoute featureKey={FeatureFlagKeys.SHELTER_PAGELAS}>
                      <ShelteredBrowserPage />
                    </FeatureFlagRoute>
                  }
                />
                <Route
                  path="/area-dos-abrigados/:shelteredId"
                  element={
                    <FeatureFlagRoute featureKey={FeatureFlagKeys.SHELTER_PAGELAS}>
                      <ShelteredPagelasPage />
                    </FeatureFlagRoute>
                  }
                />
                <Route path="/compartilhar-ideia" element={<IdeasSectionPage />} />
              </Route>

              <Route element={<ProtectedRoute requiredRole={[UserRole.ADMIN, UserRole.LEADER]} />}>
                <Route path="/adm" element={<AdminLayout />}>
                  <Route index element={<AdminDashboardPage />} />
                  <Route path="presenca" element={<AttendanceDashboard />} />
                  <Route path="meditacoes" element={<MeditationManager />} />
                  <Route path="comentarios" element={<CommentsManager />} />
                  <Route path="documentos" element={<DocumentsManager />} />
                  <Route path="informativos" element={<InformativeBannerLManager />} />
                  <Route path="feedbacks" element={<FeedbackManager />} />
                  <Route path="contatos" element={<ContactsManager />} />
                  <Route path="paginas-materiais-visita" element={<VisitMaterialManager />} />
                  <Route path="paginas-fotos" element={<ImagePageManager />} />
                  <Route path="fotos-abrigos" element={<ImageSectionManager />} />
                  <Route path="ideias-compartilhadas" element={<IdeasSectionManager />} />
                  <Route path="paginas-videos" element={<VideosManager />} />
                  <Route path="paginas-ideias" element={<IdeasManager />} />
                  <Route path="criar-pagina" element={<SelecPageTemplate />} />
                  <Route path="usuarios" element={<UsersManager />} />
                  <Route path="perfis" element={<ProfilesManager />} />
                  <Route path="lideres" element={<LeaderProfilesManager />} />
                  <Route path="membros" element={<TeacherProfilesManager />} />
                  <Route
                    path="abrigados"
                    element={
                      <FeatureFlagRoute featureKey={FeatureFlagKeys.SHELTER_MANAGEMENT}>
                        <ShelteredManager />
                      </FeatureFlagRoute>
                    }
                  />
                  <Route path="abrigos" element={<SheltersManager />} />
                  <Route path="abrigos/novo" element={<ShelterFormPage />} />
                  <Route path="abrigos/:id/edit" element={<ShelterFormPage />} />
                  <Route
                    path="pagelas"
                    element={
                      <FeatureFlagRoute featureKey={FeatureFlagKeys.SHELTER_PAGELAS}>
                        <PagelaSheltersManager />
                      </FeatureFlagRoute>
                    }
                  />
                  <Route path="agendamentos" element={<ShelterScheduleManager />} />

                  <Route path="editar-meditacao" element={<MeditationPageCreator fromTemplatePage={false} />} />
                  <Route path="editar-pagina-imagens" element={<ImagePageCreator fromTemplatePage={false} />} />
                  <Route path="editar-pagina-videos" element={<VideoPageCreator fromTemplatePage={false} />} />
                  <Route path="editar-pagina-visita" element={<VisitMaterialPageCreator fromTemplatePage={false} />} />
                  <Route path="editar-pagina-ideias" element={<IdeasMaterialPageCreator fromTemplatePage={false} />} />
                  <Route path="editar-imagens-shelter" element={<ImageSectionEditorAdmin />} />
                  <Route path="editar-ideias-compartilhadas" element={<IdeasSectionPage />} />
                </Route>
              </Route>

              {dynamicRoutes.map((route: DynamicRouteType) => (
                <Route
                  key={route.id}
                  path={`/${route.path}`}
                  element={<PageRenderer entityType={route.entityType} idToFetch={route.idToFetch} />}
                />
              ))}
            </Routes>
          </Box>
        </Box>
        <Footer />
      </Box>
    </BrowserRouter>
  );
}

export default App;
