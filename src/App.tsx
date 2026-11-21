import { useEffect, useState } from "react";
import { BrowserRouter } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { Box, Toolbar } from "@mui/material";

import "./App.css";
import "./styles/Global.css";

import Navbar from "./components/NavBar/Navbar";
import Footer from "./components/Footer/Footer";
import AppBootScreen from "./components/AppBoot/AppBootScreen";
import GlobalErrorBoundary from "./components/common/GlobalErrorBoundary";
import GlobalNotification from "./components/GlobalNotification/GlobalNotification";

import { fetchRoutes } from "./store/slices/route/routeSlice";
import { initAuth, logout } from "./store/slices/auth/authSlice";
import { fetchFeatureFlags } from "./store/slices/feature-flags/featureFlagsSlice";
import { AppRoutes, BOOT_TIMEOUT_MS } from "./routes";
import type {
  RootState as RootStateType,
  AppDispatch as AppDispatchType,
} from "./store/slices";

function App() {
  const dispatch = useDispatch<AppDispatchType>();
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
              <AppRoutes isAuthenticated={isAuthenticated} />
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
