import { ActivityIndicator, Pressable, StyleSheet, View, type PressableProps } from 'react-native';
import { useState, type ReactNode } from 'react';
import { Text } from '#/components/ui/text';

type ButtonProps = Omit<PressableProps, 'children'> & {
  children: ReactNode;
  loading?: boolean;
};

export function Button({
  children,
  loading = false,
  disabled = false,
  style,
  onHoverIn,
  onHoverOut,
  ...props
}: ButtonProps) {
  const [hovered, setHovered] = useState(false);
  const isDisabled = disabled || loading;

  return (
    <Pressable
      {...props}
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      disabled={isDisabled}
      onHoverIn={(event) => {
        setHovered(true);
        onHoverIn?.(event);
      }}
      onHoverOut={(event) => {
        setHovered(false);
        onHoverOut?.(event);
      }}
      style={(state) => [
        styles.button,
        hovered && styles.hovered,
        state.pressed && styles.active,
        isDisabled && styles.disabled,
        typeof style === 'function' ? style(state) : style,
      ]}
    >
      {loading ? (
        <View style={styles.loading}>
          <ActivityIndicator color="#d8f36a" size="small" />
        </View>
      ) : typeof children === 'string' ? (
        <Text name="propertyTourButton">{children}</Text>
      ) : (
        children
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 52,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#173d35',
  },
  hovered: {
    backgroundColor: '#245448',
  },
  active: {
    backgroundColor: '#102c26',
    transform: [{ scale: 0.98 }],
  },
  disabled: {
    opacity: 0.45,
  },
  loading: {
    minHeight: 24,
    justifyContent: 'center',
  },
});
