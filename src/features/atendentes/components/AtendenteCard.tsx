import { Box, Button, Stack } from "@mui/material";
import { Edit, PictureAsPdf, Schedule, Visibility, Link as LinkIcon } from "@mui/icons-material";
import { AdminEntityCard } from "@/components/common/admin-shell";
import type { AdminCardAction } from "@/components/common/admin-shell";
import AdminChipRow from "@/components/common/admin-shell/AdminChipRow";
import type { AdminChipRowItem } from "@/components/common/admin-shell/chipRow.types";
import { formatCreatedDate } from "@/components/common/admin-shell/dates";
import { ATENDENTES_LABELS, ATENDENTES_TEST_ID_PREFIX } from "../constants";
import type { AtendenteResponseDto, AtendentePdf, PdfScope } from "../types";
import { displayNameOf, linkLabelOf } from "../utils";

const P = ATENDENTES_TEST_ID_PREFIX;

interface Props {
  atendente: AtendenteResponseDto;
  onView: (atendente: AtendenteResponseDto) => void;
  onEdit: (atendente: AtendenteResponseDto) => void;
  onDelete: (atendente: AtendenteResponseDto) => void;
  onPreviewPdf: (atendente: AtendenteResponseDto, scope: PdfScope, pdf: AtendentePdf) => void;
}

/** Cartão do antecedente: vínculo, os dois PDFs (abrir a visualização direto do cartão) e as datas. */
export default function AtendenteCard({ atendente, onView, onEdit, onDelete, onPreviewPdf }: Props) {
  const id = atendente.id;
  const link = linkLabelOf(atendente);

  const chips: AdminChipRowItem[] = [];
  if (link) chips.push({ key: "link", label: link, testId: `${P}-card-link-${id}`, color: "info", icon: <LinkIcon /> });
  chips.push({
    key: "updated",
    label: `${ATENDENTES_LABELS.UPDATED_AT} ${formatCreatedDate(atendente.updatedAt)}`,
    testId: `${P}-card-updated-${id}`,
    icon: <Schedule />,
  });

  const pdfs: Array<{ scope: PdfScope; pdf?: AtendentePdf; label: string; missing: string }> = [
    { scope: "estadual", pdf: atendente.pdfEstadual, label: ATENDENTES_LABELS.ESTADUAL_PDF, missing: ATENDENTES_LABELS.NO_ESTADUAL },
    { scope: "federal", pdf: atendente.pdfFederal, label: ATENDENTES_LABELS.FEDERAL_PDF, missing: ATENDENTES_LABELS.NO_FEDERAL },
  ];

  const actions: AdminCardAction[] = [
    { key: "view", label: ATENDENTES_LABELS.VIEW, testId: `${P}-card-view-${id}`, icon: <Visibility />, variant: "outlined", onClick: () => onView(atendente) },
    { key: "edit", label: ATENDENTES_LABELS.EDIT, testId: `${P}-card-edit-${id}`, icon: <Edit />, onClick: () => onEdit(atendente) },
  ];

  return (
    <AdminEntityCard
      testId={`${P}-card-${id}`}
      title={displayNameOf(atendente)}
      titleTestId={`${P}-card-title-${id}`}
      onDelete={() => onDelete(atendente)}
      deleteTestId={`${P}-card-delete-${id}`}
      deleteLabel={ATENDENTES_LABELS.DELETE}
      meta={
        <Stack spacing={1}>
          <AdminChipRow testId={`${P}-card-chips-${id}`} chips={chips} />
          <Box sx={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 1 }}>
            {pdfs.map(({ scope, pdf, label, missing }) =>
              pdf?.url ? (
                <Button
                  key={scope}
                  data-testid={`${P}-card-pdf-${scope}-${id}`}
                  variant="outlined"
                  size="small"
                  startIcon={<PictureAsPdf />}
                  aria-label={`${ATENDENTES_LABELS.PREVIEW_PDF}: ${label}`}
                  onClick={() => onPreviewPdf(atendente, scope, pdf)}
                  sx={{ minHeight: 44, textTransform: "none" }}
                >
                  {label}
                </Button>
              ) : (
                <Button
                  key={scope}
                  data-testid={`${P}-card-pdf-${scope}-missing-${id}`}
                  variant="text"
                  size="small"
                  disabled
                  sx={{ minHeight: 44, textTransform: "none" }}
                >
                  {missing}
                </Button>
              )
            )}
          </Box>
        </Stack>
      }
      actions={actions}
    />
  );
}
