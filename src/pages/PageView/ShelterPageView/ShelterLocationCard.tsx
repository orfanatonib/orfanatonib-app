// src/pages/shelters/components/ShelterLocationCard.tsx
import React from 'react';
import { Card, CardContent, Grid, Typography } from '@mui/material';
import {
  LocalPostOfficeOutlined,
  LocationCityOutlined,
  MapOutlined,
  PlaceOutlined,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import type { AddressResponseDto } from '@/features/shelters/types';

type Props = { address: AddressResponseDto };

export default function ShelterLocationCard({ address }: Props) {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
      <Card className="shelterPage__card shelterPage__card--orange shelterPage__card--withTopBar" elevation={4}>
        <CardContent className="shelterPage__cardPad">
          <div className="shelterPage__sectionHeader shelterPage__sectionHeader--orange">
            <div className="shelterPage__sectionIconBox shelterPage__sectionIconBox--orange">
              <PlaceOutlined className="shelterPage__sectionIcon" />
            </div>
            <Typography variant="h5" className="shelterPage__sectionTitle shelterPage__sectionTitle--orange">
              Localização
            </Typography>
          </div>

          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <div className="shelterPage__infoRow">
                <MapOutlined className="shelterPage__infoIcon shelterPage__infoIcon--orange" />
                <div className="shelterPage__infoBlock">
                  <Typography variant="caption" className="shelterPage__label">
                    Rua
                  </Typography>
                  <Typography variant="body1" className="shelterPage__value">
                    {address.street}
                    {address.number ? `, ${address.number}` : ''}
                  </Typography>
                </div>
              </div>
            </Grid>

            <Grid item xs={12} sm={6}>
              <div className="shelterPage__infoRow">
                <LocationCityOutlined className="shelterPage__infoIcon shelterPage__infoIcon--orange" />
                <div className="shelterPage__infoBlock">
                  <Typography variant="caption" className="shelterPage__label">
                    Bairro
                  </Typography>
                  <Typography variant="body1" className="shelterPage__value">
                    {address.district}
                  </Typography>
                </div>
              </div>
            </Grid>

            <Grid item xs={12} sm={6}>
              <div className="shelterPage__infoRow">
                <LocationCityOutlined className="shelterPage__infoIcon shelterPage__infoIcon--orange" />
                <div className="shelterPage__infoBlock">
                  <Typography variant="caption" className="shelterPage__label">
                    Cidade / Estado
                  </Typography>
                  <Typography variant="body1" className="shelterPage__value">
                    {address.city} - {address.state}
                  </Typography>
                </div>
              </div>
            </Grid>

            <Grid item xs={12} sm={6}>
              <div className="shelterPage__infoRow">
                <LocalPostOfficeOutlined className="shelterPage__infoIcon shelterPage__infoIcon--orange" />
                <div className="shelterPage__infoBlock">
                  <Typography variant="caption" className="shelterPage__label">
                    CEP
                  </Typography>
                  <Typography variant="body1" className="shelterPage__value">
                    {address.postalCode}
                  </Typography>
                </div>
              </div>
            </Grid>

            {address.complement ? (
              <Grid item xs={12}>
                <div className="shelterPage__complement">
                  <Typography variant="caption" className="shelterPage__label">
                    Complemento
                  </Typography>
                  <Typography variant="body1" className="shelterPage__value">
                    {address.complement}
                  </Typography>
                </div>
              </Grid>
            ) : null}
          </Grid>
        </CardContent>
      </Card>
    </motion.div>
  );
}
