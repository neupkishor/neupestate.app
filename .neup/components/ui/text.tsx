import {
  Text as NativeText,
  type TextProps as NativeTextProps,
} from 'react-native';

import typographyJson from '$/typography.json';
import outfitFonts from '$/fonts/outfitfonts';
import { type ThemeColor } from '$/theme';
import { useTheme } from '#/core/hooks/useTheme';

type TypographyDefinition = {
  location: string;
  color?: string;
  size?: number;
  lineHeight?: number;
  letterSpacing?: number;
};

type TypographyConfig =
  | Record<string, TypographyDefinition>
  | Array<Record<string, TypographyDefinition>>;

const typographyDefinitions = (
  Array.isArray(typographyJson)
    ? typographyJson[0]
    : typographyJson
) as Record<string, TypographyDefinition>;

const registeredFontFamilies = new Set<string>(
  Object.values(outfitFonts).map(String),
);

function resolveFontFamily(location: string): string | undefined {
  const fileName = location.split('/').pop() ?? location;

  const registeredName = fileName.endsWith('.ttf')
    ? fileName
    : `${fileName}.ttf`;

  return registeredFontFamilies.has(registeredName)
    ? registeredName
    : undefined;
}

export type TextProps = NativeTextProps & {
  name?: string;
  size?: number;
  lineHeight?: number;
  color?: string;
  themeColor?: ThemeColor;
};

export function Text({
  name,
  size,
  lineHeight,
  color,
  themeColor,
  style,
  ...props
}: TextProps) {
  const theme = useTheme();

  const defaultTypography =
    typographyDefinitions.default ??
    Object.values(typographyDefinitions)[0];

  const selectedTypography =
    (name ? typographyDefinitions[name] : undefined) ??
    defaultTypography;

  if (!selectedTypography) {
    return <NativeText {...props} style={style} />;
  }

  const fontFamily = resolveFontFamily(selectedTypography.location);

  return (
    <NativeText
      {...props}
      style={[
        {
          ...(fontFamily ? { fontFamily } : {}),
          color: color ?? selectedTypography.color ?? theme[themeColor ?? 'text'],
          fontSize: size ?? selectedTypography.size,
          lineHeight: lineHeight ?? selectedTypography.lineHeight,
          letterSpacing: selectedTypography.letterSpacing,
        },
        style,
      ]}
    />
  );
}
