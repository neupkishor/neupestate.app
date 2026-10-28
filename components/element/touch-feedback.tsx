import { useState } from 'react';
import { Pressable, StyleSheet, View, type PressableProps, Platform } from 'react-native';

type TouchFeedbackProps = PressableProps & { activeOpacity?: number };

export function AppPressable({ activeOpacity = 0.9, style, android_ripple, onHoverIn, onHoverOut, children, ...props }: TouchFeedbackProps) {
  const [hovered, setHovered] = useState(false);
  return (
    <Pressable
      {...props}
      android_ripple={android_ripple ?? { color: '#173d3526', borderless: false, foreground: true }}
      onHoverIn={(event) => { setHovered(true); onHoverIn?.(event); }}
      onHoverOut={(event) => { setHovered(false); onHoverOut?.(event); }}
      style={(state) => [
        { overflow: 'hidden' },
        typeof style === 'function' ? style(state) : style,
        Platform.OS === 'ios' && state.pressed
          ? { opacity: Math.min(activeOpacity, 0.94), transform: [{ scale: 0.985 }] }
          : null,
      ]}
    >
      {(state) => <>
        {typeof children === 'function' ? children(state) : children}
        {(hovered || (Platform.OS === 'ios' && state.pressed)) ? <View pointerEvents="none" style={[StyleSheet.absoluteFill, state.pressed ? styles.pressedOverlay : styles.hoverOverlay]} /> : null}
      </>}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  hoverOverlay: { backgroundColor: 'rgba(23, 61, 53, 0.10)' },
  pressedOverlay: { backgroundColor: 'rgba(23, 61, 53, 0.16)' },
});
