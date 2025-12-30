import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Container,
  Paper,
  Grid,
  TextField,
  Button,
  Alert,
  Typography,
  Divider,
  Box,
  CircularProgress,
  Snackbar,
} from "@mui/material";
import { motion } from "framer-motion";
import BackHeader from "@/components/common/header/BackHeader";
import AddressFields from "./form/AddressFields";
import ShelterMediaForm from "./form/ShelterMediaForm";
import TeamManagementSection, { TeamManagementRef } from "./components/TeamManagementSection";
import { CreateShelterForm, EditShelterForm, TeamInputDto } from "./types";
import { useShelterMutations } from "./hooks";
import { apiFetchShelter } from "./api";

export default function ShelterFormPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id;

  const [formData, setFormData] = useState<CreateShelterForm | EditShelterForm | null>(null);
  const [initialLoading, setInitialLoading] = useState(isEdit);
  const [error, setError] = useState("");
  const [savedShelterId, setSavedShelterId] = useState<string | null>(id || null);
  const [successSnackbar, setSuccessSnackbar] = useState({ open: false, message: "" });
  const teamManagementRef = useRef<TeamManagementRef>(null);

  const [uploadType, setUploadType] = useState<"upload" | "link">("upload");
  const [url, setUrl] = useState("");
  const [file, setFile] = useState<File | null>(null);

  const {
    dialogLoading,
    dialogError,
    setDialogError,
    createShelter,
    updateShelter,
  } = useShelterMutations(async () => {
    const message = isEdit ? "Abrigo atualizado com sucesso!" : "Abrigo criado com sucesso!";
    setSuccessSnackbar({ open: true, message });
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    navigate("/adm/abrigos");
  });

  useEffect(() => {
    if (isEdit && id) {
      const loadShelter = async () => {
        try {
          setInitialLoading(true);
          const shelter = await apiFetchShelter(id);
          setSavedShelterId(shelter.id);
          setFormData({
            id: shelter.id,
            name: shelter.name,
            description: shelter.description || "",
            teamsQuantity: shelter.teamsQuantity || 1,
            address: shelter.address,
            mediaItem: shelter.mediaItem ? {
              title: shelter.mediaItem.title,
              description: shelter.mediaItem.description,
              uploadType: (shelter.mediaItem.uploadType.toUpperCase() === "LINK" ? "link" : "upload") as "upload" | "link",
              url: shelter.mediaItem.url,
              isLocalFile: shelter.mediaItem.isLocalFile,
            } : undefined,
            file: undefined,
          } as EditShelterForm);

          if (shelter.mediaItem) {
            setUploadType((shelter.mediaItem.uploadType.toUpperCase() === "LINK" ? "link" : "upload") as "upload" | "link");
            setUrl(shelter.mediaItem.url || "");
          }
        } catch (err: any) {
          setError(err?.response?.data?.message || "Erro ao carregar abrigo");
        } finally {
          setInitialLoading(false);
        }
      };
      loadShelter();
    } else {
      setFormData({
        name: "",
        description: "",
        teamsQuantity: 1,
        address: {
          street: "",
          district: "",
          city: "",
          state: "",
          postalCode: "",
        } as any,
        mediaItem: undefined,
        file: undefined,
      });
      setInitialLoading(false);
    }
  }, [id, isEdit]);

  const updateMediaItem = (newUrl?: string, newFile?: File | null) => {
    if (!formData) return;

    const mediaItem = (newUrl || newFile) ? {
      title: "Foto do Abrigo",
      description: "Imagem do abrigo",
      uploadType,
      url: uploadType === "link" ? (newUrl || url) : "",
    } : undefined;

    setFormData({
      ...formData,
      mediaItem,
      file: uploadType === "upload" ? (newFile !== undefined ? newFile || undefined : file || undefined) : undefined,
    } as any);
  };

  const handleRemoveExistingImage = () => {
    setUrl("");
    setFile(null);
    if (formData) {
      setFormData({
        ...formData,
        mediaItem: undefined,
        file: undefined,
      } as any);
    }
  };

  const convertTeamsToInputDto = (teams: any[]): TeamInputDto[] => {
    return teams.map((team) => ({
      numberTeam: team.numberTeam,
      description: team.description || undefined,
      leaderProfileIds: (team.leaders || []).map((l: any) => l.id).filter((id: string) => !!id),
      teacherProfileIds: (team.teachers || []).map((t: any) => t.id).filter((id: string) => !!id),
    }));
  };

  const handleSubmit = async () => {
    if (!formData) return;

    setError("");
    setDialogError("");

    if (!formData.teamsQuantity || formData.teamsQuantity < 1) {
      setError("A quantidade de equipes é obrigatória e deve ser maior que 0");
      return;
    }

    if (!formData.name?.trim()) {
      setError("O nome do abrigo é obrigatório");
      return;
    }

    if (!formData.address?.street?.trim() || 
        !formData.address?.district?.trim() || 
        !formData.address?.city?.trim() || 
        !formData.address?.state?.trim() || 
        !formData.address?.postalCode?.trim()) {
      setError("All address fields are required (except number and complement)");
      return;
    }

    try {
      const { file, ...rest } = formData as any;

      const teamsData = teamManagementRef.current?.getCurrentTeams() || [];
      const teamsInput = convertTeamsToInputDto(teamsData);

      if (isEdit && id) {
        const payload: any = {
          name: rest.name,
          description: rest.description,
          teamsQuantity: rest.teamsQuantity,
          address: rest.address,
          teams: teamsInput,
        };

        if (file) {
          const formDataObj = new FormData();
          const shelterData = {
            name: payload.name,
            description: payload.description,
            teamsQuantity: payload.teamsQuantity,
            address: payload.address,
            teams: payload.teams,
            mediaItem: {
              title: rest.mediaItem?.title || "Foto do Abrigo",
              description: rest.mediaItem?.description || "Imagem do abrigo",
              uploadType: "upload",
            }
          };
          formDataObj.append('shelterData', JSON.stringify(shelterData));
          formDataObj.append('image', file);
          await updateShelter(id, formDataObj);
        } else if (rest.mediaItem && !rest.mediaItem.id) {
          payload.mediaItem = {
            title: rest.mediaItem.title || "Foto do Abrigo",
            description: rest.mediaItem.description || "Imagem do abrigo",
            url: rest.mediaItem.url,
            uploadType: "link",
          };
          await updateShelter(id, payload);
        } else {
          await updateShelter(id, payload);
        }
      } else {
        const payload: any = {
          name: rest.name,
          description: rest.description,
          teamsQuantity: rest.teamsQuantity,
          address: rest.address,
        };

        if (teamsInput && teamsInput.length > 0) {
          payload.teams = teamsInput;
        }

        if (file) {
          const formDataObj = new FormData();
          const shelterData = {
            name: payload.name,
            description: payload.description,
            teamsQuantity: payload.teamsQuantity,
            address: payload.address,
            teams: payload.teams,
            mediaItem: {
              uploadType: "upload",
              isLocalFile: true,
              fieldKey: "image",
              title: rest.mediaItem?.title || "Foto do Abrigo",
              description: rest.mediaItem?.description || "Imagem do abrigo",
            }
          };
          formDataObj.append('shelterData', JSON.stringify(shelterData));
          formDataObj.append('image', file);
          await createShelter(formDataObj);
        } else if (rest.mediaItem?.url) {
          payload.mediaItem = {
            uploadType: "link",
            isLocalFile: false,
            url: rest.mediaItem.url,
            title: rest.mediaItem.title || "Foto do Abrigo",
            description: rest.mediaItem.description || "Imagem do abrigo",
          };
          await createShelter(payload);
        } else {
          await createShelter(payload);
        }
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || dialogError || "Erro ao salvar abrigo");
    }
  };

  const handleCancel = () => {
    navigate("/adm/abrigos");
  };

  if (initialLoading) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            py: 8,
          }}
        >
          <CircularProgress size={48} />
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            Carregando abrigo...
          </Typography>
        </Box>
      </Container>
    );
  }

  if (!formData) {
    return null;
  }

  const name = (formData as any).name ?? "";
  const description = (formData as any).description ?? "";
  const teamsQuantity = (formData as any).teamsQuantity ?? 1;

  return (
    <Box sx={{ width: "100%", py: { xs: 2, md: 4 } }}>
      <Container maxWidth={false} sx={{ px: { xs: 2, md: 4 } }}>
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <BackHeader title={isEdit ? "Editar Abrigo" : "Criar Abrigo"} />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <Grid container spacing={3}>
            <Grid item xs={12} lg={6}>
              <Paper
                elevation={2}
                sx={{
                  p: { xs: 2, md: 4 },
                  borderRadius: 2,
                  height: "100%",
                }}
              >
                {(error || dialogError) && (
                  <Alert severity="error" sx={{ mb: 3 }} onClose={() => { setError(""); setDialogError(""); }}>
                    {error || dialogError}
                  </Alert>
                )}

                <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                label="Nome do Abrigo"
                type="text"
                fullWidth
                value={name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value } as any)}
                placeholder="Ex: Abrigo Central 1"
                required
                error={!name.trim()}
                helperText={!name.trim() ? "O nome do abrigo é obrigatório" : ""}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                label="Descrição"
                type="text"
                fullWidth
                multiline
                rows={3}
                value={description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value } as any)}
                placeholder="Descrição do abrigo, missão, objetivos..."
              />
            </Grid>

            <Grid item xs={12}>
              <Divider sx={{ my: 1 }} />
              <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 2 }}>
                Endereço
              </Typography>
            </Grid>

            <AddressFields
              value={(formData as any).address ?? {}}
              onChange={(addr) => setFormData({ ...formData, address: addr } as any)}
            />

            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
            </Grid>

            <ShelterMediaForm
              uploadType={uploadType}
              setUploadType={setUploadType}
              url={url}
              setUrl={setUrl}
              file={file}
              setFile={setFile}
              existingImageUrl={formData.mediaItem?.url}
              onRemoveExistingImage={handleRemoveExistingImage}
              onUrlChange={(newUrl) => updateMediaItem(newUrl, undefined)}
              onFileChange={(newFile) => updateMediaItem(undefined, newFile)}
            />

            {dialogLoading && (
              <Grid item xs={12}>
                <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 2 }}>
                  <CircularProgress size={24} />
                  <Typography variant="body2" color="text.secondary">
                    {isEdit ? "Salvando alterações..." : "Criando abrigo..."}
                  </Typography>
                </Box>
              </Grid>
            )}

            <Grid item xs={12}>
              <Box
                sx={{
                  display: "flex",
                  gap: 2,
                  justifyContent: "flex-end",
                  mt: 2,
                  flexDirection: { xs: "column", sm: "row" },
                }}
              >
                <Button
                  variant="outlined"
                  onClick={handleCancel}
                  disabled={dialogLoading}
                  sx={{ minWidth: 120 }}
                >
                  Cancelar
                </Button>
                <Button
                  variant="contained"
                  onClick={handleSubmit}
                  disabled={dialogLoading}
                  sx={{ minWidth: 120 }}
                >
                  {isEdit ? "Salvar" : "Criar"}
                </Button>
              </Box>
            </Grid>
                </Grid>
              </Paper>
            </Grid>

            <Grid item xs={12} lg={6}>
              <Paper
                elevation={2}
                sx={{
                  p: { xs: 2, md: 4 },
                  borderRadius: 2,
                  height: "100%",
                }}
              >
                <Box sx={{ mb: 3 }}>
                  <TextField
                    label="Quantidade de Equipes"
                    type="number"
                    fullWidth
                    value={teamsQuantity}
                    onChange={(e) => {
                      const val = parseInt(e.target.value) || 1;
                      setFormData({ ...formData, teamsQuantity: val } as any);
                    }}
                    inputProps={{ min: 1, step: 1 }}
                    required
                    helperText="Número de equipes (obrigatório, mínimo: 1)"
                    error={!teamsQuantity || teamsQuantity < 1}
                  />
                </Box>
                
                <Divider sx={{ mb: 3 }} />
                
                <TeamManagementSection
                  ref={teamManagementRef}
                  shelterId={savedShelterId}
                  teamsQuantity={teamsQuantity}
                  onTeamsQuantityChange={(newQuantity) => {
                    setFormData(prev => prev ? { ...prev, teamsQuantity: newQuantity } as any : null);
                  }}
                />
              </Paper>
            </Grid>
          </Grid>
        </motion.div>
      </Container>

      <Snackbar
        open={successSnackbar.open}
        autoHideDuration={2000}
        onClose={() => setSuccessSnackbar({ open: false, message: "" })}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert 
          severity="success" 
          variant="filled" 
          onClose={() => setSuccessSnackbar({ open: false, message: "" })}
          sx={{ borderRadius: 2 }}
        >
          {successSnackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}

