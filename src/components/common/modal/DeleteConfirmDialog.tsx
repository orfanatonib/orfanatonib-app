import React from 'react';
import DeleteConfirmationModal from '@/components/Common/DeleteConfirmationModal';

interface Props {
    open: boolean;
    title?: string; // Item name in old component
    onClose: () => void;
    onConfirm: () => Promise<void> | void;
    loading?: boolean;
}

export default function DeleteConfirmDialog({
    open,
    title,
    onClose,
    onConfirm,
    loading = false,
}: Props) {
    return (
        <DeleteConfirmationModal
            open={open}
            onClose={onClose}
            onConfirm={onConfirm}
            loading={loading}
            description={
                <span>
                    Você está prestes a excluir permanentemente:
                    <br />
                    <strong>{title ?? "este item"}</strong>.
                </span>
            }
        />
    );
}
