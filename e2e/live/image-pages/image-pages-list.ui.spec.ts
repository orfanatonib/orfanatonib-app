import { defineListScenarios } from "../support/content-pages-list";
import { createPage, deletePageApi } from "./support";

defineListScenarios({
  name: "Galerias de imagens — listagem no servidor (UI ao vivo)",
  path: "/adm/paginas-fotos",
  apiPath: "/image-pages",
  prefix: "image-pages",
  cardPrefix: "image-page-card-",
  titleTestId: (id) => `image-page-title-${id}`,
  visibilityTestId: (id) => `image-page-visibility-${id}`,
  table: "image_pages",
  titleColumn: "name",
  searchColumns: ["name", "description"],
  hasPublicFilter: true,
  create: (request, token, title, isPublic) =>
    createPage(request, token, {
      title,
      isPublic,
      sections: [1, 2].map((n) => ({ caption: `${title}-sec${n}`, media: [{ title: `Foto ${n}` }] })),
    }),
  remove: deletePageApi,
  chips: [
    { testId: (id) => `image-page-sections-${id}`, text: /^2 seções$/ },
    { testId: (id) => `image-page-photos-${id}`, text: /^2 fotos$/ },
    { testId: (id) => `image-page-created-${id}`, text: /^\d{2}\/\d{2}\/\d{4}$/ },
  ],
  viewTestId: (id) => `image-page-details-${id}`,
  viewModalTestId: "image-page-details-modal",
  editTestId: (id) => `image-page-edit-${id}`,
  editUrl: /\/adm\/editar-pagina-imagens$/,
  deleteTestId: (id) => `image-page-delete-${id}`,
  deleteDialogTestId: "image-page-delete-dialog",
});
