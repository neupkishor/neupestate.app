import { AppPressable as Pressable } from '@/components/element/touch-feedback';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Image, ScrollView, StyleSheet, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import logica from '@neup/logica';
import { getStoredProperty } from '@neup/core/database/estate';
import { Text } from '@neup/components/ui/text';
import { PageHeader } from '@/components/element/page-header';
import theme from '@base/theme.json';

type GalleryProperty = { images?: unknown[] };

function imageUri(value: unknown): string {
  if (typeof value === 'string') return value;
  if (!value || typeof value !== 'object') return '';
  const image = value as { uri?: unknown; url?: unknown; src?: unknown };
  return imageUri(image.uri ?? image.url ?? image.src);
}

export default function PropertyGallery() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [property, setProperty] = useState<GalleryProperty | null>(null);
  const [loading, setLoading] = useState(true);
  const images = useMemo(() => Array.isArray(property?.images) ? property.images.map(imageUri).filter(Boolean) : [], [property]);

  useEffect(() => {
    let mounted = true;
    if (!id) return;
    void logica.estate.property(String(id)).get()
      .then((response) => {
        if (mounted && response.ok && response.body?.property) setProperty(response.body.property);
        else if (mounted) setProperty(getStoredProperty(String(id)) as GalleryProperty | null);
      })
      .catch(() => {
        if (mounted) setProperty(getStoredProperty(String(id)) as GalleryProperty | null);
      })
      .finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, [id]);

  const openViewer = (index: number) => router.push(`/property/${id}/viewer?imageIndex=${index}`);

  return (
    <View style={styles.page}>
      <StatusBar style="dark" />
      <PageHeader onBack={() => router.back()} backLabel="Back to property" />
      <Text name="title" style={{ marginHorizontal: theme.spacing.space20, marginBottom: theme.spacing.space12 }}>Property photos</Text>
      {loading ? (
        <View style={styles.center}><ActivityIndicator size="small" color="#173d35" /></View>
      ) : images.length === 0 ? (
        <View style={styles.center}><Text name="regular">No photos available.</Text></View>
      ) : (
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <Pressable onPress={() => openViewer(0)} accessibilityLabel="Open first photo full screen">
            <Image source={{ uri: images[0] }} resizeMode="cover" style={styles.heroImage} />
            <View style={styles.photoCount}><Text name="caption" color="#ffffff">1 / {images.length}</Text></View>
          </Pressable>
          <View style={styles.grid}>
            {images.slice(1).map((uri, index) => (
              <Pressable key={`${uri}-${index}`} onPress={() => openViewer(index + 1)} style={styles.gridItem} accessibilityLabel={`Open photo ${index + 2} full screen`}>
                <Image source={{ uri }} resizeMode="cover" style={styles.gridImage} />
              </Pressable>
            ))}
          </View>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: '#ffffff' },
  header: { paddingHorizontal: theme.spacing.space20, paddingTop: theme.spacing.space20, paddingBottom: theme.spacing.space16, flexDirection: 'row', alignItems: 'center', gap: theme.spacing.space14 },
  backButton: { width: 34, height: 40, justifyContent: 'center' },
  headerTitle: { flex: 1, textAlign: 'center' },
  headerSpacer: { width: 34 },
  content: { padding: theme.spacing.space16, paddingTop: theme.spacing.space12, paddingBottom: theme.spacing.space28 },
  heroImage: { width: '100%', height: 280, borderRadius: 16, backgroundColor: '#dfe7e3' },
  photoCount: { position: 'absolute', right: 12, bottom: 12, paddingHorizontal: theme.spacing.space10, paddingVertical: theme.spacing.space5, borderRadius: 16, backgroundColor: 'rgba(23,61,53,0.78)' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.space8, marginTop: theme.spacing.space8 },
  gridItem: { width: '48.8%', height: 160 },
  gridImage: { width: '100%', height: '100%', borderRadius: 12, backgroundColor: '#dfe7e3' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
