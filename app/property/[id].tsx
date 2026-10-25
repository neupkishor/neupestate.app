import { AppPressable as Pressable, AppPressable as TouchableOpacity } from '@/components/element/touch-feedback';
import { Button } from '@neup/components/ui/button';
import { StatusBar } from 'expo-status-bar';
import { BlurView } from 'expo-blur';
import { Animated, Image, LayoutAnimation, NativeSyntheticEvent, NativeScrollEvent, ScrollView, Share, StatusBar as NativeStatusBar, StyleSheet, View, useWindowDimensions } from 'react-native';
import Reanimated, { useAnimatedScrollHandler, useSharedValue } from 'react-native-reanimated';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import logica from '@neup/logica';
import { Text } from '@neup/components/ui/text';
import { ImagePagination } from '@neup/components/element/image-pagination';
import { estateDatabase, getStoredProperty, recordActivity, saveVisitedProperty } from '@neup/core/database/estate';
import theme from '@base/theme.json';
const headingDescriptionGap = theme.spacing.headingDescriptionGap;

const betweenSectionsGap = theme.spacing.betweenSections;
const beforeItemGap = theme.spacing.beforeItem;
const betweenItemsGap = theme.spacing.betweenItems;

export default function PropertyDetails() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { width: screenWidth } = useWindowDimensions();
  const [property, setProperty] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [activeImage, setActiveImage] = useState(0);
  const imageScrollX = useSharedValue(0);
  const onImageScroll = useAnimatedScrollHandler((event) => { imageScrollX.value = event.contentOffset.x; });
  const carouselRef = useRef<any>(null);

  useEffect(() => {
    if (!id) return;
    const savedActivity = estateDatabase.getFirstSync<{ id: string }>(
      `SELECT id FROM activities
       WHERE activity_on = ?
         AND (activity_type LIKE 'property.like%' OR activity_type LIKE 'property.%save%' OR activity_type LIKE 'property.%favor%')
       ORDER BY rowid DESC
       LIMIT 1`,
      String(id),
    );
    const latestSavedActivity = savedActivity ? estateDatabase.getFirstSync<{ activity_type: string }>('SELECT activity_type FROM activities WHERE id = ?', savedActivity.id) : null;
    setIsSaved(Boolean(latestSavedActivity && latestSavedActivity.activity_type !== 'property.like.undo'));
    recordActivity('page.open', `/property/${id}`, { source: 'propertyPage' });
    void logica.estate.property(id).get().then((response) => {
      if (response.ok && response.body?.success && response.body.property) {
        const loadedProperty = response.body.property;
        setProperty(loadedProperty);
        if (loadedProperty?.id) saveVisitedProperty(loadedProperty);
      } else {
        const storedProperty = getStoredProperty(id);
        if (storedProperty) setProperty(storedProperty);
        else setError(true);
      }
    }).catch((error) => {
      console.error('Failed to load property:', error);
      const storedProperty = getStoredProperty(id);
      if (storedProperty) setProperty(storedProperty);
      else setError(true);
    }).finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (!id) return;

    const logView = () => recordActivity('property.view', String(id), { timeViewed: new Date().toISOString() });
    logView();
    const interval = setInterval(logView, 10_000);

    return () => clearInterval(interval);
  }, [id]);

  const shareProperty = async () => {
    const propertyType = formatSharePropertyType(property?.type ?? property?.category);
    const location = formatLocation(property?.location);
    const price = pricingText(property);
    const slug = String(property?.slug ?? property?.seo?.slug ?? property?.id ?? id);
    const url = `https://neupgroup.com/estate/properties/${slug}`;
    const message = `Hello, I found a great ${propertyType} from ${location} for just ${price}.\n\n${url}`;

    recordActivity('property.share', id, { source: 'propertyPage' });
    try {
      await Share.share({ message });
    } catch (shareError) {
      console.warn('Failed to share property:', shareError);
    }
  };

  const images: string[] = Array.isArray(property?.images) ? property.images.map(imageUri).filter(Boolean) : [];
  const category = first(property?.category) || 'Property';
  const purpose = first(property?.purpose);
  const pricing = Array.isArray(property?.pricing) ? property.pricing[0] : property?.pricing;
  const details = property?.details?.house || property?.details?.apartment || property?.details?.land || property?.details?.flat || property?.details?.space || property?.details;
  const features = Array.isArray(property?.amenities) ? property.amenities : [];
  const heroImage = images[0];

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <View style={styles.hero}>
          {images.length > 0 ? <Reanimated.FlatList ref={carouselRef as any} data={images} horizontal pagingEnabled scrollEnabled directionalLockEnabled nestedScrollEnabled alwaysBounceHorizontal showsHorizontalScrollIndicator={false} style={styles.heroCarousel} scrollEventThrottle={16} onScroll={onImageScroll} keyExtractor={(image, index) => `${image}-${index}`} renderItem={({ item, index }) => <Pressable onPress={() => router.push(`/property/${id}/viewer?imageIndex=${index}`)} accessibilityLabel={`Open photo ${index + 1} full screen`}><Image source={{ uri: item }} style={[styles.heroImage, { width: screenWidth }]} /></Pressable>} onMomentumScrollEnd={(event) => { LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut); setActiveImage(Math.round(event.nativeEvent.contentOffset.x / event.nativeEvent.layoutMeasurement.width)); }} /> : <View style={styles.heroImagePlaceholder} />}
          <View pointerEvents="none" style={styles.heroShade} />
          <View style={styles.topBar}>
            <TouchableOpacity style={styles.circleButton} onPress={() => router.back()}><Text name="title2">‹</Text></TouchableOpacity>
            <View style={styles.topActions}>
              <TouchableOpacity accessibilityLabel="Share property" style={styles.circleButton} onPress={() => void shareProperty()}><Text name="title2">⤴</Text></TouchableOpacity>
              <TouchableOpacity style={styles.circleButton} accessibilityLabel={isSaved ? 'Undo like' : 'Like property'} onPress={() => { recordActivity(isSaved ? 'property.like.undo' : 'property.like.fromPropertyPage', id, { source: 'propertyPage', action: isSaved ? 'undoLike' : 'like' }); setIsSaved(!isSaved); }}><Text name="title2" style={isSaved ? styles.savedHeart : undefined}>{isSaved ? '♥' : '♡'}</Text></TouchableOpacity>
            </View>
          </View>
          <ImagePagination count={images.length} activeIndex={activeImage} scrollX={imageScrollX} width={screenWidth} onSelect={(index) => carouselRef.current?.scrollToIndex?.({ index, animated: true })} />
        </View>

        <View style={styles.body}>
          <View style={styles.eyebrowRow}><View style={styles.tagRow}><View style={styles.propertyTag}><Text name="caption">{formatPurpose(purpose, loading)}</Text></View><View style={styles.propertyTag}><Text name="caption">{toTitleCase(category)}</Text></View></View><Text name="caption">{formatUpdatedAt(property?.updatedAt)}</Text></View>
          <View style={styles.title}><Text name="title">{formatText(property?.title, loading ? 'Loading property…' : 'Property unavailable')}</Text></View>
          <View style={styles.location}><Text name="caption">⌖  {formatLocation(property?.location)}</Text></View>
          <View style={styles.price}><Text name="title">{pricing?.raw || pricing?.basis || (property?.price != null ? `NPR ${property.price}` : 'Price on request')}</Text></View>

          {[
            { value: details?.bedrooms ?? property?.bedrooms, label: 'Bedroom', icon: '🛏' },
            { value: details?.bathrooms ?? property?.bathrooms, label: 'Bathroom', icon: '♨' },
            { value: property?.area ?? details?.area, label: property?.areaUnit || 'Area', icon: '▧' },
            { value: details?.floors ?? property?.floors, label: 'Floor', icon: '▤' },
          ].some((stat) => stat.value !== null && stat.value !== undefined && stat.value !== '') && (
            <View style={styles.highlightsSection}>
              <Text name="title2" style={styles.highlightsTitle}>Property Highlights</Text>
              <View style={styles.stats}>
                {[
                  { value: details?.bedrooms ?? property?.bedrooms, label: 'Bedroom', icon: '🛏' },
                  { value: details?.bathrooms ?? property?.bathrooms, label: 'Bathroom', icon: '♨' },
                  { value: property?.area ?? details?.area, label: property?.areaUnit || 'Area', icon: '▧' },
                  { value: details?.floors ?? property?.floors, label: 'Floor', icon: '▤' },
                ].filter((stat) => stat.value !== null && stat.value !== undefined && stat.value !== '').map((stat) => (
                  <Stat key={stat.label} value={String(stat.value)} label={stat.label} icon={stat.icon} />
                ))}
              </View>
            </View>
          )}

          <Text name="title2" style={{ marginTop: betweenSectionsGap }}>About this home</Text>
          <Text name="regular" style={{ marginTop: beforeItemGap }}>{property?.description || 'No description available.'}</Text>
          {features.length > 0 && <><Text name="title2" style={{ marginTop: betweenSectionsGap }}>Features & amenities</Text><View style={[styles.featureWrap, { marginTop: beforeItemGap }]}>{features.map((feature: string) => <View key={feature} style={styles.feature}><Text name="caption">{feature}</Text></View>)}</View></>}

          {images.length > 0 && <>
            <View style={[styles.gallerySectionHeader, { marginTop: betweenSectionsGap }]}>
              <View style={styles.galleryHeadingRow}>
                <Text name="title2">Take a closer look</Text>
                <TouchableOpacity onPress={() => router.push(`/property/${id}/gallery`)} accessibilityRole="button" accessibilityLabel="Open all property photos">
                  <Text name="title2" style={styles.galleryChevron}>›</Text>
                </TouchableOpacity>
              </View>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.thumbs}>
              {images.slice(0, 7).map((image, index) => <TouchableOpacity key={`${image}-${index}`} activeOpacity={0.85} onPress={() => router.push(`/property/${id}/viewer?imageIndex=${index}`)} accessibilityLabel={`Open photo ${index + 1} full screen`}><Image source={{ uri: image }} style={styles.thumb} /></TouchableOpacity>)}
              {images.length > 7 ? (
                <TouchableOpacity style={styles.morePhotos} activeOpacity={0.8} onPress={() => router.push(`/property/${id}/gallery`)} accessibilityLabel={`Open gallery with ${images.length - 7} more photos`}>
                  <Text name="title3">+{images.length - 7}{'\n'}more images</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity style={styles.morePhotos} activeOpacity={0.8} onPress={() => router.push(`/property/${id}/gallery`)} accessibilityLabel="Open gallery; these are all the photos">
                  <Text name="title3">That’s all</Text>
                </TouchableOpacity>
              )}
            </ScrollView>
          </>}

          <View style={[styles.agentCard, { marginTop: betweenItemsGap }]}>
            <View style={styles.agentAvatarPlaceholder} />
            <View style={styles.agentDetails}><Text name="caption">LISTED BY</Text><Text name="title3">{property?.listingAgent || 'Agent unavailable'}</Text><Text name="caption">{property?.agency?.name || ''}</Text></View>
            <TouchableOpacity style={styles.agentArrow}><Text name="title2">→</Text></TouchableOpacity>
          </View>
        </View>
      </ScrollView>
      {error && !property && <View style={styles.error}><Text name="regular">Unable to load this property.</Text></View>}
      <View style={styles.bottomBar}><Button variant="outlined" style={styles.messageButton}><Text name="title3">Message agent</Text></Button><Button variant="solid" style={styles.tourButton}><Text name="title3" color="#d8f36a">Request a tour</Text></Button></View>
    </View>
  );
}

function Stat({ value, label, icon }: { value: string; label: string; icon: string }) {
  const pluralLabel = label === 'Bedroom' || label === 'Bathroom' || label === 'Floor'
    ? `${label}${Number(value) === 1 ? '' : 's'}`
    : label;
  return <View style={styles.stat}><Text name="title3" style={styles.statIcon}>{icon}</Text><Text name="title3" style={styles.statValue}>{value} <Text name="caption" style={styles.statUnit}>{pluralLabel}</Text></Text></View>;
}

function formatPurpose(purpose: unknown, loading: boolean) {
  if (typeof purpose === 'string' && purpose.trim()) {
    return toTitleCase(purpose);
  }
  return loading ? 'Loading' : 'Property';
}

function formatSharePropertyType(type: unknown) {
  const value = String(first(type) ?? '').toLowerCase();
  if (value.includes('land')) return 'land';
  if (value.includes('shop') || value.includes('commercial') || value.includes('space')) return 'shop space';
  return 'house';
}

function pricingText(property: any) {
  const pricing = Array.isArray(property?.pricing) ? property.pricing[0] : property?.pricing;
  return pricing?.raw || pricing?.basis || (property?.price != null ? `NPR ${property.price}` : 'the listed price');
}

function toTitleCase(value: unknown) {
  return String(value).toLowerCase().replace(/\b\w/g, (character) => character.toUpperCase());
}

function first(value: unknown) { return Array.isArray(value) ? value[0] : value; }
function formatValue(value: unknown) { return value === null || value === undefined || value === '' ? '—' : String(value); }

function imageUri(value: unknown): string {
  if (typeof value === 'string') return value;
  if (!value || typeof value !== 'object') return '';

  const image = value as { uri?: unknown; url?: unknown; src?: unknown };
  return imageUri(image.uri ?? image.url ?? image.src);
}

function formatUpdatedAt(updatedAt: unknown) {
  if (!updatedAt) return '';
  const date = new Date(String(updatedAt));
  return Number.isNaN(date.getTime()) ? '' : `Updated ${date.toLocaleDateString()}`;
}

function formatText(value: unknown, fallback: string) {
  return typeof value === 'string' && value.trim() ? value : fallback;
}

function formatLocation(location: unknown) {
  if (typeof location === 'string' && location.trim()) return location;
  if (!location || typeof location !== 'object') return 'Location unavailable';

  const value = location as { text?: unknown; structured?: unknown };
  if (typeof value.text === 'string' && value.text.trim()) return value.text;
  if (typeof value.structured === 'string' && value.structured.trim()) return value.structured;
  if (value.structured && typeof value.structured === 'object') {
    const structured = value.structured as Record<string, unknown>;
    const parts = ['address', 'neighborhood', 'city', 'state', 'country']
      .map((key) => structured[key])
      .filter((part): part is string => typeof part === 'string' && part.trim().length > 0);
    if (parts.length) return parts.join(', ');
  }
  return 'Location unavailable';
}

function visibleIndicatorIndices(imageCount: number, activeIndex: number) {
  const visibleCount = Math.min(5, imageCount);
  const start = Math.min(Math.max(activeIndex - 1, 0), imageCount - visibleCount);
  return Array.from({ length: visibleCount }, (_, index) => start + index);
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ffffff' }, content: { paddingBottom: theme.spacing.space105 }, hero: { height: 330, position: 'relative' }, heroCarousel: { flex: 1 }, heroImage: { width: 392, height: '100%' }, heroImagePlaceholder: { width: '100%', height: '100%', backgroundColor: '#dfe7e3' }, heroShade: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(15,35,30,0.18)' }, topBar: { paddingHorizontal: theme.spacing.space20, paddingTop: theme.spacing.space20, paddingBottom: theme.spacing.space16, flexDirection: 'row', alignItems: 'center', gap: theme.spacing.space14 }, topActions: { flexDirection: 'row', gap: theme.spacing.space10 }, circleButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.9)', alignItems: 'center', justifyContent: 'center' }, back: { color: '#173d35', fontSize: 34, lineHeight: 32, marginTop: theme.spacing.spaceNeg3 }, icon: { color: '#173d35', fontSize: 20 }, photoCount: { position: 'absolute', bottom: 20, right: 20, backgroundColor: 'rgba(23,61,53,0.88)', borderRadius: 18, paddingVertical: theme.spacing.space8, paddingHorizontal: theme.spacing.space13 }, photoText: { color: '#fff', fontSize: 12, fontWeight: '700' }, dots: { position: 'absolute', bottom: 25, left: 20, flexDirection: 'row', gap: theme.spacing.space5 }, dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.55)' }, activeDot: { width: 18, backgroundColor: '#fff' }, body: { padding: theme.spacing.space22, backgroundColor: '#ffffff' }, eyebrowRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }, tagRow: { flexDirection: 'row', gap: theme.spacing.space8, alignItems: 'center' }, propertyTag: { backgroundColor: '#eaf2e3', borderRadius: 999, paddingHorizontal: theme.spacing.space11, paddingVertical: theme.spacing.space5 }, eyebrow: { color: '#658b4f', fontSize: 11, letterSpacing: 1.5, fontWeight: '800' }, updated: { color: '#9aa6a2', fontSize: 11 }, title: { color: '#173d35', fontSize: 27, fontWeight: '800', lineHeight: 33, letterSpacing: -0.7, marginTop: theme.spacing.space10 }, location: { color: '#71847d', fontSize: 13, marginTop: headingDescriptionGap }, price: { color: '#173d35', fontSize: 25, fontWeight: '800', marginTop: theme.spacing.space5 }, highlightsSection: { marginTop: theme.spacing.space20 }, highlightsTitle: { color: '#173d35', fontSize: 18, fontWeight: '800', marginBottom: theme.spacing.space10 }, stats: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.space8 }, stat: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: theme.spacing.space7, minHeight: 48, paddingHorizontal: theme.spacing.space13, paddingVertical: theme.spacing.space10, backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: '#e3ebe6' }, statIcon: { color: '#557d54', fontSize: 17 }, statValue: { color: '#173d35', fontSize: 16, fontWeight: '800' }, statUnit: { color: '#71817b', fontSize: 13, fontWeight: '600' }, sectionTitle: { color: '#173d35', fontSize: 18, fontWeight: '800', marginTop: theme.spacing.space25 }, description: { color: '#71817b', fontSize: 13, lineHeight: 21, marginTop: theme.spacing.space9 }, sectionDescription: { marginTop: theme.spacing.space4 }, gallerySectionHeader: { gap: theme.spacing.space4 }, galleryHeadingRow: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.space5 }, galleryChevron: { color: '#173d35', marginTop: theme.spacing.spaceNeg2 }, spaceTop: { marginTop: theme.spacing.space27 }, featureWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.space8, marginTop: theme.spacing.space12 }, feature: { backgroundColor: '#eaf2e3', borderRadius: 12, paddingHorizontal: theme.spacing.space11, paddingVertical: theme.spacing.space8 }, featureText: { color: '#42604b', fontSize: 11, fontWeight: '700' }, thumbs: { gap: theme.spacing.space10, paddingVertical: theme.spacing.space13 }, thumb: { width: 112, height: 86, borderRadius: 12 }, morePhotos: { width: 88, height: 86, borderRadius: 12, backgroundColor: '#dce6d3', alignItems: 'center', justifyContent: 'center' }, morePhotosText: { color: '#42604b', fontWeight: '800', fontSize: 13, textAlign: 'center', lineHeight: 18 }, agentCard: { backgroundColor: '#fff', borderRadius: 17, padding: theme.spacing.space13, flexDirection: 'row', alignItems: 'center', marginTop: theme.spacing.space18 }, agentAvatarPlaceholder: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#dfe7e3' }, agentDetails: { flex: 1, marginLeft: theme.spacing.space11 }, agentLabel: { color: '#9aa6a2', fontSize: 9, letterSpacing: 1.2, fontWeight: '800' }, agentName: { color: '#173d35', fontWeight: '800', fontSize: 14, marginTop: theme.spacing.space3 }, agentCompany: { color: '#87958f', fontSize: 11, marginTop: theme.spacing.space3 }, agentArrow: { width: 34, height: 34, borderRadius: 17, backgroundColor: '#eef5e7', alignItems: 'center', justifyContent: 'center' }, arrow: { color: '#557d54', fontSize: 18 }, error: { position: 'absolute', top: 52, left: 70, right: 70, backgroundColor: '#fff', padding: theme.spacing.space10, borderRadius: 12 }, errorText: { color: '#b64d43', textAlign: 'center', fontSize: 12 }, bottomBar: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#edf0ee', paddingHorizontal: theme.spacing.space20, paddingVertical: theme.spacing.space13, flexDirection: 'row', gap: theme.spacing.space10 }, messageButton: { flex: 1, height: 48, borderRadius: 14, borderWidth: 1, borderColor: '#cdd8d3', alignItems: 'center', justifyContent: 'center' }, messageText: { color: '#173d35', fontWeight: '800', fontSize: 13 }, tourButton: { flex: 1.25, height: 48, borderRadius: 14, backgroundColor: '#173d35', alignItems: 'center', justifyContent: 'center' }, tourText: { color: '#d8f36a', fontWeight: '800', fontSize: 13 },
  dotsAnimated: { position: 'absolute', bottom: 25, left: 20, height: 18, flexDirection: 'row', gap: theme.spacing.space1 }, dotsBackdrop: { ...StyleSheet.absoluteFill, top: -5, bottom: -5, left: -8, right: -8, borderRadius: 999, overflow: 'hidden' }, dotSlot: { width: 11, height: 18, alignItems: 'center', justifyContent: 'center' }, savedHeart: { color: '#d94b4b' },
});
