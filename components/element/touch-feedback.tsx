import { Pressable, type PressableProps, Platform } from 'react-native';

type TouchFeedbackProps = PressableProps & { activeOpacity?: number };

export function AppPressable({ activeOpacity = 0.9, style, android_ripple, ...props }: TouchFeedbackProps) {
  return (
    <Pressable
      {...props}
      android_ripple={android_ripple ?? { color: '#173d3526', borderless: false, foreground: true }}
      style={(state) => [
        typeof style === 'function' ? style(state) : style,
        { overflow: 'hidden' },
        Platform.OS === 'ios' && state.pressed ? { opacity: activeOpacity } : null,
      ]}
    />
  );
}
