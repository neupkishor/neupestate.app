import { AppPressable as Pressable, AppPressable as TouchableOpacity } from '@/components/element/touch-feedback';
import { AppButton as Button } from '@/components/element/app-button';
import { StatusBar } from 'expo-status-bar';
import { BlurView } from 'expo-blur';
import { Animated, Image, LayoutAnimation, NativeSyntheticEvent, NativeScrollEvent, ScrollView, Share, StatusBar as NativeStatusBar, StyleSheet, View, useWindowDimensions } from 'react-native';
import Reanimated, { useAnimatedScrollHandler, useSharedValue } from 'react-native-reanimated';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '@/components/theme/AppThemeProvider';
import { formatPropertyArea, getAreaUnitPreference, type AreaUnitPreference } from '@base/area-units';
import logica from '@neup/logica';
import { Text } from '@neup/components/ui/text';
import { ImagePagination } from '@neup/components/element/image-pagination';
import { LocationIcon } from '@/components/element/location-icon';
import { BaseIcon, type BaseIconName } from '@/components/element/base-icon';
import { getStoredProperty, recordActivity, saveVisitedProperty } from '@neup/core/database/estate';
import { PROPERTY_REPRESENTATIVES_INCLUDE } from '@/components/element/property-list-includes';
import theme from '@base/theme.json';
const headingDescriptionGap = theme.spacing.headingDescriptionGap;

const betweenSectionsGap = theme.spacing.betweenSections;
const beforeItemGap = theme.spacing.beforeItem;
const betweenItemsGap = theme.spacing.betweenItems;

export default function PropertyDetails() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useAppTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { width: screenWidth } = useWindowDimensions();
  const [property, setProperty] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [reaction, setReaction] = useState<string | null>(null);
  const [savingAction, setSavingAction] = useState(false);
  const [reactingAction, setReactingAction] = useState(false);
  const [activeImage, setActiveImage] = useState(0);
  const [areaUnitPreference, setAreaUnitPreference] = useState<AreaUnitPreference>('Aana system');
  const [areaUnitOverride, setAreaUnitOverride] = useState<AreaUnitPreference | null>(null);
  const imageScrollX = useSharedValue(0);
  const onImageScroll = useAnimatedScrollHandler((event) => { imageScrollX.value = event.contentOffset.x; });
  const carouselRef = useRef<any>(null);

  useEffect(() => {
    void getAreaUnitPreference().then(setAreaUnitPreference);
  }, []);

  useEffect(() => {
    if (!id) return;
    recordActivity('page.open', `/property/${id}`, { source: 'propertyPage' });
    console.log('[property] request', {
      endpoint: `GET /bridge/api.v1/properties/${encodeURIComponent(String(id))}`,
      query: { include: PROPERTY_REPRESENTATIVES_INCLUDE },
    });
    void logica.estate.property(id).get(PROPERTY_REPRESENTATIVES_INCLUDE).then((response) => {
      console.log('[property] response', { status: response.status, ok: response.ok, body: response.body });
      if (response.ok && response.body?.success && response.body.property) {
        const loadedProperty = response.body.property;
        console.log('[property] representatives response', loadedProperty.representatives);
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
    void Promise.all([
      logica.estate.property.saved.list({ account: 'me', limit: 100, offset: 0 }),
      logica.estate.property.reacted.list({ account: 'me', limit: 100, offset: 0 }),
    ]).then(([savedResponse, reactedResponse]) => {
      const savedBody = savedResponse.body as any;
      const reactedBody = reactedResponse.body as any;
      const records = (body: any) => Array.isArray(body?.data) ? body.data : Array.isArray(body?.saved) ? body.saved : Array.isArray(body?.savedProperties) ? body.savedProperties : Array.isArray(body?.reactions) ? body.reactions : [];
      setIsSaved(savedResponse.ok && records(savedBody).some((item: any) => String(item.propertyId ?? item.property_id ?? item.property?.id) === String(id)));
      const currentReaction = reactedResponse.ok ? records(reactedBody).find((item: any) => String(item.propertyId ?? item.property_id ?? item.property?.id) === String(id)) : null;
      setReaction(currentReaction ? String(currentReaction.reaction ?? currentReaction.type ?? 'Liked') : null);
    }).catch((loadError) => console.warn('[property-actions] unable to load saved/reaction state', loadError));
  }, [id]);

  async function toggleSaved() {
    if (!id || savingAction) return;
    setSavingAction(true);
    try {
      const response = isSaved
        ? await logica.estate.property.saved.remove({ propertyId: String(id) })
        : await logica.estate.property.saved.save(String(id));
      const body = response.body as any;
      if (!response.ok || body?.success === false) throw new Error(body?.error || 'Unable to update saved property.');
      setIsSaved(!isSaved);
      recordActivity(isSaved ? 'property.save.remove' : 'property.save', String(id), { source: 'propertyPage' });
    } catch (actionError) {
      console.error('[property-actions] unable to update saved property', actionError);
    } finally {
      setSavingAction(false);
    }
  }

  async function toggleReaction() {
    if (!id || reactingAction) return;
    setReactingAction(true);
    try {
      const response = reaction === 'Liked'
        ? await logica.estate.property.reacted.remove({ propertyId: String(id) })
        : await logica.estate.property.reacted.react(String(id), 'Liked');
      const body = response.body as any;
      if (!response.ok || body?.success === false) throw new Error(body?.error || 'Unable to update property reaction.');
      setReaction(reaction === 'Liked' ? null : 'Liked');
      recordActivity(reaction === 'Liked' ? 'property.like.undo' : 'property.like', String(id), { source: 'propertyPage' });
    } catch (actionError) {
      console.error('[property-actions] unable to update property reaction', actionError);
    } finally {
      setReactingAction(false);
    }
  }

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
  const representatives = Array.isArray(property?.representatives)
    ? property.representatives.map(objectRecord).filter((representative): representative is Record<string, any> => Boolean(representative))
    : [];
  const agencyRepresentative = representatives.find(isAgencyRepresentative);
  const openAgentProfile = (representative: Record<string, any>) => {
    const targetAgentId = firstText(representative.id);
    if (!targetAgentId) {
      console.warn('[property] agent profile unavailable: representative has no identifier', representative);
      return;
    }
    const params = new URLSearchParams({
      type: 'agent',
      name: representative.name || '',
      image: imageUri(representative.image),
      agency: agencyRepresentative?.name || '',
    });
    router.push(`/profile/${encodeURIComponent(targetAgentId)}?${params.toString()}`);
  };
  const openAgencyProfile = (representative: Record<string, any>) => {
    const targetAgencyId = firstText(representative.id);
    if (!targetAgencyId) {
      console.warn('[property] agency profile unavailable: representative has no identifier', representative);
      return;
    }
    const params = new URLSearchParams({
      type: 'agency',
      name: representative.name || '',
      image: imageUri(representative.image),
    });
    router.push(`/profile/${encodeURIComponent(targetAgencyId)}?${params.toString()}`);
  };
  const areaValue = property?.area ?? details?.area;
  const activeAreaUnit = areaUnitOverride ?? areaUnitPreference;
  const formattedArea = formatPropertyArea(areaValue, activeAreaUnit, property?.areaUnit ?? details?.areaUnit);

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <View style={styles.hero}>
          {images.length > 0 ? <Reanimated.FlatList ref={carouselRef as any} data={images} horizontal pagingEnabled scrollEnabled directionalLockEnabled nestedScrollEnabled alwaysBounceHorizontal showsHorizontalScrollIndicator={false} style={styles.heroCarousel} scrollEventThrottle={16} onScroll={onImageScroll} keyExtractor={(image, index) => `${image}-${index}`} renderItem={({ item, index }) => <Pressable onPress={() => router.push(`/property/${id}/viewer?imageIndex=${index}`)} accessibilityLabel={`Open photo ${index + 1} full screen`}><Image source={{ uri: item }} style={[styles.heroImage, { width: screenWidth }]} /></Pressable>} onMomentumScrollEnd={(event) => { LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut); setActiveImage(Math.round(event.nativeEvent.contentOffset.x / event.nativeEvent.layoutMeasurement.width)); }} /> : <View style={styles.heroImagePlaceholder} />}
          <View pointerEvents="none" style={styles.heroShade} />
          <View style={[styles.topBar, { paddingTop: insets.top + theme.spacing.space8 }]}>
            <TouchableOpacity style={styles.circleButton} onPress={() => router.back()}><BaseIcon name="arrow-left" size={18} color="#173d35" /></TouchableOpacity>
            <View style={styles.topActions}>
              <TouchableOpacity accessibilityLabel="Share property" style={styles.circleButton} onPress={() => void shareProperty()}><BaseIcon name="share" size={18} color="#173d35" /></TouchableOpacity>
              <TouchableOpacity style={styles.circleButton} accessibilityLabel={isSaved ? 'Remove saved property' : 'Save property'} disabled={savingAction} onPress={() => void toggleSaved()}><BaseIcon name={isSaved ? 'unsave' : 'save'} size={18} color={isSaved ? '#bd5a50' : '#173d35'} /></TouchableOpacity>
              <TouchableOpacity style={styles.circleButton} accessibilityLabel={reaction === 'Liked' ? 'Remove like' : 'Like property'} disabled={reactingAction} onPress={() => void toggleReaction()}><BaseIcon name={reaction === 'Liked' ? 'love' : 'like'} size={18} color={reaction === 'Liked' ? '#bd5a50' : '#173d35'} /></TouchableOpacity>
            </View>
          </View>
          <ImagePagination count={images.length} activeIndex={activeImage} scrollX={imageScrollX} width={screenWidth} onSelect={(index) => carouselRef.current?.scrollToIndex?.({ index, animated: true })} />
        </View>

        <View style={styles.body}>
          <View style={styles.eyebrowRow}><View style={styles.tagRow}><View style={styles.propertyTag}><Text name="caption">{formatPurpose(purpose, loading)}</Text></View><View style={styles.propertyTag}><Text name="caption">{toTitleCase(category)}</Text></View></View><Text name="caption">{formatUpdatedAt(property?.updatedAt)}</Text></View>
          <View style={styles.title}><Text name="title">{formatText(property?.title, loading ? 'Loading property…' : 'Property unavailable')}</Text></View>
          <View style={styles.location}><LocationIcon /><Text name="caption">{formatLocation(property?.location)}</Text></View>
          <View style={styles.price}><Text name="title">{pricing?.raw || pricing?.basis || (property?.price != null ? `NPR ${property.price}` : 'Price on request')}</Text></View>

          {[
            { value: details?.bedrooms ?? property?.bedrooms, label: 'Bedroom', icon: '🛏' },
            { value: details?.bathrooms ?? property?.bathrooms, label: 'Bathroom', icon: '♨' },
            { value: formattedArea, label: 'Area', icon: '▧' },
            { value: details?.floors ?? property?.floors, label: 'Floor', icon: '▤' },
          ].some((stat) => stat.value !== null && stat.value !== undefined && stat.value !== '') && (
            <View style={styles.highlightsSection}>
              <Text name="title2" style={styles.highlightsTitle}>Property Highlights</Text>
              <View style={styles.stats}>
                {[
                  { value: details?.bedrooms ?? property?.bedrooms, label: 'Bedroom', icon: 'home' },
                  { value: details?.bathrooms ?? property?.bathrooms, label: 'Bathroom', icon: 'gps' },
                  { value: formattedArea, label: 'Area', icon: 'location', onPress: cycleAreaUnit },
                  { value: details?.floors ?? property?.floors, label: 'Floor', icon: 'home' },
                ].filter((stat) => stat.value !== null && stat.value !== undefined && stat.value !== '').map((stat) => (
                  <Stat key={stat.label} value={String(stat.value)} label={stat.label} icon={stat.icon} onPress={'onPress' in stat ? stat.onPress : undefined} />
                ))}
              </View>
            </View>
          )}

          <Text name="title2" style={[styles.sectionTitle, { marginTop: betweenSectionsGap }]}>About this home</Text>
          <Text name="regular" style={{ marginTop: beforeItemGap }}>{property?.description || 'No description available.'}</Text>
          {features.length > 0 && <><Text name="title2" style={[styles.sectionTitle, { marginTop: betweenSectionsGap }]}>Features & amenities</Text><View style={[styles.featureWrap, { marginTop: beforeItemGap }]}>{features.map((feature: string) => <View key={feature} style={styles.feature}><Text name="caption">{feature}</Text></View>)}</View></>}

          {images.length > 0 && <>
            <View style={[styles.gallerySectionHeader, { marginTop: betweenSectionsGap }]}>
              <View style={styles.galleryHeadingRow}>
                <Text name="title2" style={styles.sectionTitle}>Take a closer look</Text>
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

          {representatives.length > 0 && <Text name="title2" style={[styles.sectionTitle, { marginTop: betweenSectionsGap }]}>Representatives</Text>}
          {representatives.map((representative, index) => {
            const representativeImage = imageUri(representative.image);
            const representativeName = firstText(representative.name) || 'Representative';
            const role = representativeRole(representative, index);
            const agentProfile = isAgentRepresentative(representative);
            const agencyProfile = isAgencyRepresentative(representative);
            const profileLink = agentProfile || agencyProfile;
            const cardContent = <>
              {representativeImage ? <Image source={{ uri: representativeImage }} style={styles.agentAvatarPlaceholder} resizeMode="cover" /> : <View style={styles.agentAvatarPlaceholder} />}
              <View style={styles.agentDetails}><Text name="caption">{role.toUpperCase()}</Text><Text name="title3">{representativeName}</Text>{agentProfile && agencyRepresentative?.name ? <Text name="caption">{agencyRepresentative.name}</Text> : null}</View>
              {profileLink ? <View style={styles.agentArrow}><BaseIcon name="arrow-left" rotation={180} size={16} color="#557d54" /></View> : null}
            </>;
            if (!profileLink) {
              return <View key={`${representative.id || role}-${index}`} style={[styles.agentCard, { marginTop: betweenItemsGap }]}>{cardContent}</View>;
            }
            return <TouchableOpacity key={`${representative.id || role}-${index}`} accessibilityRole="button" accessibilityLabel={`View ${role.toLowerCase()} ${representativeName}`} onPress={() => agentProfile ? openAgentProfile(representative) : openAgencyProfile(representative)} style={[styles.agentCard, { marginTop: betweenItemsGap }]}>{cardContent}</TouchableOpacity>;
          })}
        </View>
      </ScrollView>
      {error && !property && <View style={styles.error}><Text name="regular">Unable to load this property.</Text></View>}
      <View style={[styles.bottomBar, { backgroundColor: colors.navigation, paddingBottom: Math.max(insets.bottom, theme.spacing.space8) }]}>
        <Button variant="outlined" style={styles.messageButton} onPress={() => router.push({ pathname: '/assist/message', params: { propertyId: String(id), intent: 'message' } })}><Text name="title3">Message agent</Text></Button>
        <Button variant="solid" style={styles.tourButton} onPress={() => router.push({ pathname: '/assist/message', params: { propertyId: String(id), intent: 'tour' } })}><Text name="title3" color="#d8f36a">Request a tour</Text></Button>
      </View>
    </View>
  );

  function cycleAreaUnit() {
    const units: AreaUnitPreference[] = ['Aana system', 'Meter system', 'Feet system', 'Kattha system'];
    const current = areaUnitOverride ?? areaUnitPreference;
    setAreaUnitOverride(units[(units.indexOf(current) + 1) % units.length]);
  }
}

function Stat({ value, label, icon, onPress }: { value: string; label: string; icon: BaseIconName; onPress?: () => void }) {
  const pluralLabel = label === 'Bedroom' || label === 'Bathroom' || label === 'Floor'
    ? `${label}${Number(value) === 1 ? '' : 's'}`
    : label;
  const content = <><BaseIcon name={icon} size={17} color="#557d54" /><Text name="title3" style={styles.statValue}>{value} <Text name="caption" style={styles.statUnit}>{pluralLabel}</Text></Text></>;
  return onPress
    ? <TouchableOpacity style={styles.stat} onPress={onPress} activeOpacity={0.7} accessibilityRole="button" accessibilityLabel={`Area: ${value}. Tap to change unit.`}>{content}</TouchableOpacity>
    : <View style={styles.stat}>{content}</View>;
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
function objectRecord(value: unknown): Record<string, any> | undefined {
  if (Array.isArray(value)) return objectRecord(value[0]);
  return value && typeof value === 'object' ? value as Record<string, any> : undefined;
}
function representativeType(representative: Record<string, any>): string {
  return [representative.representativeType, representative.type, representative.role, representative.kind, representative.category, representative.entityType]
    .filter((value): value is string => typeof value === 'string' && Boolean(value.trim()))
    .map((value) => value.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/[_-]+/g, ' ').trim().toLowerCase())
    .join(' ');
}
function isAgentRepresentative(representative: Record<string, any>): boolean {
  return representative.isAgent === true || representativeType(representative).includes('agent');
}
function isAgencyRepresentative(representative: Record<string, any>): boolean {
  return representative.isAgency === true || representativeType(representative).includes('agency');
}
function representativeRole(representative: Record<string, any>, index: number): string {
  const type = representativeType(representative);
  if (type) return type.replace(/\b\w/g, (character) => character.toUpperCase());
  return index === 0 ? 'Listed by' : `Representative ${index + 1}`;
}
function firstText(...values: unknown[]): string | undefined {
  for (const value of values) {
    if (typeof value === 'string' && value.trim()) return value.trim();
    if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  }
  return undefined;
}
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
  container: { flex: 1, backgroundColor: '#ffffff' }, content: { paddingBottom: theme.spacing.space105 }, hero: { height: 330, position: 'relative' }, heroCarousel: { flex: 1 }, heroImage: { width: 392, height: '100%' }, heroImagePlaceholder: { width: '100%', height: '100%', backgroundColor: '#dfe7e3' }, heroShade: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(15,35,30,0.18)' }, topBar: { position: 'absolute', top: 0, left: 0, right: 0, paddingHorizontal: theme.spacing.space20, paddingBottom: theme.spacing.space16, flexDirection: 'row', alignItems: 'center', gap: theme.spacing.space14 }, topActions: { flexDirection: 'row', gap: theme.spacing.space10 }, circleButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.9)', alignItems: 'center', justifyContent: 'center' }, back: { color: '#173d35', fontSize: 34, lineHeight: 32, marginTop: theme.spacing.spaceNeg3 }, icon: { color: '#173d35', fontSize: 20 }, photoCount: { position: 'absolute', bottom: 20, right: 20, backgroundColor: 'rgba(23,61,53,0.88)', borderRadius: 18, paddingVertical: theme.spacing.space8, paddingHorizontal: theme.spacing.space13 }, photoText: { color: '#fff', fontSize: 12, fontWeight: '700' }, dots: { position: 'absolute', bottom: 25, left: 20, flexDirection: 'row', gap: theme.spacing.space5 }, dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.55)' }, activeDot: { width: 18, backgroundColor: '#fff' }, body: { padding: theme.spacing.space22, backgroundColor: '#ffffff' }, eyebrowRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }, tagRow: { flexDirection: 'row', gap: theme.spacing.space8, alignItems: 'center' }, propertyTag: { backgroundColor: '#eaf2e3', borderRadius: 999, paddingHorizontal: theme.spacing.space11, paddingVertical: theme.spacing.space5 }, eyebrow: { color: '#658b4f', fontSize: 11, letterSpacing: 1.5, fontWeight: '800' }, updated: { color: '#9aa6a2', fontSize: 11 }, title: { color: '#173d35', fontSize: 27, fontWeight: '800', lineHeight: 33, letterSpacing: -0.7, marginTop: theme.spacing.space10 }, location: { color: '#71847d', fontSize: 13, marginTop: headingDescriptionGap, flexDirection: 'row', alignItems: 'center', gap: theme.spacing.space5 }, price: { color: '#173d35', fontSize: 25, fontWeight: '800', marginTop: theme.spacing.space5 }, highlightsSection: { marginTop: theme.spacing.space20 }, highlightsTitle: { color: '#173d35', fontSize: 18, fontWeight: '700', letterSpacing: -0.3, marginBottom: theme.spacing.space10 }, sectionTitle: { fontWeight: '700', letterSpacing: -0.3 }, stats: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.space8 }, stat: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: theme.spacing.space7, minHeight: 48, paddingHorizontal: theme.spacing.space13, paddingVertical: theme.spacing.space10, backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: '#e3ebe6' }, statIcon: { color: '#557d54', fontSize: 17 }, statValue: { color: '#173d35', fontSize: 16, fontWeight: '800' }, statUnit: { color: '#71817b', fontSize: 13, fontWeight: '600' }, sectionTitle: { color: '#173d35', fontSize: 18, fontWeight: '800', marginTop: theme.spacing.space25 }, description: { color: '#71817b', fontSize: 13, lineHeight: 21, marginTop: theme.spacing.space9 }, sectionDescription: { marginTop: theme.spacing.space4 }, gallerySectionHeader: { gap: theme.spacing.space4 }, galleryHeadingRow: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.space5 }, spaceTop: { marginTop: theme.spacing.space27 }, featureWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.space8, marginTop: theme.spacing.space12 }, feature: { backgroundColor: '#eaf2e3', borderRadius: 12, paddingHorizontal: theme.spacing.space11, paddingVertical: theme.spacing.space8 }, featureText: { color: '#42604b', fontSize: 11, fontWeight: '700' }, thumbs: { gap: theme.spacing.space10, paddingVertical: theme.spacing.space13 }, thumb: { width: 112, height: 86, borderRadius: 12, backgroundColor: '#e8edeb' }, morePhotos: { width: 88, height: 86, borderRadius: 12, backgroundColor: '#dce6d3', alignItems: 'center', justifyContent: 'center' }, morePhotosText: { color: '#42604b', fontWeight: '800', fontSize: 13, textAlign: 'center', lineHeight: 18 }, agentCard: { backgroundColor: '#eaf2e3', borderWidth: 1, borderColor: '#cbdcc5', borderRadius: 14, padding: theme.spacing.space12, flexDirection: 'row', alignItems: 'center' }, agentAvatarPlaceholder: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#dfe7e3' }, agentDetails: { flex: 1, marginLeft: theme.spacing.space11 }, agentLabel: { color: '#9aa6a2', fontSize: 9, letterSpacing: 1.2, fontWeight: '800' }, agentName: { color: '#173d35', fontWeight: '800', fontSize: 14, marginTop: theme.spacing.space3 }, agentCompany: { color: '#87958f', fontSize: 11, marginTop: theme.spacing.space3 }, agentArrow: { width: 34, height: 34, borderRadius: 17, backgroundColor: '#eef5e7', alignItems: 'center', justifyContent: 'center' }, arrow: { color: '#557d54', fontSize: 18 }, error: { position: 'absolute', top: 52, left: 70, right: 70, backgroundColor: '#fff', padding: theme.spacing.space10, borderRadius: 12 }, errorText: { color: '#b64d43', fontSize: 12 }, bottomBar: { position: 'absolute', bottom: 0, left: 0, right: 0, borderTopWidth: 1, borderTopColor: '#edf0ee', paddingHorizontal: theme.spacing.space20, paddingTop: theme.spacing.space13, flexDirection: 'row', gap: theme.spacing.space10 }, messageButton: { flex: 1, height: 48, borderRadius: 14, borderWidth: 1, borderColor: '#cdd8d3', alignItems: 'center', justifyContent: 'center' }, messageText: { color: '#173d35', fontWeight: '800', fontSize: 13 }, tourButton: { flex: 1.25, height: 48, borderRadius: 14, backgroundColor: '#173d35', alignItems: 'center', justifyContent: 'center' }, tourText: { color: '#d8f36a', fontWeight: '800', fontSize: 13 },
  dotsAnimated: { position: 'absolute', bottom: 25, left: 20, height: 18, flexDirection: 'row', gap: theme.spacing.space1 }, dotsBackdrop: { ...StyleSheet.absoluteFill, top: -5, bottom: -5, left: -8, right: -8, borderRadius: 999, overflow: 'hidden' }, dotSlot: { width: 11, height: 18, alignItems: 'center', justifyContent: 'center' }, savedHeart: { color: '#d94b4b' },
});
