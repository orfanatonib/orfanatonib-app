import { defineListScenarios } from "../support/content-pages-list";
import { createPage, deletePageApi } from "./support";

defineListScenarios({
  name: "Páginas de vídeos — listagem no servidor (UI ao vivo)",
  path: "/adm/paginas-videos",
  apiPath: "/video-pages",
  prefix: "video-pages",
  cardPrefix: "video-page-card-",
  titleTestId: (id) => `video-page-card-title-${id}`,
  visibilityTestId: (id) => `video-page-card-visibility-${id}`,
  table: "videos_pages",
  titleColumn: "name",
  searchColumns: ["name", "description"],
  hasPublicFilter: true,
  create: (request, token, title, isPublic) =>
    createPage(request, token, { title, isPublic, videos: [{ title: "Vídeo 1" }, { title: "Vídeo 2" }] }),
  remove: deletePageApi,
  chips: [
    { testId: (id) => `video-page-card-videos-${id}`, text: /^2 vídeos$/ },
    { testId: (id) => `video-page-card-created-${id}`, text: /^\d{2}\/\d{2}\/\d{4}$/ },
  ],
  viewTestId: (id) => `video-page-card-view-${id}`,
  viewModalTestId: "video-page-details",
  editTestId: (id) => `video-page-card-edit-${id}`,
  editUrl: /\/adm\/editar-pagina-videos\?id=/,
  deleteTestId: (id) => `video-page-card-delete-${id}`,
  deleteDialogTestId: "video-pages-delete-modal",
});
