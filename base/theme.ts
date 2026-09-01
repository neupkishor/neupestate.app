export const Colors = {
  light: { text: '#173d35' },
  dark: { text: '#ffffff' },
} as const;

export type ThemeColor = keyof typeof Colors.light;
