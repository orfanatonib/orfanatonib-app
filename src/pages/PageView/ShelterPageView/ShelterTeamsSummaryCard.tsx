// src/pages/shelters/components/ShelterTeamsSummaryCard.tsx
import React from 'react';
import { Card, CardContent, Typography } from '@mui/material';
import { GroupOutlined } from '@mui/icons-material';
import { motion } from 'framer-motion';

type Props = { teamsQuantity: number };

export default function ShelterTeamsSummaryCard({ teamsQuantity }: Props) {
  if (!teamsQuantity || teamsQuantity <= 0) return null;

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: 0.05 }}>
      <Card className="shelterPage__card shelterPage__card--orange shelterPage__card--hoverLift" elevation={4}>
        <CardContent className="shelterPage__cardPad">
          <div className="shelterPage__teamsHeader">
            <div className="shelterPage__sectionIconBox shelterPage__sectionIconBox--orange">
              <GroupOutlined className="shelterPage__sectionIcon" />
            </div>

            <div className="shelterPage__teamsText">
              <Typography variant="h5" className="shelterPage__sectionTitle shelterPage__sectionTitle--orange">
                Equipes do abrigo
              </Typography>

              <Typography variant="body1" className="shelterPage__teamsSubtitle">
                Este abrigo possui {teamsQuantity} equipe{teamsQuantity > 1 ? 's' : ''} ativa{teamsQuantity > 1 ? 's' : ''}
              </Typography>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
