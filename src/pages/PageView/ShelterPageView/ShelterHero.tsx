import React from 'react';
import { Box, Container, IconButton, Typography } from '@mui/material';
import { ArrowBack as ArrowBackIcon } from '@mui/icons-material';
import { motion } from 'framer-motion';

type Props = {
  name: string;
  description?: string | null;
  heroImageSrc: string;
  onBack: () => void;
};

export default function ShelterHero({ name, description, heroImageSrc, onBack }: Props) {
  return (
    <Box className="shelterPage__hero">
      <img className="shelterPage__heroImg" src={heroImageSrc} alt={name} />
      <div className="shelterPage__heroOverlay" />

      <Container maxWidth="lg" className="shelterPage__heroTop">
        <IconButton aria-label="Voltar" onClick={onBack} className="shelterPage__backBtn">
          <ArrowBackIcon className="shelterPage__backIcon" />
        </IconButton>
      </Container>

      <Container maxWidth="lg" className="shelterPage__heroBottom">
        <motion.div
          className="shelterPage__heroContent"
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
        >
          <Typography variant="h2" className="shelterPage__heroTitle">
            {name}
          </Typography>

          {description ? (
            <Typography variant="h6" className="shelterPage__heroDesc">
              {description}
            </Typography>
          ) : null}
        </motion.div>
      </Container>
    </Box>
  );
}
