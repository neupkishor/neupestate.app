import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { Extrapolation, interpolate, SharedValue, useAnimatedStyle } from 'react-native-reanimated';

const MAX_VISIBLE = 7;
const DOT = 6;
const PILL = 18;
const GAP = 0;

type Props = { count: number; activeIndex: number; scrollX: SharedValue<number>; width: number; onSelect: (index: number) => void };

export function ImagePagination({ count, activeIndex, scrollX, width, onSelect }: Props) {
  if (count < 2) return null;
  const visible = Math.min(MAX_VISIBLE, count);
  const start = Math.min(Math.max(activeIndex - Math.floor(visible / 2), 0), count - visible);
  return <View pointerEvents="box-none" style={styles.viewport}>
    <Pressable style={styles.counter} onPress={() => onSelect(activeIndex)}><Text style={styles.counterText}>{activeIndex + 1} / {count}</Text></Pressable>
  </View>;
}

function edgeSize(index: number, start: number, count: number, visible: number) {
  if (index === start && start > 0) return 3;
  if (index === start + 1 && start > 0) return 4.5;
  if (index === start + visible - 1 && start + visible < count) return 3;
  if (index === start + visible - 2 && start + visible < count) return 4.5;
  return DOT;
}

function Indicator({ index, scrollX, width, edgeSize, onPress }: { index: number; scrollX: SharedValue<number>; width: number; edgeSize: number; onPress: () => void }) {
  const style = useAnimatedStyle(() => {
    const progress = scrollX.value / Math.max(width, 1);
    const distance = Math.abs(progress - index);
    return { width: interpolate(distance, [0, 1], [PILL, edgeSize], Extrapolation.CLAMP), opacity: interpolate(distance, [0, 1], [1, 0.55], Extrapolation.CLAMP) };
  });
  return <Pressable style={styles.slot} onPress={onPress}><Animated.View style={[styles.dot, style]} /></Pressable>;
}

const styles = StyleSheet.create({
  viewport: { position: 'absolute', bottom: 24, left: 20, height: 18, minWidth: 18, overflow: 'visible' },
  track: { flexDirection: 'row', alignItems: 'center', gap: GAP },
  slot: { width: 11, height: 18, alignItems: 'center', justifyContent: 'center' },
  dot: { height: DOT, borderRadius: 999, backgroundColor: '#fff' },
  shadow: { position: 'absolute', top: -7, bottom: -7, left: -12, right: -12, borderRadius: 999, backgroundColor: 'rgba(0,0,0,0.18)' },
  counter: { minWidth: 48, height: 24, paddingHorizontal: 10, borderRadius: 999, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.28)' },
  counterText: { color: '#fff', fontSize: 12, fontWeight: '700' },
});
