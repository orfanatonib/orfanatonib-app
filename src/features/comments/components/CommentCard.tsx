import React from "react";
import { Edit, Home, Place, Publish, Visibility } from "@mui/icons-material";
import AdminChipRow from "@/components/common/admin-shell/AdminChipRow";
import AdminEntityCard from "@/components/common/admin-shell/AdminEntityCard";
import { CommentData } from "store/slices/comment/commentsSlice";

type Props = {
  comment: CommentData;
  onView: (c: CommentData) => void;
  onEdit: (c: CommentData) => void;
  onAskPublish: (c: CommentData) => void;
  onAskDelete: (c: CommentData) => void;
};

const WITHOUT_ID = "without-id";

/** Cartão do depoimento: estado, autor, abrigo/bairro e as ações de moderação. */
export default function CommentCard({ comment, onView, onEdit, onAskPublish, onAskDelete }: Props) {
  const key = comment.id ?? WITHOUT_ID;
  const published = Boolean(comment.published);

  return (
    <AdminEntityCard
      testId={`comments-card-${key}`}
      title={comment.name || "Sem Nome"}
      titleTestId={`comments-card-title-${key}`}
      description={comment.comment || ""}
      visibility={{
        label: published ? "Publicado" : "Não Publicado",
        isPublic: published,
        testId: `comments-card-status-${key}`,
      }}
      meta={
        <AdminChipRow
          testId={`comments-card-chips-${key}`}
          chips={[
            { key: "shelter", label: comment.shelter, testId: `comments-card-shelter-${key}`, icon: <Home fontSize="small" /> },
            {
              key: "neighborhood",
              label: comment.neighborhood,
              testId: `comments-card-neighborhood-${key}`,
              icon: <Place fontSize="small" />,
            },
          ].filter((chip) => Boolean(chip.label))}
        />
      }
      onDelete={() => onAskDelete(comment)}
      deleteTestId={`comments-card-delete-${key}`}
      deleteLabel="Excluir comentário"
      actions={[
        {
          key: "view",
          label: "Detalhes",
          icon: <Visibility />,
          variant: "outlined",
          onClick: () => onView(comment),
          testId: `comments-card-view-${key}`,
        },
        {
          key: "edit",
          label: "Editar",
          icon: <Edit />,
          variant: "outlined",
          onClick: () => onEdit(comment),
          testId: `comments-card-edit-${key}`,
        },
        ...(published
          ? []
          : [
              {
                key: "publish",
                label: "Publicar",
                icon: <Publish />,
                onClick: () => onAskPublish(comment),
                testId: `comments-card-publish-${key}`,
              },
            ]),
      ]}
    />
  );
}
