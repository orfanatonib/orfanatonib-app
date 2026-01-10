import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Alert, Button, CircularProgress, Container, Snackbar, Typography } from "@mui/material";
import { motion } from "framer-motion";

import BackHeader from "@/components/common/header/BackHeader";
import { CreateShelterForm, EditShelterForm, TeamInputDto } from "./types";
import { useShelterMutations } from "./hooks";
import { apiFetchShelter } from "./api";

import "./ShelterFormPage.css";
import ShelterFormLeftPanel from "./ShelterFormLeftPanel";
import ShelterFormRightPanel from "./ShelterFormRightPanel";
import { TeamManagementRef } from "./components/TeamManagementSection";

type SnackbarState = { open: boolean; message: string };

export default function ShelterFormPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id;

  const [formData, setFormData] = useState<CreateShelterForm | EditShelterForm | null>(null);
  const [initialLoading, setInitialLoading] = useState<boolean>(isEdit);
  const [error, setError] = useState<string>("");

  const [savedShelterId, setSavedShelterId] = useState<string | null>(id || null);

  const [file, setFile] = useState<File | null>(null);

  const [successSnackbar, setSuccessSnackbar] = useState<SnackbarState>({
    open: false,
    message: "",
  });

  const teamManagementRef = useRef<TeamManagementRef | null>(null);

  const {
    dialogLoading,
    dialogError,
    setDialogError,
    createShelter,
    updateShelter,
  } = useShelterMutations(async () => {
    const message = isEdit ? "Abrigo atualizado com sucesso!" : "Abrigo criado com sucesso!";
    setSuccessSnackbar({ open: true, message });

    await new Promise((resolve) => setTimeout(resolve, 2000));
    navigate("/adm/abrigos");
  });

  useEffect(() => {
    let isMounted = true;

    const load = async () => {
      try {
        setInitialLoading(true);

        if (isEdit && id) {
          const shelter = await apiFetchShelter(id);
          if (!isMounted) return;

          setSavedShelterId(shelter.id);

          setFormData({
            id: shelter.id,
            name: shelter.name,
            description: shelter.description || "",
            teamsQuantity: shelter.teamsQuantity || 1,
            address: shelter.address,

            mediaItem: shelter.mediaItem
              ? {
                title: shelter.mediaItem.title,
                description: shelter.mediaItem.description,
                url: shelter.mediaItem.url,
                isLocalFile: shelter.mediaItem.isLocalFile,
                uploadType: shelter.mediaItem.uploadType,
              }
              : undefined,
            file: undefined,
          } as EditShelterForm);

          setFile(null);
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
            },
            mediaItem: undefined,
            file: undefined,
          });

          setSavedShelterId(null);
          setFile(null);
        }
      } catch (err: any) {
        if (!isMounted) return;
        setError(err?.response?.data?.message || "Erro ao carregar abrigo");
      } finally {
        if (!isMounted) return;
        setInitialLoading(false);
      }
    };

    load();

    return () => {
      isMounted = false;
    };
  }, [id, isEdit]);

  const name = useMemo(() => (formData as any)?.name ?? "", [formData]);
  const description = useMemo(() => (formData as any)?.description ?? "", [formData]);
  const teamsQuantity = useMemo(() => (formData as any)?.teamsQuantity ?? 1, [formData]);

  const existingImageUrl = useMemo(() => formData?.mediaItem?.url, [formData]);

  const clearErrors = () => {
    setError("");
    setDialogError("");
  };

  const handleCancel = () => navigate("/adm/abrigos");

  const handleFileChange = (newFile: File | null) => {
    if (!formData) return;

    setFile(newFile);

    setFormData({
      ...formData,

      mediaItem: newFile
        ? { title: "Foto do Abrigo", description: "Imagem do abrigo", uploadType: "upload", url: "" }
        : formData.mediaItem,
      file: newFile || undefined,
    } as any);
  };

  const handleRemoveExistingImage = () => {

    setFile(null);

    if (!formData) return;

    setFormData({
      ...formData,
      mediaItem: undefined,
      file: undefined,
    } as any);
  };

  const convertTeamsToInputDto = (teams: any[]): TeamInputDto[] => {
    return teams.map((team) => ({
      numberTeam: team.numberTeam,
      description: team.description || undefined,
      leaderProfileIds: (team.leaders || []).map((l: any) => l.id).filter((x: string) => !!x),
      teacherProfileIds: (team.teachers || []).map((t: any) => t.id).filter((x: string) => !!x),
    }));
  };

  const validate = (): boolean => {
    if (!formData) return false;

    if (!formData.teamsQuantity || formData.teamsQuantity < 1) {
      setError("A quantidade de equipes é obrigatória e deve ser maior que 0");
      return false;
    }

    if (!formData.name?.trim()) {
      setError("O nome do abrigo é obrigatório");
      return false;
    }


    const hasAddressData = formData.address?.street || formData.address?.city ||
      formData.address?.state || formData.address?.postalCode;

    if (hasAddressData) {
      // If any address field has data, validate all required fields
      if (
        !formData.address?.street?.trim() ||
        !formData.address?.district?.trim() ||
        !formData.address?.city?.trim() ||
        !formData.address?.state?.trim() ||
        !formData.address?.postalCode?.trim()
      ) {
        setError("Todos os campos do endereço são obrigatórios (exceto número e complemento)");
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!formData) return;

    clearErrors();
    if (!validate()) return;

    try {
      const { file: _ignoredFile, ...rest } = formData as any;

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
            ...payload,
            mediaItem: {
              uploadType: "upload",
              isLocalFile: true,
              fieldKey: "image",
              title: rest.mediaItem?.title || "Foto do Abrigo",
              description: rest.mediaItem?.description || "Imagem do abrigo",
            },
          };

          formDataObj.append("shelterData", JSON.stringify(shelterData));
          formDataObj.append("image", file);

          await updateShelter(id, formDataObj);
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

        if (teamsInput.length > 0) payload.teams = teamsInput;

        if (file) {
          const formDataObj = new FormData();
          const shelterData = {
            ...payload,
            mediaItem: {
              uploadType: "upload",
              isLocalFile: true,
              fieldKey: "image",
              title: rest.mediaItem?.title || "Foto do Abrigo",
              description: rest.mediaItem?.description || "Imagem do abrigo",
            },
          };

          formDataObj.append("shelterData", JSON.stringify(shelterData));
          formDataObj.append("image", file);

          await createShelter(formDataObj);
        } else {
          await createShelter(payload);
        }
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || dialogError || "Erro ao salvar abrigo");
    }
  };

  if (initialLoading) {
    return (
      <Container maxWidth="md" className="shelterFormPage__loading">
        <div className="shelterFormPage__loadingInner">
          <CircularProgress size={48} />
          <Typography variant="body2" color="text.secondary" className="shelterFormPage__loadingText">
            Carregando abrigo...
          </Typography>
        </div>
      </Container>
    );
  }

  if (!formData) return null;

  return (
    <div className="shelterFormPage">
      <Container maxWidth={false} className="shelterFormPage__container">
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
          <div className="shelterFormPage__grid">
            <ShelterFormLeftPanel
              isEdit={isEdit}
              name={name}
              description={description}
              address={(formData as any).address ?? {}}
              existingImageUrl={existingImageUrl}
              file={file}
              dialogLoading={dialogLoading}
              error={error || dialogError}
              onCloseError={clearErrors}
              onChangeName={(v) => setFormData({ ...formData, name: v } as any)}
              onChangeDescription={(v) => setFormData({ ...formData, description: v } as any)}
              onChangeAddress={(addr) => setFormData({ ...formData, address: addr } as any)}
              onChangeFile={handleFileChange}
              onRemoveExistingImage={handleRemoveExistingImage}
              onCancel={handleCancel}
              onSubmit={handleSubmit}
              showActions={false}
            />

            <ShelterFormRightPanel
              savedShelterId={savedShelterId}
              teamsQuantity={teamsQuantity}
              onChangeTeamsQuantity={(q) => setFormData({ ...formData, teamsQuantity: q } as any)}
              teamManagementRef={teamManagementRef}
            />
          </div>
        </motion.div>
      </Container>

      <div className="shelterFormPage__bottomActions">
        <Container maxWidth={false} className="shelterFormPage__container">
          <div className="shelterFormPage__bottomInner">
            <Button variant="outlined" onClick={handleCancel} disabled={dialogLoading} className="shelterFormBtn">
              Cancelar
            </Button>

            <Button variant="contained" onClick={handleSubmit} disabled={dialogLoading} className="shelterFormBtn">
              {isEdit ? "Salvar" : "Criar"}
            </Button>
          </div>
        </Container>
      </div>

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
          className="shelterFormPage__snackbar"
        >
          {successSnackbar.message}
        </Alert>
      </Snackbar>
    </div>
  );
}
