import React from "react";
import { Alert, Box, Button, Divider, Paper, TextField, Typography, CircularProgress, Grid } from "@mui/material";
import AddressFields from "./form/AddressFields";
import ShelterMediaForm from "./form/ShelterMediaForm";
import { useIsFeatureEnabled, FeatureFlagKeys } from "@/features/feature-flags";

type Props = {
  isEdit: boolean;
  name: string;
  description: string;
  address: any;

  existingImageUrl?: string;
  file: File | null;

  dialogLoading: boolean;
  error: string;

  onCloseError: () => void;

  onChangeName: (value: string) => void;
  onChangeDescription: (value: string) => void;
  onChangeAddress: (addr: any) => void;

  onChangeFile: (file: File | null) => void;
  onRemoveExistingImage: () => void;

  onCancel: () => void;
  onSubmit: () => void;
  showActions?: boolean;
};

export default function ShelterFormLeftPanel({
  isEdit,
  name,
  description,
  address,
  existingImageUrl,
  file,
  dialogLoading,
  error,
  onCloseError,
  onChangeName,
  onChangeDescription,
  onChangeAddress,
  onChangeFile,
  onRemoveExistingImage,
  onCancel,
  onSubmit,
  showActions = true,
}: Props) {
  const isAddressEnabled = useIsFeatureEnabled(FeatureFlagKeys.SHELTER_ADDRESS);

  return (
    <Paper elevation={2} className="shelterFormCard">
      {!!error && (
        <Alert severity="error" className="shelterFormCard__alert" onClose={onCloseError}>
          {error}
        </Alert>
      )}

      <div className="shelterFormCard__fields">
        <TextField
          label="Nome do Abrigo"
          type="text"
          fullWidth
          value={name}
          onChange={(e) => onChangeName(e.target.value)}
          placeholder="Ex: Abrigo Central 1"
          required
          error={!name.trim()}
          helperText={!name.trim() ? "O nome do abrigo é obrigatório" : ""}
        />

        <TextField
          label="Descrição"
          type="text"
          fullWidth
          multiline
          rows={3}
          value={description}
          onChange={(e) => onChangeDescription(e.target.value)}
          placeholder="Descrição do abrigo, missão, objetivos..."
        />

        {isAddressEnabled && (
          <>
            <Divider className="shelterFormCard__divider" />

            <Typography variant="subtitle1" fontWeight={700} className="shelterFormCard__sectionTitle">
              Endereço
            </Typography>

            <Box className="shelterFormAddress">
              <Grid container spacing={2}>
                <AddressFields value={address ?? {}} onChange={onChangeAddress} />
              </Grid>
            </Box>
          </>
        )}

        <Divider className="shelterFormCard__dividerLarge" />

        <ShelterMediaForm
          file={file}
          setFile={onChangeFile}
          existingImageUrl={existingImageUrl}
          onRemoveExistingImage={onRemoveExistingImage}
          onFileChange={onChangeFile}
        />

        {dialogLoading && (
          <Box className="shelterFormCard__loadingInline">
            <CircularProgress size={24} />
            <Typography variant="body2" color="text.secondary">
              {isEdit ? "Salvando alterações..." : "Criando abrigo..."}
            </Typography>
          </Box>
        )}

        {showActions && (
          <div className="shelterFormCard__actions">
            <Button variant="outlined" onClick={onCancel} disabled={dialogLoading} className="shelterFormBtn">
              Cancelar
            </Button>

            <Button variant="contained" onClick={onSubmit} disabled={dialogLoading} className="shelterFormBtn">
              {isEdit ? "Salvar" : "Criar"}
            </Button>
          </div>
        )}
      </div>
    </Paper>
  );
}
