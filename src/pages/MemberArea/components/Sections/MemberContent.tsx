import { Stack } from "@mui/material";
import CommentsSection from "./CommentsSection";
import MemberGuideCarousel from "./MemberGuideCarousel";

const MemberContent = () => (
  <Stack
    data-testid="member-area-content-sections"
    spacing={{ xs: 3, md: 3.5 }}
  >
    <MemberGuideCarousel />
    <CommentsSection />
  </Stack>
);
export default MemberContent;
