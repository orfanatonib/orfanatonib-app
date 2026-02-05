import React from "react";
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Typography,
    CircularProgress,
    Stack,
    useMediaQuery,
    useTheme,
} from "@mui/material";
import { WarningAmberRounded as WarningIcon, DeleteForeverRounded as DeleteIcon } from "@mui/icons-material";

interface DeleteConfirmationModalProps {
    open: boolean;
    onClose: () => void;
    onConfirm: () => void;
    loading?: boolean;
    title?: string;
    description?: React.ReactNode;
}

export default function DeleteConfirmationModal({
    open,
    onClose,
    onConfirm,
    loading = false,
    title = "Atenção! Ação Irreversível",
    description = "Tem certeza que deseja excluir este item? Esta ação não pode ser desfeita.",
}: DeleteConfirmationModalProps) {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

    const fs = {
        title: { xs: "0.95rem", sm: "1.05rem" },
        btn: { xs: "0.95rem", sm: "1rem" },
    } as const;

    return (
        <Dialog
            open={open}
            onClose={loading ? undefined : onClose}
            maxWidth="xs"
            fullWidth
            PaperProps={{
                sx: {
                    borderRadius: 3,
                    m: isMobile ? 2 : 4,
                },
            }}
        >
            <DialogTitle
                sx={{
                    bgcolor: (t) => t.palette.error.main,
                    color: (t) => t.palette.error.contrastText,
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                    py: 2,
                    px: 2
                }}
            >
                <WarningIcon fontSize="small" />
                <Typography
                    component="span"
                    fontWeight={900}
                    sx={{ fontSize: fs.title, px: 0 }}
                >
                    {title}
                </Typography>
            </DialogTitle>
            <DialogContent sx={{ pt: 3, pb: 1.5 }}>
                 <Typography variant="body1" sx={{ mt: 3 }}>
                    {description}
                </Typography>
                <Typography
                    sx={{
                        color: "error.main",
                        fontWeight: 700,
                        fontSize: { xs: "0.8rem", sm: "0.9rem" },
                        mt: 1.25
                    }}
                >
                    Esta operação não pode ser desfeita. Todos os dados relacionados serão perdidos para sempre.
                </Typography>
            </DialogContent>
            <DialogActions sx={{ px: 2, pb: 2 }}>
                {isMobile ? (
                    <Stack spacing={1} width="100%">
                        <Button
                            onClick={onConfirm}
                            color="error"
                            variant="contained"
                            startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <DeleteIcon fontSize="small" />}
                            disabled={loading}
                            fullWidth
                            size="large"
                            sx={{ fontWeight: 800, fontSize: fs.btn, py: 1.1 }}
                        >
                            {loading ? "Excluindo..." : "Excluir"}
                        </Button>
                        <Button
                            onClick={onClose}
                            disabled={loading}
                            fullWidth
                            size="large"
                            variant="outlined"
                            sx={{ fontSize: fs.btn, py: 1.1 }}
                        >
                            Cancelar
                        </Button>
                    </Stack>
                ) : (
                    <>
                        <Button
                            onClick={onClose}
                            disabled={loading}
                            sx={{ fontSize: fs.btn }}
                        >
                            Cancelar
                        </Button>
                        <Button
                            onClick={onConfirm}
                            color="error"
                            variant="contained"
                            startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <DeleteIcon fontSize="small" />}
                            disabled={loading}
                            sx={{ fontWeight: 700, fontSize: fs.btn }}
                        >
                            {loading ? "Excluindo..." : "Excluir"}
                        </Button>
                    </>
                )}
            </DialogActions>
        </Dialog>
    );
}
