import React, { useState } from "react";
import { Box, Chip, Button, Typography } from "@mui/material";
import { ExpandMore as ExpandMoreIcon, ExpandLess as ExpandLessIcon } from "@mui/icons-material";

type Item = {
  id: string;
  label: string;
  onDelete?: () => void;
  color?: "primary" | "secondary" | "default" | "error" | "info" | "success" | "warning";
  variant?: "filled" | "outlined";
};

type Props = {
  items: Item[];
  maxVisible?: number;
  emptyMessage?: string;
  showCount?: boolean;
};

const MAX_VISIBLE_DEFAULT = 5;

export default function ChipsListWithExpand({
  items,
  maxVisible = MAX_VISIBLE_DEFAULT,
  emptyMessage = "Nenhum item",
  showCount = false,
}: Props) {
  const [expanded, setExpanded] = useState(false);

  if (items.length === 0) {
    return (
      <Typography variant="caption" color="text.secondary">
        {emptyMessage}
      </Typography>
    );
  }

  const visibleItems = expanded ? items : items.slice(0, maxVisible);
  const hasMore = items.length > maxVisible;

  return (
    <Box>
      <Box
        sx={{
          display: "flex",
          flexWrap: "wrap",
          gap: 0.5,
          maxHeight: expanded ? 300 : 120,
          overflowY: expanded ? "auto" : "hidden",
          overflowX: "hidden",
          transition: "max-height 0.3s ease",
          pr: expanded ? 1 : 0,
          "&::-webkit-scrollbar": {
            width: "6px",
          },
          "&::-webkit-scrollbar-track": {
            background: "transparent",
          },
          "&::-webkit-scrollbar-thumb": {
            background: "rgba(0,0,0,0.2)",
            borderRadius: "3px",
            "&:hover": {
              background: "rgba(0,0,0,0.3)",
            },
          },
        }}
      >
        {visibleItems.map((item) => (
          <Chip
            key={item.id}
            label={item.label}
            size="small"
            onDelete={item.onDelete}
            color={item.color || "default"}
            variant={item.variant || "outlined"}
          />
        ))}
      </Box>
      {hasMore && (
        <Button
          size="small"
          onClick={() => setExpanded(!expanded)}
          sx={{ mt: 0.5, textTransform: "none" }}
          startIcon={expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
        >
          {expanded
            ? `Ver menos (${items.length - maxVisible} ocultos)`
            : `Ver mais (${items.length - maxVisible} mais)`}
        </Button>
      )}
      {showCount && items.length > 0 && !hasMore && (
        <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.5 }}>
          Total: {items.length}
        </Typography>
      )}
    </Box>
  );
}
