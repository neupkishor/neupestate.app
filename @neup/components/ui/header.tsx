import { useEffect, useRef } from 'react';
import { Animated, Platform, StyleSheet, View, type LayoutChangeEvent, type ReactNode, type StyleProp, type ViewStyle } from 'react-native';
import { BlurView } from 'expo-blur';
import theme from '@base/theme.json';

type HeaderContentProps = {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
};

// Render user supplied content in the expanded header that scrolls with its page.
export function HeaderStatic({ children, onHeightChange, style }: HeaderContentProps & { onHeightChange?: (height: number) => void }) {
  // Report the expanded header height so the floating header knows when to appear.
  function handleHeaderLayout(event: LayoutChangeEvent) {
    onHeightChange?.(event.nativeEvent.layout.height);
  }

  return <View onLayout={handleHeaderLayout} style={[styles.headerSticky, style]}>{children}</View>;
}

// Render user supplied content in the floating header after the expanded header scrolls away.
export function HeaderFloating({ children, scrollY, headerHeight, style }: HeaderContentProps & { scrollY: Animated.Value; headerHeight: number }) {
  const compactProgress = useRef(new Animated.Value(0)).current;
  const visibleState = useRef(false);
  const transition = useRef<Animated.CompositeAnimation | null>(null);

  // Animate the floating header as its scroll threshold is crossed.
  useEffect(() => {
    if (!headerHeight) return;
    const listenerId = scrollY.addListener(({ value }) => {
      const shouldShow = value >= headerHeight;
      if (shouldShow === visibleState.current) return;
      visibleState.current = shouldShow;
      transition.current?.stop();
      transition.current = Animated.timing(compactProgress, { toValue: shouldShow ? 1 : 0, duration: 200, useNativeDriver: false });
      transition.current.start();
    });
    return () => scrollY.removeListener(listenerId);
  }, [compactProgress, headerHeight, scrollY]);

  const translateY = compactProgress.interpolate({ inputRange: [0, 1], outputRange: [-110, 0] });
  const shadowOpacity = compactProgress.interpolate({ inputRange: [0, 1], outputRange: [0, Platform.OS === 'ios' ? 0.09 : 0.1] });
  const contentOpacity = compactProgress.interpolate({ inputRange: [0, 1], outputRange: [0.2, 1] });
  const contentTranslateY = compactProgress.interpolate({ inputRange: [0, 1], outputRange: [8, 0] });
  const blurOpacity = compactProgress.interpolate({ inputRange: [0, 1], outputRange: [1, 0] });

  return <Animated.View pointerEvents="box-none" style={[styles.headerFloating, style, { shadowOpacity, elevation: compactProgress.interpolate({ inputRange: [0, 1], outputRange: [0, Platform.OS === 'android' ? 4 : 2] }), transform: [{ translateY }] }]}>
    <View style={styles.floatingRow}>
      <Animated.View style={{ flex: 1, opacity: contentOpacity, transform: [{ translateY: contentTranslateY }] }}>{children}</Animated.View>
      <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, { opacity: blurOpacity }]}><BlurView intensity={22} tint="light" style={StyleSheet.absoluteFill} /></Animated.View>
    </View>
  </Animated.View>;
}

const styles = StyleSheet.create({
  headerSticky: { paddingTop: theme.spacing.space72, paddingHorizontal: theme.spacing.space20, paddingBottom: theme.spacing.space20 },
  headerFloating: { position: 'absolute', zIndex: 5, top: 0, left: 0, right: 0, minHeight: 96, paddingTop: theme.spacing.space20, paddingHorizontal: theme.spacing.space20, paddingBottom: theme.spacing.space1, backgroundColor: '#ffffff', borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#e5ebe7', shadowColor: '#173d35', shadowOffset: { width: 0, height: Platform.OS === 'ios' ? 2 : 3 }, shadowRadius: 5, justifyContent: 'flex-end' },
  floatingRow: { minHeight: 44, flexDirection: 'row', alignItems: 'center' },
});
