import React from 'react';
import {
  Box,
  Button,
  Divider,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Paper,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { ChevronLeft as ChevronLeftIcon, ChevronRight as ChevronRightIcon } from '@mui/icons-material';
import {
  MEMBER_NAV_GROUP_LABELS,
  MEMBER_NAV_GROUP_ORDER,
  MEMBER_SIDEBAR_LAYOUT,
} from '../../constants/navigation';
import { useMemberNavigation } from '../../hooks/useMemberNavigation';
import type { MemberAreaSidebarProps, MemberNavItemDefinition } from '../../types/navigation';

const MemberAreaSidebar: React.FC<MemberAreaSidebarProps> = ({
  collapsed,
  onToggleCollapse,
  onNavigate,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { navItems, activeId } = useMemberNavigation();

  if (isMobile) {
    return (
      <Box
        data-testid="member-area-sidebar-mobile"
        component="nav"
        aria-label="Navegação da Área do Membro"
        sx={{
          position: 'sticky',
          top: MEMBER_SIDEBAR_LAYOUT.mobileTop,
          zIndex: MEMBER_SIDEBAR_LAYOUT.mobileZIndex,
          py: 0.75,
          mb: 1.5,
          bgcolor: 'rgba(244, 246, 249, 0.96)',
          backdropFilter: 'blur(8px)',
          borderBottom: '1px solid #dbe4f0',
        }}
      >
        <Box
          data-testid="member-area-sidebar-mobile-scroller"
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 0.75,
            px: 1,
            overflowX: 'auto',
            scrollSnapType: 'x proximity',
            WebkitOverflowScrolling: 'touch',
            '&::-webkit-scrollbar': { display: 'none' },
            scrollbarWidth: 'none',
          }}
        >
          {navItems.map((item) => {
            const active = item.id === activeId;
            const Icon = item.icon;
            return (
              <Button
                key={item.id}
                data-testid={`member-nav-${item.id}`}
                ref={(el) => {
                  if (active && el) {
                    el.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'smooth' });
                  }
                }}
                aria-current={active ? 'page' : undefined}
                onClick={() => onNavigate(item.to)}
                startIcon={<Icon fontSize="small" />}
                sx={{
                  flexShrink: 0,
                  scrollSnapAlign: 'center',
                  textTransform: 'none',
                  fontWeight: active ? 800 : 600,
                  fontSize: '0.85rem',
                  borderRadius: 5,
                  px: 1.75,
                  minHeight: MEMBER_SIDEBAR_LAYOUT.touchTarget,
                  whiteSpace: 'nowrap',
                  bgcolor: active ? item.accentColor : '#ffffff',
                  color: active ? '#ffffff' : '#334155',
                  border: `1px solid ${active ? item.accentColor : '#dbe4f0'}`,
                  '&:hover': { bgcolor: active ? item.accentColor : '#f8fafc' },
                }}
              >
                {item.label}
              </Button>
            );
          })}
        </Box>
      </Box>
    );
  }

  return (
    <Paper
      data-testid="member-area-sidebar"
      component="nav"
      aria-label="Navegação da Área do Membro"
      elevation={0}
      sx={{
        width: collapsed ? MEMBER_SIDEBAR_LAYOUT.collapsedWidth : MEMBER_SIDEBAR_LAYOUT.expandedWidth,
        flexShrink: 0,
        borderRadius: 3.5,
        bgcolor: '#ffffff',
        border: '1px solid #dbe4f0',
        boxShadow: '0 4px 20px rgba(15, 23, 42, 0.04)',
        alignSelf: 'flex-start',
        position: 'sticky',
        top: MEMBER_SIDEBAR_LAYOUT.desktopTop,
        transition: 'width 0.22s ease',
        overflow: 'hidden',
      }}
    >
      <Box
        sx={{
          px: collapsed ? 1 : 2,
          py: 1.5,
          display: 'flex',
          alignItems: 'center',
          justifyContent: collapsed ? 'center' : 'space-between',
          borderBottom: '1px solid #f1f5f9',
        }}
      >
        {!collapsed && (
          <Typography
            data-testid="member-area-sidebar-title"
            variant="subtitle2"
            fontWeight={800}
            color="#0f2942"
            sx={{ fontSize: '0.85rem', letterSpacing: 0.2 }}
          >
            Navegação do Membro
          </Typography>
        )}
        <Tooltip title={collapsed ? 'Expandir menu' : 'Recolher menu'} placement="right">
          <IconButton
            data-testid="member-area-sidebar-toggle"
            size="small"
            onClick={onToggleCollapse}
            aria-label={collapsed ? 'Expandir menu' : 'Recolher menu'}
            aria-expanded={!collapsed}
            sx={{
              color: '#64748b',
              minWidth: MEMBER_SIDEBAR_LAYOUT.touchTarget,
              minHeight: MEMBER_SIDEBAR_LAYOUT.touchTarget,
              '&:hover': { color: '#0f2942' },
            }}
          >
            {collapsed ? <ChevronRightIcon fontSize="small" /> : <ChevronLeftIcon fontSize="small" />}
          </IconButton>
        </Tooltip>
      </Box>

      <Box sx={{ p: collapsed ? 0.75 : 1.25 }}>
        {MEMBER_NAV_GROUP_ORDER.map((group, groupIndex) => {
          const groupItems: MemberNavItemDefinition[] = navItems.filter((item) => item.group === group);
          if (groupItems.length === 0) return null;
          const isLastGroup = groupIndex === MEMBER_NAV_GROUP_ORDER.length - 1;

          return (
            <Box
              key={group}
              data-testid={`member-nav-group-${group}`}
              sx={{ mb: isLastGroup ? 0 : 1.5 }}
            >
              {!collapsed && (
                <Typography
                  variant="overline"
                  sx={{
                    display: 'block',
                    px: 1.25,
                    pb: 0.5,
                    fontWeight: 800,
                    fontSize: '0.66rem',
                    color: '#64748b',
                    letterSpacing: 0.8,
                    lineHeight: 1.3,
                  }}
                >
                  {MEMBER_NAV_GROUP_LABELS[group]}
                </Typography>
              )}

              <List dense disablePadding>
                {groupItems.map((item) => {
                  const active = item.id === activeId;
                  const Icon = item.icon;
                  return (
                    <Tooltip key={item.id} title={collapsed ? item.label : ''} placement="right">
                      <ListItemButton
                        data-testid={`member-nav-${item.id}`}
                        aria-current={active ? 'page' : undefined}
                        aria-label={collapsed ? item.label : undefined}
                        selected={active}
                        onClick={() => onNavigate(item.to)}
                        sx={{
                          borderRadius: 2,
                          mb: 0.4,
                          py: 0.9,
                          minHeight: MEMBER_SIDEBAR_LAYOUT.touchTarget,
                          px: collapsed ? 1 : 1.25,
                          justifyContent: collapsed ? 'center' : 'flex-start',
                          borderLeft:
                            active && !collapsed
                              ? `3px solid ${item.accentColor}`
                              : '3px solid transparent',
                          '&.Mui-selected': {
                            bgcolor: `${item.accentColor}12`,
                            color: item.accentColor,
                            '&:hover': { bgcolor: `${item.accentColor}1c` },
                          },
                          '&:hover': { bgcolor: '#f8fafc' },
                        }}
                      >
                        <ListItemIcon
                          sx={{
                            minWidth: collapsed ? 0 : 32,
                            justifyContent: 'center',
                            color: active ? item.accentColor : '#64748b',
                          }}
                        >
                          <Icon fontSize="small" />
                        </ListItemIcon>
                        {!collapsed && (
                          <ListItemText
                            primary={item.label}
                            primaryTypographyProps={{
                              fontSize: '0.84rem',
                              fontWeight: active ? 800 : 600,
                              color: active ? item.accentColor : '#334155',
                              noWrap: true,
                            }}
                          />
                        )}
                      </ListItemButton>
                    </Tooltip>
                  );
                })}
              </List>

              {collapsed && !isLastGroup && <Divider sx={{ my: 1 }} />}
            </Box>
          );
        })}
      </Box>
    </Paper>
  );
};

export default MemberAreaSidebar;
