import { defineListScenarios } from "../support/content-pages-list";
import { createPage, deletePageApi, png } from "./support";

defineListScenarios({
  name: "Páginas de ideias — listagem no servidor (UI ao vivo)",
  path: "/adm/paginas-ideias",
  apiPath: "/ideas-pages",
  prefix: "ideas-pages",
  cardPrefix: "ideas-page-card-",
  titleTestId: (id) => `ideas-page-card-title-${id}`,
  table: "ideas_pages",
  titleColumn: "title",
  searchColumns: ["title", "subtitle", "description"],
  hasPublicFilter: false,
  create: (request, token, title) =>
    createPage(request, token, {
      title,
      sections: [
        { title: "Seção A", medias: [{ title: "Imagem A", file: png("a.png") }] },
        { title: "Seção B", medias: [] },
      ],
    }),
  remove: deletePageApi,
  chips: [
    { testId: (id) => `ideas-page-card-sections-${id}`, text: /^2 seções$/ },
    { testId: (id) => `ideas-page-card-medias-${id}`, text: /^1 mídia$/ },
    { testId: (id) => `ideas-page-card-created-${id}`, text: /^\d{2}\/\d{2}\/\d{4}$/ },
  ],
  viewTestId: (id) => `ideas-page-card-view-${id}`,
  viewModalTestId: "ideas-page-details-modal",
  deleteTestId: (id) => `ideas-page-card-delete-${id}`,
  deleteDialogTestId: "ideas-pages-delete-dialog",
});
