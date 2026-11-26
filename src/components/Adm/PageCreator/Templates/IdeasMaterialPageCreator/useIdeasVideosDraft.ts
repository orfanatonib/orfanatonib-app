import { useEffect, useRef, useState } from 'react';
import { MediaItem, MediaType, MediaUploadType } from 'store/slices/types';
import { buildGeneratedVideoInfo, hasVideoDraftError } from './utils';

const emptyDraft = (): MediaItem => ({
  title: '',
  description: '',
  mediaType: MediaType.VIDEO,
  uploadType: MediaUploadType.UPLOAD,
  url: '',
});

interface Options {
  videos: MediaItem[];
  setVideos: (videos: MediaItem[]) => void;
  ideaTitle: string;
  onPendingChange: (pending: boolean) => void;
  shakeButton?: boolean;
}

/** Estado e ações do formulário de vídeo da ideia (rascunho, edição, exclusão com confirmação). */
export function useIdeasVideosDraft({ videos, setVideos, ideaTitle, onPendingChange, shakeButton }: Options) {
  const addButtonRef = useRef<HTMLButtonElement>(null);
  const [tempVideo, setTempVideo] = useState<MediaItem>(emptyDraft);
  const [fileName, setFileName] = useState('');
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [errors, setErrors] = useState({ url: false });
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<number | null>(null);

  useEffect(() => {
    if (shakeButton && addButtonRef.current) {
      addButtonRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [shakeButton]);

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    setTempVideo((prev) => ({ ...prev, url: URL.createObjectURL(file), file }));
    onPendingChange(true);
  };

  const resetForm = () => {
    setTempVideo(emptyDraft());
    setFileName('');
    setEditingIndex(null);
    setErrors({ url: false });
  };

  const handleAddOrUpdate = () => {
    const hasError = hasVideoDraftError(tempVideo);
    setErrors({ url: hasError });
    if (hasError) return;

    const number = editingIndex !== null ? editingIndex + 1 : videos.length + 1;
    const item = { ...tempVideo, ...buildGeneratedVideoInfo(ideaTitle, number) };
    setVideos(
      editingIndex !== null ? videos.map((vid, i) => (i === editingIndex ? item : vid)) : [...videos, item],
    );
    resetForm();
  };

  const handleEdit = (index: number) => {
    setTempVideo(videos[index]);
    setFileName(videos[index].file?.name || '');
    setEditingIndex(index);
  };

  const handleRemoveClick = (index: number) => {
    setItemToDelete(index);
    setOpenDeleteDialog(true);
  };

  const confirmRemove = () => {
    if (itemToDelete !== null) {
      setVideos(videos.filter((_, i) => i !== itemToDelete));
      setItemToDelete(null);
    }
    setOpenDeleteDialog(false);
  };

  return {
    addButtonRef,
    tempVideo,
    setTempVideo,
    fileName,
    editingIndex,
    errors,
    openDeleteDialog,
    setOpenDeleteDialog,
    handleUpload,
    handleAddOrUpdate,
    handleEdit,
    handleRemoveClick,
    confirmRemove,
  };
}
