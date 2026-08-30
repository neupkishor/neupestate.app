import { Text as NativeText, type TextProps as NativeTextProps, type TextStyle } from 'react-native';

import fonts from '$/fonts.json';
import { ThemeColor } from '$/theme';
import { useTheme } from '#/core/hooks/useTheme';

type FontDefinition = {
  name: string;
  file: string;
  size?: number;
  lineHeight?: number;
  weight?: number;
  isDefault?: boolean;
};

const fontDefinitions = fonts as FontDefinition[];

export type TextProps = NativeTextProps & {
  font?: string;
  size?: number;
  lineHeight?: number;
  color?: string;
  type?: string;
  themeColor?: ThemeColor;
};

export function Text({
  font: fontName,
  size,
  lineHeight,
  color,
  type,
  themeColor,
  style,
  ...props
}: TextProps) {
  const theme = useTheme();

  const font =
    fontDefinitions.find((item) => item.name === (fontName ?? type)) ??
    fontDefinitions.find((item) => item.isDefault) ??
    fontDefinitions[0];

  return (
    <NativeText
      {...props}
      style={[
        {
          color: color ?? theme[themeColor ?? 'text'],
          fontFamily: font.file,
          fontSize: size ?? font.size,
          lineHeight: lineHeight ?? font.lineHeight,
          fontWeight: font.weight as TextStyle['fontWeight'],
        },
        style,
      ]}
    />
  );
}
