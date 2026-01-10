import { useState } from "react";
import { useSelector } from "react-redux";
import { Box, Container, useTheme, alpha, Grid } from "@mui/material";
import { AnimatePresence } from "framer-motion";

import { RootState } from "store/slices";
import { UserRole } from "@/store/slices/auth/authSlice";
import DeleteConfirmDialog from "@/components/common/modal/DeleteConfirmDialog";

import { useIdeasPage, useExpandedMediaTypes } from "./hooks";
import { groupSectionMedias } from "./utils";
import {
  MediaSection,
  IdeasPageHeader,
  LoadingState,
  ErrorState,
  EmptyState,
} from "./components";

interface IdeasPageViewProps {
  idToFetch: string;
}

export default function IdeasPageView({ idToFetch }: IdeasPageViewProps) {
  const theme = useTheme();
  
  // Hooks
  const {
    ideasPage,
    loading,
    error,
    isDeleting,
    deleteConfirmOpen,
    setDeleteConfirmOpen,
    handleDeletePage,
    handleEdit,
    handleBack,
  } = useIdeasPage({ idToFetch });

  const { expandedMediaTypes, toggleMediaType } = useExpandedMediaTypes();
  
  // Estado para controlar qual seção está expandida (só uma por vez)
  const [expandedSectionId, setExpandedSectionId] = useState<string | null>(null);

  // Auth
  const { isAuthenticated, user } = useSelector((state: RootState) => state.auth);
  const isAdmin = isAuthenticated && user?.role === UserRole.ADMIN;

  // Toggle da seção - só uma por vez
  const handleToggleSection = (sectionId: string) => {
    setExpandedSectionId(prev => prev === sectionId ? null : sectionId);
  };

  // Loading state
  if (loading) {
    return <LoadingState />;
  }

  // Error state
  if (error) {
    return <ErrorState message={error} />;
  }

  // Empty state
  if (!ideasPage) {
    return <EmptyState />;
  }

  const { title, subtitle, description, sections } = ideasPage;

  return (
    <Box
      sx={{
        minHeight: "100vh",
        background: `linear-gradient(180deg, 
          ${alpha(theme.palette.warning.main, 0.03)} 0%, 
          ${alpha(theme.palette.background.default, 1)} 15%,
          ${alpha(theme.palette.background.default, 1)} 85%,
          ${alpha(theme.palette.primary.main, 0.03)} 100%
        )`,
        display: "flex",
        flexDirection: "column",
        position: "relative",
        "&::before": {
          content: '""',
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          height: "100%",
          background: `radial-gradient(ellipse at 100% 0%, ${alpha(theme.palette.warning.main, 0.05)} 0%, transparent 50%),
                       radial-gradient(ellipse at 0% 100%, ${alpha(theme.palette.primary.main, 0.05)} 0%, transparent 50%)`,
          pointerEvents: "none",
          zIndex: 0,
        },
      }}
    >
      {/* Header */}
      <IdeasPageHeader
        title={title}
        subtitle={subtitle}
        description={description}
        isAdmin={isAdmin}
        onBack={handleBack}
        onEdit={handleEdit}
        onDelete={() => setDeleteConfirmOpen(true)}
      />

      {/* Content */}
      <Box sx={{ flex: 1, py: { xs: 2, sm: 3, md: 5 }, position: "relative", zIndex: 1 }}>
        <Container maxWidth="xl" sx={{ px: { xs: 2, sm: 3 } }}>
          <Grid container spacing={{ xs: 2, sm: 3 }}>
            <AnimatePresence>
              {sections.map((section, sectionIndex) => {
                const { videos, documents, images } = groupSectionMedias(section.medias);

                return (
                  <Grid item xs={12} lg={6} key={section.id || sectionIndex}>
                    <MediaSection
                      sectionId={section.id || sectionIndex.toString()}
                      sectionIndex={sectionIndex}
                      title={section.title}
                      description={section.description}
                      videos={videos}
                      documents={documents}
                      images={images}
                      expandedMediaTypes={expandedMediaTypes}
                      onToggleMediaType={toggleMediaType}
                      user={section.user}
                      isExpanded={expandedSectionId === (section.id || sectionIndex.toString())}
                      onToggleSection={handleToggleSection}
                    />
                  </Grid>
                );
              })}
            </AnimatePresence>
          </Grid>
        </Container>
      </Box>

      {/* Delete Dialog */}
      <DeleteConfirmDialog
        open={deleteConfirmOpen}
        title={ideasPage.title}
        onClose={() => !isDeleting && setDeleteConfirmOpen(false)}
        onConfirm={async () => {
          if (isDeleting) return;
          await handleDeletePage();
        }}
        loading={isDeleting}
      />
    </Box>
  );
}
