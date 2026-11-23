import { definePageListFilterScenarios } from "../support/page-list-scenarios";
import { createPage, deletePageApi } from "./support";

/** GET /image-pages: busca, public, período, ordenação e paginação aplicados no banco (API real). */
definePageListFilterScenarios({
  title: "Image Pages — filtros e paginação da lista (API ao vivo)",
  endpoint: "/image-pages",
  table: "image_pages",
  titleColumn: "name",
  childKey: "sections",
  hasPublic: true,
  anonymousRead: true,
  create: (request, token, input) =>
    createPage(request, token, {
      title: input.title,
      description: input.description,
      isPublic: input.isPublic,
      sections: [{ caption: `${input.title}-sec`, media: [{ title: "Foto" }] }],
    }),
  remove: deletePageApi,
});
