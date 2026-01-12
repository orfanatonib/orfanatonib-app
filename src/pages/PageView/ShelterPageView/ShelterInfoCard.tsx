import React from 'react';
import { Card, CardContent, Divider, Typography } from '@mui/material';
import { motion } from 'framer-motion';

import { fmtDate } from '@/utils/dates';

type Props = { createdAt: string; updatedAt: string };

export default function ShelterInfoCard({ createdAt, updatedAt }: Props) {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: 0.16 }}>
      <Card className="shelterPage__card shelterPage__card--neutral" elevation={2}>
        <CardContent className="shelterPage__cardPadInfo">
          <Typography variant="subtitle2" className="shelterPage__infoTitle">
            Informações
          </Typography>

          <Divider className="shelterPage__divider" />

          <div className="shelterPage__infoBlock2">
            <Typography variant="caption" className="shelterPage__label">
              Criado em
            </Typography>
            <Typography variant="body2" className="shelterPage__valueSmall">
              {fmtDate(createdAt)}
            </Typography>
          </div>

          <div className="shelterPage__infoBlock2">
            <Typography variant="caption" className="shelterPage__label">
              Atualizado em
            </Typography>
            <Typography variant="body2" className="shelterPage__valueSmall">
              {fmtDate(updatedAt)}
            </Typography>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
