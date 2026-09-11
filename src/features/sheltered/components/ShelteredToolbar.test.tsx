import React from "react";
import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import ShelteredToolbar from "./ShelteredToolbar";
import { SHELTERED_FILTERS_EMPTY, SHELTERED_TESTID } from "../constants";
import { ShelteredGender } from "../enums";
import type { ShelteredFilters } from "../types";

type RenderOptions = {
  filters?: ShelteredFilters;
  isXs?: boolean;
};

const renderToolbar = ({ filters = SHELTERED_FILTERS_EMPTY, isXs }: RenderOptions = {}) => {
  const onChange = vi.fn();
  const onCreateClick = vi.fn();
  const onRefreshClick = vi.fn();

  render(
    <ShelteredToolbar
      filters={filters}
      onChange={onChange}
      onCreateClick={onCreateClick}
      onRefreshClick={onRefreshClick}
      isXs={isXs}
    />,
  );

  return { onChange, onCreateClick, onRefreshClick };
};

/** Runs the updater the toolbar hands to onChange, as the manager would. */
const applyUpdater = (
  onChange: ReturnType<typeof vi.fn>,
  previous: ShelteredFilters,
): ShelteredFilters => {
  const updater = onChange.mock.calls.at(-1)?.[0] as (
    current: ShelteredFilters,
  ) => ShelteredFilters;
  return updater(previous);
};

describe("ShelteredToolbar", () => {
  it("exposes a stable testid for the toolbar and every filter", () => {
    renderToolbar();

    expect(screen.getByTestId(SHELTERED_TESTID.TOOLBAR)).toBeInTheDocument();
    expect(screen.getByTestId("sheltered-filter-search")).toBeInTheDocument();
    expect(screen.getByTestId("sheltered-filter-shelter")).toBeInTheDocument();
    expect(screen.getByTestId("sheltered-filter-address")).toBeInTheDocument();
    expect(screen.getByTestId("sheltered-filter-gender")).toBeInTheDocument();
    expect(screen.getByTestId("sheltered-filter-birth-date")).toBeInTheDocument();
    expect(screen.getByTestId("sheltered-filter-joined-at")).toBeInTheDocument();
  });

  it("updates searchString, which is the field the API actually accepts", () => {
    const { onChange } = renderToolbar();

    const input = screen.getByLabelText("Busca Geral");
    fireEvent.change(input, { target: { value: "Maria" } });

    expect(applyUpdater(onChange, SHELTERED_FILTERS_EMPTY)).toMatchObject({
      searchString: "Maria",
    });
  });

  it("clears a single text filter through its clear button", () => {
    const filters: ShelteredFilters = {
      ...SHELTERED_FILTERS_EMPTY,
      searchString: "Maria",
    };
    const { onChange } = renderToolbar({ filters });

    fireEvent.click(screen.getByTestId("sheltered-filter-search-clear"));

    expect(applyUpdater(onChange, filters).searchString).toBe("");
  });

  it("hides the clear-all action while no filter is active", () => {
    renderToolbar();

    expect(screen.queryByTestId("sheltered-clear-filters")).not.toBeInTheDocument();
  });

  it("resets every filter when clear-all is pressed", () => {
    const filters: ShelteredFilters = {
      ...SHELTERED_FILTERS_EMPTY,
      searchString: "Maria",
      gender: ShelteredGender.FEMALE,
    };
    const { onChange } = renderToolbar({ filters });

    fireEvent.click(screen.getByTestId("sheltered-clear-filters"));

    expect(applyUpdater(onChange, filters)).toEqual(SHELTERED_FILTERS_EMPTY);
  });

  it("delegates the create and refresh actions", () => {
    const { onCreateClick, onRefreshClick } = renderToolbar();

    fireEvent.click(screen.getByTestId("sheltered-create"));
    fireEvent.click(screen.getByTestId("sheltered-refresh"));

    expect(onCreateClick).toHaveBeenCalledTimes(1);
    expect(onRefreshClick).toHaveBeenCalledTimes(1);
  });

  it("swaps the desktop actions for reachable FABs on phones", () => {
    renderToolbar({ isXs: true });

    expect(screen.getByTestId("sheltered-create-fab")).toBeInTheDocument();
    expect(screen.getByTestId("sheltered-refresh-fab")).toBeInTheDocument();
    expect(screen.getByTestId("sheltered-clear-filters-fab")).toBeInTheDocument();
    expect(screen.queryByTestId("sheltered-create")).not.toBeInTheDocument();
  });
});
