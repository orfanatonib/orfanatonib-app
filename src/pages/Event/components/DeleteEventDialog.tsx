import React from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Typography,
    Button
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import { motion } from 'framer-motion';

interface DeleteEventDialogProps {
    open: boolean;
    onClose: () => void;
    onConfirm: () => void;
}

const DeleteEventDialog: React.FC<DeleteEventDialogProps> = ({ open, onClose, onConfirm }) => {
    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="xs"
            fullWidth
            sx={{
                '& .MuiDialog-paper': {
                    borderRadius: 4,
                    boxShadow: '0 20px 40px rgba(0,0,0,0.15)',
                    overflow: 'hidden',
                },
            }}
        >
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
            >
                <DialogTitle
                    sx={{
                        background: 'linear-gradient(135deg, #fef2f2 0%, #ffffff 100%)',
                        borderBottom: '1px solid #fee2e2',
                        py: 3,
                        textAlign: 'center',
                    }}
                >
                    <DeleteIcon sx={{ fontSize: 48, color: 'error.main', mb: 1 }} />
                    <Typography variant="h6" fontWeight={700} color="error.main">
                        Confirmar Exclusão
                    </Typography>
                </DialogTitle>
                <DialogContent sx={{ p: 4, textAlign: 'center' }}>
                    <Typography variant="body1" sx={{ mb: 2, color: '#6b7280' }}>
                        Tem certeza que deseja excluir este evento?
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Esta ação não pode ser desfeita.
                    </Typography>
                </DialogContent>
                <DialogActions sx={{ p: 3, gap: 2 }}>
                    <Button
                        onClick={onClose}
                        variant="outlined"
                        fullWidth
                        sx={{
                            borderRadius: 3,
                            py: 1.5,
                            fontWeight: 600,
                            textTransform: 'none',
                            borderColor: '#d1d5db',
                            color: '#6b7280',
                            '&:hover': {
                                borderColor: '#9ca3af',
                                backgroundColor: '#f9fafb',
                            },
                        }}
                    >
                        Cancelar
                    </Button>
                    <Button
                        onClick={onConfirm}
                        color="error"
                        variant="contained"
                        fullWidth
                        sx={{
                            borderRadius: 3,
                            py: 1.5,
                            fontWeight: 600,
                            textTransform: 'none',
                            background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                            boxShadow: '0 4px 14px rgba(239, 68, 68, 0.4)',
                            '&:hover': {
                                background: 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)',
                                boxShadow: '0 6px 20px rgba(239, 68, 68, 0.6)',
                                transform: 'translateY(-1px)',
                            },
                            transition: 'all 0.3s ease',
                        }}
                    >
                        Excluir Evento
                    </Button>
                </DialogActions>
            </motion.div>
        </Dialog>
    );
};

export default DeleteEventDialog;
