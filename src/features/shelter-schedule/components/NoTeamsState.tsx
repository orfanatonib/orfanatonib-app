import { Box, Typography } from "@mui/material";
import { Block } from "@mui/icons-material";

export default function NoTeamsState() {
    return (
        <Box
            sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                p: 4,
                textAlign: "center",
                bgcolor: "background.paper",
                borderRadius: 2,
                border: "1px dashed",
                borderColor: "divider",
                minHeight: 300,
            }}
        >
            <Box
                sx={{
                    width: 64,
                    height: 64,
                    borderRadius: "50%",
                    bgcolor: "action.hover",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    mb: 2,
                }}
            >
                <Block fontSize="large" color="disabled" />
            </Box>
            <Typography variant="h6" gutterBottom color="text.primary">
                Nenhuma equipe vinculada
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 400 }}>
                Seu perfil não está relacionado a nenhuma equipe. Entre em contato com a liderança para ser vinculado a alguma equipe e começar a gerenciar agendamentos.
            </Typography>
        </Box>
    );
}
