import { useState, useEffect } from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import api from "@/config/axiosConfig";
import { fetchRoutes } from "store/slices/route/routeSlice";
import { setIdeasData, IdeasPageData } from "store/slices/ideas/ideasSlice";
import { AppDispatch } from "store/slices";

interface UseIdeasPageOptions {
  idToFetch: string;
}

interface UseIdeasPageReturn {
  ideasPage: IdeasPageData | null;
  loading: boolean;
  error: string | null;
  isDeleting: boolean;
  deleteConfirmOpen: boolean;
  setDeleteConfirmOpen: (open: boolean) => void;
  handleDeletePage: () => Promise<void>;
  handleEdit: () => void;
  handleBack: () => void;
}

export function useIdeasPage({ idToFetch }: UseIdeasPageOptions): UseIdeasPageReturn {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [ideasPage, setIdeasPage] = useState<IdeasPageData | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const navigate = useNavigate();
  const dispatch: AppDispatch = useDispatch();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await api.get(`/ideas-pages/${idToFetch}`);
        setIdeasPage(response.data);
        dispatch(setIdeasData(response.data));
      } catch (err) {
        setError("Erro ao carregar a página de ideias. Tente novamente mais tarde.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [idToFetch, dispatch]);

  const handleDeletePage = async () => {
    try {
      if (!ideasPage?.id) return;
      setIsDeleting(true);
      await api.delete(`/ideas-pages/${ideasPage.id}`);
      await dispatch(fetchRoutes());
      navigate("/");
    } catch (err) {
      setError("Erro ao excluir a página. Tente novamente mais tarde.");
    } finally {
      setIsDeleting(false);
      setDeleteConfirmOpen(false);
    }
  };

  const handleEdit = () => {
    navigate("/adm/editar-pagina-ideias", { state: { fromTemplatePage: false } });
  };

  const handleBack = () => {
    navigate(-1);
  };

  return {
    ideasPage,
    loading,
    error,
    isDeleting,
    deleteConfirmOpen,
    setDeleteConfirmOpen,
    handleDeletePage,
    handleEdit,
    handleBack,
  };
}
