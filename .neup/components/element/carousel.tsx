import type { ReactNode } from 'react';
import {
  Dimensions,
  ScrollView,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

export type CarouselVariant = 'hero' | 'multiBrowse' | 'uncontained';

export type CarouselProps = {
  children: ReactNode;
  variant?: CarouselVariant;
  fullWidth?: boolean;
  fullPage?: boolean;
  itemWidth?: number;
  itemSpacing?: number;
  contentPadding?: number;
  pagingEnabled?: boolean;
  showsHorizontalScrollIndicator?: boolean;
  style?: StyleProp<ViewStyle>;
};

/** A platform-independent horizontal carousel for any kind of content. */
export function Carousel({
  children,
  variant = 'uncontained',
  fullWidth = true,
  fullPage = false,
  itemWidth,
  itemSpacing = 12,
  contentPadding = 16,
  pagingEnabled = variant === 'hero',
  showsHorizontalScrollIndicator = false,
  style,
}: CarouselProps) {
  const width = itemWidth ?? (variant === 'hero' ? Dimensions.get('window').width - 32 : 280);
  const items = Array.isArray(children) ? children : [children];

  return (
    <ScrollView
      horizontal
      pagingEnabled={pagingEnabled}
      showsHorizontalScrollIndicator={showsHorizontalScrollIndicator}
      contentContainerStyle={[styles.content, { paddingHorizontal: contentPadding, gap: itemSpacing }]}
      style={[fullWidth && styles.fullWidth, fullPage && styles.fullPage, style]}
    >
      {items.map((child, index) => (
        <View key={index} style={[styles.item, { width }]}>
          {child}
        </View>
      ))}
    </ScrollView>
  );
}

export function CarouselItem({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[styles.itemContent, style]}>{children}</View>;
}

export default Carousel;

const styles = StyleSheet.create({
  fullWidth: { width: '100%' },
  fullPage: { height: '100%' },
  content: { alignItems: 'stretch' },
  item: { flexShrink: 0 },
  itemContent: { flex: 1 },
});
