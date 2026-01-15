export const gradients = {
  primary: {
    main: 'linear-gradient(135deg, #000000 0%, #FFFF00 100%)',
    diagonal: 'linear-gradient(45deg, #000000 30%, #FFFF00 90%)',
    horizontal: 'linear-gradient(90deg, #000000, #FFFF00)',
    vertical: 'linear-gradient(180deg, #000000, #FFFF00)',
  },

  secondary: {
    main: 'linear-gradient(135deg, #009933 0%, #FFFF00 100%)',
    diagonal: 'linear-gradient(45deg, #009933 30%, #FFFF00 90%)',
    horizontal: 'linear-gradient(90deg, #009933, #FFFF00)',
    vertical: 'linear-gradient(180deg, #009933, #FFFF00)',
  },

  accent: {
    main: 'linear-gradient(135deg, #FF0000 0%, #FFFF00 100%)',
    diagonal: 'linear-gradient(45deg, #FF0000 30%, #FFFF00 90%)',
    horizontal: 'linear-gradient(90deg, #FF0000, #FFFF00)',
    vertical: 'linear-gradient(180deg, #FF0000, #FFFF00)',
  },

  special: {
    full: 'linear-gradient(135deg, #000000 0%, #009933 25%, #FFFF00 50%, #FF0000 75%, #FFFFFF 100%)',
    banner: 'linear-gradient(135deg, #1a5f2e 0%, #009933 30%, #2ecc71 60%, #f1c40f 85%, #f9e79f 100%)',
    cta: 'linear-gradient(45deg, #009933 30%, #FFFF00 70%, #FF0000 100%)',
  },

  subtle: {
    blackWhite: 'linear-gradient(135deg, #000000 0%, #FFFFFF 100%)',
    greenWhite: 'linear-gradient(135deg, #009933 0%, #FFFFFF 100%)',
    greenWhiteSoft: 'linear-gradient(135deg, #E8F5E9 0%, #FFFFFF 100%)',
    yellowWhite: 'linear-gradient(135deg, #FFFF00 0%, #FFFFFF 100%)',
    greenWhiteDiagonal: 'linear-gradient(45deg, #009933 30%, #FFFFFF 90%)',
    greenWhiteHorizontal: 'linear-gradient(90deg, #009933, #FFFFFF)',
  },

  header: {
    main: 'linear-gradient(135deg, #009933 0%, #FFFF00 50%, #009933 100%)',
    diagonal: 'linear-gradient(45deg, #009933 0%, #FFFF00 30%, #009933 70%, #FFFF00 100%)',
    radial: 'radial-gradient(circle at center, #009933 0%, #FFFF00 50%, #009933 100%)',
    rainbow: 'linear-gradient(135deg, #009933 0%, #FFFF00 25%, #FF0000 50%, #FFFF00 75%, #009933 100%)',
    greenGold: 'linear-gradient(135deg, #2ecc71 0%, #27ae60 50%, #f1c40f 100%)',
  },

  text: {
    primary: 'linear-gradient(45deg, #000000 30%, #FFFF00 90%)',
    secondary: 'linear-gradient(45deg, #009933 30%, #FFFF00 90%)',
    accent: 'linear-gradient(45deg, #FF0000 30%, #FFFF00 90%)',
  },
} as const;

export const applyTextGradient = (gradient: string) => ({
  background: gradient,
  backgroundClip: 'text',
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
});

export const applyGradientWithShadow = (gradient: string, shadowColor = 'rgba(0,0,0,0.3)') => ({
  background: gradient,
  boxShadow: `0 4px 8px ${shadowColor}`,
});

export type GradientKey = keyof typeof gradients;
export type GradientVariant = 'main' | 'diagonal' | 'horizontal' | 'vertical';
export type SpecialGradientKey = keyof typeof gradients.special;
export type SubtleGradientKey = keyof typeof gradients.subtle;
export type TextGradientKey = keyof typeof gradients.text;
