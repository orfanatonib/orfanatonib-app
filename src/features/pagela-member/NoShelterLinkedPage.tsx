import * as React from "react";
import {
  Box,
  Container,
  Paper,
  Typography,
  Stack,
  Button,
  Divider,
  Grid,
} from "@mui/material";
import LinkOffIcon from "@mui/icons-material/LinkOff";
import WhatsAppIcon from "@mui/icons-material/WhatsApp";
import PhoneIcon from "@mui/icons-material/Phone";

export type SupportContact = {
  personName: string;
  phoneE164: string; // ex: +5592999999999
  note?: string;
  whatsapp?: boolean;
};

export const SUPPORT_CONTACTS: SupportContact[] = [
  { personName: "Maria Silva", phoneE164: "+5592999999999", whatsapp: true },
  { personName: "João Souza", phoneE164: "+5592999999998", whatsapp: true },
];

const waLink = (phoneE164: string) => `https://wa.me/${phoneE164.replace(/[^\d]/g, "")}`;
const telLink = (phoneE164: string) => `tel:${phoneE164.replace(/[^\d+]/g, "")}`;

export default function NoShelterLinkedPage({
  contacts = SUPPORT_CONTACTS,
}: {
  contacts?: SupportContact[];
}) {
  return (
    <Box sx={{ minHeight: "70vh", display: "flex", alignItems: "center", py: { xs: 2, sm: 3 } }}>
      <Container maxWidth="md">
        <Paper
          elevation={2}
          sx={{
            p: { xs: 2, sm: 3.5 },
            borderRadius: 3,
            border: "1px solid",
            borderColor: "divider",
          }}
        >
          <Stack spacing={{ xs: 1.5, sm: 2 }} alignItems="center" textAlign="center">
            <Box
              sx={{
                width: { xs: 56, sm: 72 },
                height: { xs: 56, sm: 72 },
                borderRadius: "50%",
                bgcolor: "action.hover",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <LinkOffIcon sx={{ fontSize: { xs: 28, sm: 36 }, color: "text.secondary" }} />
            </Box>

            <Box>
              <Typography
                variant="h5"
                fontWeight={900}
                sx={{ mb: 0.5, fontSize: { xs: "1.15rem", sm: "1.5rem" } }}
              >
                Seu perfil ainda não está vinculado a um abrigo
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: "0.85rem", sm: "0.95rem" } }}>
                Para acessar a Área dos Abrigados, peça para a coordenação vincular seu perfil a uma equipe/abrigo.
              </Typography>
            </Box>

            <Divider flexItem />

            <Typography variant="subtitle1" fontWeight={800}>
              Contatos
            </Typography>

            <Grid container spacing={{ xs: 1, sm: 1.5 }} sx={{ width: "100%" }}>
              {contacts.map((c) => (
                <Grid key={`${c.personName}-${c.phoneE164}`} item xs={12} sm={6}>
                  <Paper
                    variant="outlined"
                    sx={{
                      p: { xs: 1.5, sm: 2 },
                      borderRadius: 2,
                      height: "100%",
                      display: "flex",
                      flexDirection: "column",
                      gap: 1,
                    }}
                  >
                    <Box sx={{ textAlign: "left" }}>
                      <Typography fontWeight={900} sx={{ lineHeight: 1.2 }}>
                        {c.personName}
                      </Typography>
                    </Box>

                    <Typography variant="body2" color="text.secondary" sx={{ wordBreak: "break-word", textAlign: "left" }}>
                      {c.phoneE164}
                      {c.note ? ` • ${c.note}` : ""}
                    </Typography>

                    <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
                      <Button
                        variant="outlined"
                        startIcon={<PhoneIcon />}
                        component="a"
                        href={telLink(c.phoneE164)}
                        sx={{ flex: 1, width: { xs: "100%", sm: "auto" } }}
                      >
                        Ligar
                      </Button>
                      <Button
                        variant="contained"
                        startIcon={<WhatsAppIcon />}
                        component="a"
                        href={waLink(c.phoneE164)}
                        target="_blank"
                        rel="noreferrer"
                        disabled={!c.whatsapp}
                        sx={{
                          flex: 1,
                          width: { xs: "100%", sm: "auto" },
                          bgcolor: "#25D366",
                          color: "white",
                          "&:hover": { bgcolor: "#1DA851" },
                          "&:disabled": {
                            bgcolor: "action.disabledBackground",
                            color: "action.disabled",
                          },
                        }}
                      >
                        WhatsApp
                      </Button>
                    </Stack>
                  </Paper>
                </Grid>
              ))}
            </Grid>
          </Stack>
        </Paper>
      </Container>
    </Box>
  );
}


