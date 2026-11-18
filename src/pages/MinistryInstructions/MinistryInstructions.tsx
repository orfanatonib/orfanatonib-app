import React from 'react';
import { Stack } from '@mui/material';
import ScrollToTop from './components/ScrollToTop';
import ManualSection from './components/ManualSection';
import QuoteBox from './components/QuoteBox';
import { MANUAL_PRIMARY_COLOR, MANUAL_QUOTE } from './constants';
import { MANUAL_SECTIONS } from './manualSections';

/**
 * Manual do Membro. O título e a descrição vêm do cabeçalho da casca da Área do Membro;
 * aqui só entram as seções, cada uma num cartão padrão.
 */
const MinistryInstructions: React.FC = () => (
  <Stack data-testid="member-manual-page" spacing={{ xs: 2, md: 3 }}>
    <ScrollToTop />
    {MANUAL_SECTIONS.map(({ id, title, subtitle, variant, gradient, Content }) => (
      <ManualSection key={id} id={id} title={title} subtitle={subtitle} variant={variant} gradient={gradient}>
        <Content />
      </ManualSection>
    ))}
    <QuoteBox
      quote={MANUAL_QUOTE.TEXT}
      reference={MANUAL_QUOTE.REFERENCE}
      color={MANUAL_PRIMARY_COLOR}
      variant="light"
    />
  </Stack>
);

export default MinistryInstructions;
