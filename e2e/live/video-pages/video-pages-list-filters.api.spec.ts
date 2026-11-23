import { definePageListFilterScenarios } from "../support/page-list-scenarios";
import { createPage, deletePageApi } from "./support";

/** GET /video-pages: busca, public, período, ordenação e paginação aplicados no banco (API real). */
definePageListFilterScenarios({
  title: "Video Pages — filtros e paginação da lista (API ao vivo)",
  endpoint: "/video-pages",
  table: "videos_pages",
  titleColumn: "name",
  childKey: "videos",
  hasPublic: true,
  anonymousRead: true,
  create: (request, token, input) =>
    createPage(request, token, {
      title: input.title,
      description: input.description,
      isPublic: input.isPublic,
      videos: [{ title: "Vídeo 1" }],
    }),
  remove: deletePageApi,
});
