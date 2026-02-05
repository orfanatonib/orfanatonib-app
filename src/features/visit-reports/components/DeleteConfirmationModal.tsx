import React from "react";
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Typography,
    Box,
    CircularProgress,
} from "@mui/material";
import { WarningAmber as WarningIcon } from "@mui/icons-material";

interface DeleteConfirmationModalProps {
    open: boolean;
    onClose: () => void;
    onConfirm: () => void;
    loading?: boolean;
    title?: string;
    description?: string;
}

export default function DeleteConfirmationModal({
    open,
    onClose,
    onConfirm,
    loading = false,
    title = "Confirmar Exclusão",
    description = "Tem certeza que deseja excluir este item? Esta ação não pode ser desfeita.",
}: DeleteConfirmationModalProps) {
    return (
        <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
            <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'error.main' }}>
                <WarningIcon />
                {title}
            </DialogTitle>
            <DialogContent>
                <Typography variant="body1">
                    {description}
                </Typography>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose} color="inherit" disabled={loading}>
                    Cancelar
                </Button>
                <Button
                    onClick={onConfirm}
                    variant="contained"
                    color="error"
                    disabled={loading}
                    startIcon={loading ? <CircularProgress size={20} color="inherit" /> : null}
                >
                    {loading ? "Excluindo..." : "Excluir"}
                </Button>
            </DialogActions>
        </Dialog>
    );
}
