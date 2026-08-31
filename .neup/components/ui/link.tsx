import {
  Linking as NativeLinking,
  Pressable,
  type PressableProps,
} from 'react-native';
import { Link as RouterLink, type Href } from 'expo-router';
import type { ReactElement } from 'react';

type LinkProps = Omit<PressableProps, 'onPress' | 'children'> & {
  href: Href | string;
  onPress?: PressableProps['onPress'];
  asChild?: boolean;
  children?: ReactElement;
};

function isExternalHref(href: string) {
  return (
    !href.startsWith('/') &&
    !href.startsWith('./') &&
    !href.startsWith('../')
  );
}

export function Link({
  href,
  onPress,
  children,
  asChild = false,
  ...props
}: LinkProps) {
  const hrefValue =
    typeof href === 'string'
      ? href
      : String(href);

  if (!isExternalHref(hrefValue)) {
    if (asChild) {
      return <RouterLink href={href as Href} asChild>{children}</RouterLink>;
    }

    return (
      <RouterLink
        href={href as Href}
        asChild
      >
        <Pressable
          {...props}
          accessibilityRole="link"
          onPress={onPress}
        >
          {children}
        </Pressable>
      </RouterLink>
    );
  }

  return (
    <Pressable
      {...props}
      accessibilityRole="link"
      onPress={(event) => {
        onPress?.(event);

        if (!event.defaultPrevented) {
          void NativeLinking.openURL(hrefValue);
        }
      }}
    >
      {children}
    </Pressable>
  );
}
