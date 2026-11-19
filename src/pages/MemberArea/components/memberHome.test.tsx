import { configureStore } from "@reduxjs/toolkit";
import { Provider } from "react-redux";
import { MemoryRouter } from "react-router-dom";
import { fireEvent, render, screen, cleanup } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { UserRole } from "@/store/slices/auth/authSlice";
import { MediaTargetType } from "@/store/slices/types";
import MemberAreaHeader from "./Layout/MemberAreaHeader";
import MemberWeekBanner from "./Banners/MemberWeekBanner";
import IdeasSharingBanner from "./Banners/IdeasSharingBanner";
import MemberGuideCarousel from "./Sections/MemberGuideCarousel";
import { MEMBER_SUBPAGE_PATHS } from "../constants/navigation";
import { DEFAULT_FEATURE_FLAGS_MAP } from "@/features/feature-flags/constants";

// These presentation tests use a fixture store, without the application HTTP/session singleton.
vi.mock("@/config/axiosConfig", () => ({ default: {} }));

afterEach(cleanup);

describe("member home", () => {
  it("personalizes the header and keeps the existing profile destination", () => {
    const store = configureStore({
      reducer: {
        auth: () => ({
          user: {
            name: "Ana Silva",
            role: UserRole.MEMBER,
            memberProfile: { shelter: { name: "Abrigo Esperança" } },
          },
        }),
      },
    });
    render(
      <Provider store={store}>
        <MemoryRouter>
          <MemberAreaHeader />
        </MemoryRouter>
      </Provider>,
    );
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      "Olá, Ana!",
    );
    expect(screen.getByTestId("member-area-header-shelter")).toHaveTextContent(
      "Abrigo Esperança",
    );
    expect(screen.getByRole("link", { name: "Meu Perfil" })).toHaveAttribute(
      "href",
      "/perfil",
    );
  });

  it("supports a member without a loaded profile", () => {
    const store = configureStore({ reducer: { auth: () => ({ user: null }) } });
    render(
      <Provider store={store}>
        <MemoryRouter>
          <MemberAreaHeader />
        </MemoryRouter>
      </Provider>,
    );
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      "Olá, Membro!",
    );
    expect(
      screen.queryByTestId("member-area-header-shelter"),
    ).not.toBeInTheDocument();
  });

  it("opens the current material inside the member area", () => {
    const store = configureStore({
      reducer: {
        featureFlags: () => ({ flags: DEFAULT_FEATURE_FLAGS_MAP }),
        routes: () => ({
          routes: [
            {
              entityType: MediaTargetType.VisitMaterialsPage,
              current: false,
              idToFetch: "old",
              title: "Antigo",
            },
            {
              entityType: MediaTargetType.VisitMaterialsPage,
              current: true,
              idToFetch: "current-material",
              title: "O bom samaritano",
            },
          ],
          loading: false,
          error: null,
        }),
      },
    });
    render(
      <Provider store={store}>
        <MemoryRouter>
          <MemberWeekBanner />
        </MemoryRouter>
      </Provider>,
    );
    expect(screen.getByRole("heading")).toHaveTextContent("O bom samaritano");
    expect(screen.getByRole("link")).toHaveAttribute(
      "href",
      `${MEMBER_SUBPAGE_PATHS.materials}/current-material`,
    );
  });

  it("offers the materials library when there is no current material", () => {
    const store = configureStore({
      reducer: {
        featureFlags: () => ({ flags: DEFAULT_FEATURE_FLAGS_MAP }),
        routes: () => ({ routes: [], loading: false, error: null }),
      },
    });
    render(
      <Provider store={store}>
        <MemoryRouter>
          <MemberWeekBanner />
        </MemoryRouter>
      </Provider>,
    );
    expect(
      screen.getByRole("link", { name: "Explorar materiais" }),
    ).toHaveAttribute("href", MEMBER_SUBPAGE_PATHS.materials);
  });

  it("preserves idea submission navigation", () => {
    render(
      <MemoryRouter>
        <IdeasSharingBanner variant="compact" />
      </MemoryRouter>,
    );
    expect(
      screen.getByRole("link", { name: "Compartilhar ideia" }),
    ).toHaveAttribute("href", MEMBER_SUBPAGE_PATHS.shareIdea);
  });

  it("lets mobile readers reach every guide card and respects navigation bounds", () => {
    render(<MemberGuideCarousel />);
    const previous = screen.getByRole("button", {
      name: "Orientação anterior",
    });
    const next = screen.getByRole("button", { name: "Próxima orientação" });
    expect(previous).toBeDisabled();
    expect(screen.getByText("Objetivos da Área")).toBeVisible();
    fireEvent.click(next);
    expect(screen.getByText("Orientações Importantes")).toBeVisible();
    fireEvent.click(next);
    expect(screen.getByText("Dicas de Ouro")).toBeVisible();
    expect(next).toBeDisabled();
    fireEvent.click(previous);
    expect(screen.getByText("Orientações Importantes")).toBeVisible();
  });
});
