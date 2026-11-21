import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

import SelectPageTemplate from './SelectPageTemplate';
import { PAGE_CREATOR_TEST_IDS, PAGE_TEMPLATE_OPTIONS } from './constants';
import { PageTemplateType } from './types';

// Mock sub-creator components to keep unit test isolated
vi.mock('@/components/Adm/PageCreator/Templates/VideoPageCreator/VideoPageCreator', () => ({
  default: () => <div data-testid="mock-video-page-creator">Mock Video Creator</div>,
}));

vi.mock('@/components/Adm/PageCreator/Templates/ImagePageCreator/ImagePageCreator', () => ({
  default: () => <div data-testid="mock-photo-page-creator">Mock Photo Creator</div>,
}));

vi.mock('@/components/Adm/PageCreator/Templates/MeditationPageCreator/MeditationPageCreator', () => ({
  default: () => <div data-testid="mock-meditation-page-creator">Mock Meditation Creator</div>,
}));

vi.mock('@/components/Adm/PageCreator/Templates/VisitMaterialPageCreator/VisitMaterialPageCreator', () => ({
  default: () => <div data-testid="mock-visit-material-page-creator">Mock Visit Material Creator</div>,
}));

vi.mock('@/components/Adm/PageCreator/Templates/IdeasMaterialPageCreator/IdeasMaterialPageCreator', () => ({
  IdeasMaterialPageCreator: () => <div data-testid="mock-ideas-page-creator">Mock Ideas Creator</div>,
}));

const renderWithProviders = (ui: React.ReactElement) => {
  return render(
      <MemoryRouter initialEntries={['/adm/criar-pagina']}>
        <Routes>
          <Route path="/adm/criar-pagina">
            <Route index element={ui} />
            {PAGE_TEMPLATE_OPTIONS.map((option) => (
              <Route
                key={option.key}
                path={option.path}
                element={React.cloneElement(ui as React.ReactElement<{ templateKey?: PageTemplateType }>, { templateKey: option.key })}
              />
            ))}
          </Route>
        </Routes>
      </MemoryRouter>
  );
};

describe('SelectPageTemplate Component', () => {
  it('renders all page template cards in card mode with correct test IDs when no card is selected', () => {
    renderWithProviders(<SelectPageTemplate />);

    expect(screen.getByTestId(PAGE_CREATOR_TEST_IDS.CONTAINER)).toBeInTheDocument();
    expect(screen.getByTestId(PAGE_CREATOR_TEST_IDS.GRID)).toBeInTheDocument();

    PAGE_TEMPLATE_OPTIONS.forEach((option) => {
      expect(screen.getByTestId(option.testId)).toBeInTheDocument();
      expect(screen.getByText(option.title)).toBeInTheDocument();
    });
  });

  it('hides card mode selection grid and renders creation form with back arrow button when card is selected', () => {
    renderWithProviders(<SelectPageTemplate />);

    // Click on Visit Materials card
    const visitCard = screen.getByTestId('page-template-card-visit-materials');
    fireEvent.click(visitCard);

    // Grid should be hidden
    expect(screen.queryByTestId(PAGE_CREATOR_TEST_IDS.GRID)).not.toBeInTheDocument();

    // Creation page & back button should be visible
    expect(screen.getByTestId(PAGE_CREATOR_TEST_IDS.SELECTED_PREVIEW)).toBeInTheDocument();
    expect(screen.getByTestId(PAGE_CREATOR_TEST_IDS.BACK_BUTTON)).toBeInTheDocument();
    expect(screen.getByTestId('mock-visit-material-page-creator')).toBeInTheDocument();
  });

  it('navigates back to card mode selection grid when clicking the back arrow button', () => {
    renderWithProviders(<SelectPageTemplate />);

    // Select Meditation card
    const meditationCard = screen.getByTestId('page-template-card-meditation');
    fireEvent.click(meditationCard);

    expect(screen.getByTestId('mock-meditation-page-creator')).toBeInTheDocument();

    // Click back button
    const backBtn = screen.getByTestId(PAGE_CREATOR_TEST_IDS.BACK_BUTTON);
    fireEvent.click(backBtn);

    // Creation page should be removed and card grid should return
    expect(screen.queryByTestId('mock-meditation-page-creator')).not.toBeInTheDocument();
    expect(screen.getByTestId(PAGE_CREATOR_TEST_IDS.GRID)).toBeInTheDocument();
    expect(screen.getByTestId('page-creator-empty-selection-info')).toBeInTheDocument();
  });

  it('supports selecting photo gallery template and renders the gallery creator', () => {
    renderWithProviders(<SelectPageTemplate />);

    const photoCard = screen.getByTestId('page-template-card-gallery');
    fireEvent.click(photoCard);

    expect(screen.getByTestId('mock-photo-page-creator')).toBeInTheDocument();
  });
});
