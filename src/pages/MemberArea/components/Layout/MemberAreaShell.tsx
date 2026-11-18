import React, { Suspense, useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, CircularProgress } from '@mui/material';
import { MEMBER_SHELL_LAYOUT } from '../../constants/navigation';
import { useMemberNavigation } from '../../hooks/useMemberNavigation';
import type { MemberAreaShellProps } from '../../types/navigation';
import MemberAreaHeader from './MemberAreaHeader';
import MemberAreaSidebar from './MemberAreaSidebar';
import MemberPageHeader from './MemberPageHeader';

/**
 * Esqueleto de toda a Área do Membro (exceto a Home, que só preenche o miolo):
 * fundo, cabeçalho, sidebar (desktop) ou abas (mobile) e uma área de conteúdo com
 * altura mínima fixa. Trocar de subpágina só troca o miolo; nada da casca remonta.
 */
const MemberAreaShell: React.FC<MemberAreaShellProps> = ({ children }) => {
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const { activeItem } = useMemberNavigation();

  const handleNavigate = useCallback((to: string) => navigate(to), [navigate]);
  const handleToggleCollapse = useCallback(() => setCollapsed((prev) => !prev), []);

  return (
    <Box
      data-testid="member-area-shell"
      sx={{
        width: '100%',
        flex: 1,
        pb: 8,
        background: 'linear-gradient(135deg, #f5f7fa 0%, #e8f5e9 50%, #ffffff 100%)',
      }}
    >
      <Box data-testid="member-area-frame" sx={{ width: MEMBER_SHELL_LAYOUT.width, mx: 'auto', pt: { xs: 0, md: 3 } }}>
        <MemberAreaHeader />

        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', md: 'row' },
            alignItems: 'stretch',
            gap: { xs: 0, md: 2.5 },
          }}
        >
          <MemberAreaSidebar
            collapsed={collapsed}
            onToggleCollapse={handleToggleCollapse}
            onNavigate={handleNavigate}
          />

          <Box
            data-testid="member-area-content"
            component="main"
            sx={{
              flex: 1,
              minWidth: 0,
              width: '100%',
              minHeight: MEMBER_SHELL_LAYOUT.contentMinHeight,
            }}
          >
            {activeItem && !activeItem.hidePageHeader && <MemberPageHeader item={activeItem} />}
            <Suspense
              fallback={
                <Box
                  data-testid="member-area-content-loading"
                  sx={{ display: 'grid', placeItems: 'center', py: 10 }}
                >
                  <CircularProgress size={40} thickness={4} aria-label="Carregando conteúdo" />
                </Box>
              }
            >
              {children}
            </Suspense>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default MemberAreaShell;
