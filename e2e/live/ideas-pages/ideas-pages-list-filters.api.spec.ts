import { definePageListFilterScenarios } from "../support/page-list-scenarios";
import { createPage, deletePageApi } from "./support";

/** GET /ideas-pages: busca, período, ordenação e paginação aplicados no banco (API real; sempre privada). */
definePageListFilterScenarios({
  title: "Ideas Pages — filtros e paginação da lista (API ao vivo)",
  endpoint: "/ideas-pages",
  table: "ideas_pages",
  titleColumn: "title",
  childKey: "sections",
  hasPublic: false,
  anonymousRead: false,
  create: (request, token, input) =>
    createPage(request, token, {
      title: input.title,
      description: input.description,
      sections: [{ title: "S1" }],
    }),
  remove: deletePageApi,
});
