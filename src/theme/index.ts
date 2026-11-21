import { createTheme } from '@mui/material/styles';

import { themeComponents } from './components';
import { gradients } from './gradients';
import { palette } from './palette';
import { typography } from './typography';

export const theme = createTheme({ palette, typography, components: themeComponents });

export default theme;
export { gradients };
