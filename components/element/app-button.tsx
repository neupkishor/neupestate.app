import type { ComponentProps } from 'react';
import { useState } from 'react';
import { Platform, StyleSheet, type PressableStateCallbackType } from 'react-native';
import { Button as NeupButton } from '@neup/components/ui/button';

type AppButtonProps = ComponentProps<typeof NeupButton>;

export function AppButton({ style, disabled, loading, variant = 'tinted', onHoverIn, onHoverOut, ...props }: AppButtonProps) {
  const [hovered, setHovered] = useState(false);
  const solidGreen = variant === 'solid' && (props.convey == null || props.convey === 'none');
  return <NeupButton
    {...props}
    disabled={disabled}
    loading={loading}
    variant={variant}
    onHoverIn={(event) => { setHovered(true); onHoverIn?.(event); }}
    onHoverOut={(event) => { setHovered(false); onHoverOut?.(event); }}
    style={(state: PressableStateCallbackType) => [
      typeof style === 'function' ? style(state) : style,
        hovered && !disabled && !loading
          ? solidGreen ? styles.solidHovered : variant === 'solid' ? null : styles.hovered
          : null,
        Platform.OS === 'ios' && state.pressed && !disabled && !loading
          ? solidGreen ? styles.solidPressed : variant === 'solid' ? styles.semanticPressed : styles.iosPressed
          : null,
    ]}
  />;
}

const styles = StyleSheet.create({
  hovered: { backgroundColor: '#eaf2e3' },
  iosPressed: { backgroundColor: '#dcebd7', transform: [{ scale: 0.985 }] },
  solidHovered: { backgroundColor: '#245448' },
  solidPressed: { backgroundColor: '#245448', transform: [{ scale: 0.985 }] },
  semanticPressed: { opacity: 0.88, transform: [{ scale: 0.985 }] },
});
