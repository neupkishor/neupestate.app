import { AppPressable as Pressable } from '@/components/element/touch-feedback';
import { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, Image, StyleSheet, View, useWindowDimensions } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import logica from '@neup/logica';
import { getStoredProperty } from '@neup/core/database/estate';
import { Text } from '@neup/components/ui/text';
import theme from '@base/theme.json';

type ViewerProperty = { images?: unknown[] };

function imageUri(value: unknown): string {
  if (typeof value === 'string') return value;
  if (!value || typeof value !== 'object') return '';
  const image = value as { uri?: unknown; url?: unknown; src?: unknown };
  return imageUri(image.uri ?? image.url ?? image.src);
}

export default function PropertyImageViewer() {
  const { id, imageIndex } = useLocalSearchParams<{ id: string; imageIndex?: string }>();
  const router = useRouter();
  const { width, height } = useWindowDimensions();
  const [property, setProperty] = useState<ViewerProperty | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);
  const viewerRef = useRef<FlatList<string>>(null);
  const images = useMemo(() => Array.isArray(property?.images) ? property.images.map(imageUri).filter(Boolean) : [], [property]);
  const requestedIndex = Number(Array.isArray(imageIndex) ? imageIndex[0] : imageIndex) || 0;
  useEffect(() => {
    let mounted = true;
    if (!id) return;
    void logica.estate.property(String(id)).get()
      .then((response) => {
        if (mounted && response.ok && response.body?.property) setProperty(response.body.property);
        else if (mounted) setProperty(getStoredProperty(String(id)) as ViewerProperty | null);
      })
      .catch(() => {
        if (mounted) setProperty(getStoredProperty(String(id)) as ViewerProperty | null);
      })
      .finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, [id]);

  useEffect(() => {
    if (loading || images.length === 0) return;
    const index = Math.max(0, Math.min(images.length - 1, requestedIndex));
    setActiveIndex(index);
    viewerRef.current?.scrollToIndex({ index, animated: false });
  }, [images.length, loading, requestedIndex]);

  return (
    <GestureHandlerRootView style={styles.root}>
      <StatusBar style="dark" />
      <View style={styles.viewer}>
        {loading ? (
          <ActivityIndicator size="small" color="#173d35" />
        ) : images.length === 0 ? (
          <View style={styles.empty}><Text name="regular" color="#173d35">No photos available.</Text></View>
        ) : (
          <FlatList
            ref={viewerRef}
            data={images}
            horizontal
            pagingEnabled
            directionalLockEnabled
            nestedScrollEnabled
            initialScrollIndex={Math.max(0, Math.min(images.length - 1, requestedIndex))}
            getItemLayout={(_, index) => ({ length: width, offset: width * index, index })}
            keyExtractor={(uri, index) => `${uri}-${index}`}
            onMomentumScrollEnd={(event) => {
              setActiveIndex(Math.round(event.nativeEvent.contentOffset.x / width));
            }}
            renderItem={({ item }) => <Image source={{ uri: item }} resizeMode="contain" style={{ width, height }} />}
            showsHorizontalScrollIndicator={false}
          />
        )}
        <View style={styles.controls}>
          <Pressable onPress={() => router.back()} style={styles.closeButton} accessibilityLabel="Close photo viewer">
            <Text name="title2" color="#173d35">×</Text>
          </Pressable>
          {!loading && images.length > 0 && (
            <View style={styles.counterToken}>
              <Text name="title3" color="#173d35">{activeIndex + 1} / {images.length}</Text>
            </View>
          )}
        </View>
      </View>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#ffffff' },
  viewer: { flex: 1, backgroundColor: '#ffffff', justifyContent: 'center' },
  controls: { position: 'absolute', top: 50, left: 20, right: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  closeButton: { width: 42, height: 42, borderRadius: 21, backgroundColor: '#e8ebed', alignItems: 'center', justifyContent: 'center' },
  counterToken: { minWidth: 42, height: 42, paddingHorizontal: theme.spacing.space12, borderRadius: 21, backgroundColor: '#e8ebed', alignItems: 'center', justifyContent: 'center' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
