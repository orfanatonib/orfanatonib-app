import { Box, Skeleton, Stack } from "@mui/material";
import {
  ROUTE_FALLBACK_BLOCKS,
  ROUTE_FALLBACK_LABEL,
  ROUTE_FALLBACK_TEST_ID,
} from "./constants";

/** Esqueleto mostrado enquanto o código da rota é baixado (fluido: sem largura fixa, cabe em 375px). */
export default function RouteFallback() {
  return (
    <Box
      role="status"
      aria-busy="true"
      aria-label={ROUTE_FALLBACK_LABEL}
      data-testid={ROUTE_FALLBACK_TEST_ID}
      sx={{ width: "100%", boxSizing: "border-box", px: 2, py: 3, maxWidth: 1200, mx: "auto" }}
    >
      <Stack spacing={2}>
        <Skeleton variant="text" width="60%" height={40} />
        {Array.from({ length: ROUTE_FALLBACK_BLOCKS }, (_, index) => (
          <Skeleton
            key={index}
            variant="rounded"
            height={96}
            sx={{ width: "100%" }}
          />
        ))}
      </Stack>
    </Box>
  );
}
