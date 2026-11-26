import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import HomeIcon from '@mui/icons-material/Home';
import PersonIcon from '@mui/icons-material/Person';
import SchoolIcon from '@mui/icons-material/School';
import type { SvgIconComponent } from '@mui/icons-material';

import { ShellUserMenuEntryId } from './shellNav';

export const SHELL_USER_MENU_ICONS: Record<ShellUserMenuEntryId, SvgIconComponent> = {
  [ShellUserMenuEntryId.MEMBER_AREA]: SchoolIcon,
  [ShellUserMenuEntryId.SHELTERED_AREA]: HomeIcon,
  [ShellUserMenuEntryId.ADMIN_AREA]: AdminPanelSettingsIcon,
  [ShellUserMenuEntryId.PROFILE]: PersonIcon,
};
