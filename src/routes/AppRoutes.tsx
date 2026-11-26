import { Routes, Route } from "react-router-dom";
import NotFoundPage from "@/pages/NotFound/NotFoundPage";
import { useVisibleRoutes } from "@/features/feature-flags";
import { renderAdminRoutes } from "./adminRoutes";
import { renderDynamicRoutes } from "./dynamicRoutes";
import { renderMemberRoutes } from "./memberRoutes";
import { renderPublicRoutes } from "./publicRoutes";

interface AppRoutesProps {
  isAuthenticated: boolean;
}

/** Árvore de rotas do app: cada página é carregada sob demanda (`React.lazy` + esqueleto). */
export default function AppRoutes({ isAuthenticated }: AppRoutesProps) {
  // Página de tipo desligado (flag) não vira rota: cai no 404.
  const dynamicRoutes = useVisibleRoutes();

  return (
    <Routes>
      {renderPublicRoutes()}
      {renderMemberRoutes()}
      {renderAdminRoutes()}
      {renderDynamicRoutes(dynamicRoutes, isAuthenticated)}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
