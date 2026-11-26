import { Box, Stack, Typography } from "@mui/material";

import type { ContentReviewCommentResponse } from "../types";
import { formatContentStudioDateTime } from "../utils";

const TEXT_SX = { whiteSpace: "pre-wrap", overflowWrap: "anywhere" } as const;

interface ReviewCommentBodyProps {
  comment: ContentReviewCommentResponse;
  /** Versão a que a observação se refere; omitida quando a tela não a mostra. */
  versionLabel?: number | string;
  /** Quem lê chama o recado da produção de um jeito ("Seu recado" para a produção, "Resposta da produção" para o revisor). */
  replyLabel: string;
}

/** Uma observação do revisor, com o recado da produção logo abaixo (quando houve). */
export function ReviewCommentBody({ comment, versionLabel, replyLabel }: ReviewCommentBodyProps) {
  return (
    <Stack spacing={0.5}>
      <Typography variant="body2" sx={TEXT_SX}>
        {comment.message}
      </Typography>
      <Typography variant="caption" color="text.secondary">
        {versionLabel !== undefined ? `Versão ${versionLabel} · ` : ""}
        {formatContentStudioDateTime(comment.createdAt)}
      </Typography>
      {comment.resolutionMessage && (
        <Box sx={{ borderLeft: 3, borderColor: "success.main", pl: 1.5, mt: 0.5 }}>
          <Typography variant="caption" color="text.secondary" fontWeight={700}>
            {replyLabel}
            {comment.resolvedAt ? ` · ${formatContentStudioDateTime(comment.resolvedAt)}` : ""}
          </Typography>
          <Typography variant="body2" sx={TEXT_SX}>
            {comment.resolutionMessage}
          </Typography>
        </Box>
      )}
    </Stack>
  );
}
