import { AppPressable as Pressable, AppPressable as TouchableOpacity } from '@/components/element/touch-feedback';
import { AppButton as Button } from '@/components/element/app-button';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, Animated, Image, LayoutAnimation, ScrollView, Share, StyleSheet, View, useWindowDimensions } from 'react-native';
import Reanimated, { useAnimatedScrollHandler, useSharedValue } from 'react-native-reanimated';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '@/components/theme/AppThemeProvider';
import { formatPropertyArea, formatPropertyPrice, getAreaUnitPreference, type AreaUnitPreference } from '@base/area-units';
import logica from '@neup/logica';
import { Text } from '@neup/components/ui/text';
import { ImagePagination } from '@neup/components/element/image-pagination';
import { LocationIcon } from '@/components/element/location-icon';
import { BaseIcon, type BaseIconName } from '@/components/element/base-icon';
import { PropertyHighlights } from '@/components/section/property-highlights';
import { RoomsAndSpacing } from '@/components/section/rooms-and-spacing';
import { PropertyFeaturesAmenities } from '@/components/section/property-features-amenities';
import { getStoredProperty, recordActivity, saveVisitedProperty } from '@neup/core/database/estate';
import { PROPERTY_REPRESENTATIVES_INCLUDE } from '@/components/element/property-list-includes';
import { ProfilePropertyCard } from '@/components/element/profile-property-card';
import { listingPath } from '@/components/element/listing-route';
import { HeaderFloating } from '@neup/components/ui/header';
import theme from '@base/theme.json';
const headingDescriptionGap = theme.spacing.headingDescriptionGap;

const betweenSectionsGap = theme.spacing.betweenSections;
const beforeItemGap = theme.spacing.beforeItem;
const betweenItemsGap = theme.spacing.betweenItems;
const RELATED_LISTING_LIMIT = 8;

type RelatedListing = Record<string, any> & { id: string };

// Read a location label from the listing's supported location formats.
function listingLocationText(location: unknown): string {
  if (typeof location === 'string') return location.trim();
  if (!location || typeof location !== 'object') return '';
  const value = location as Record<string, unknown>;
  return String(value.formatted ?? value.text ?? value.name ?? value.structured ?? '').trim();
}

// Normalize the common requirements response shapes into a record array.
function requirementRecords(body: unknown): Record<string, any>[] {
  if (Array.isArray(body)) return body.filter((item) => item && typeof item === 'object');
  if (!body || typeof body !== 'object') return [];
  const value = body as Record<string, any>;
  const records = value.requirements ?? value.data?.requirements ?? value.data;
  return Array.isArray(records) ? records.filter((item) => item && typeof item === 'object') : [];
}

// Build listing filters from a saved requirement.
function requirementFilters(requirement: Record<string, any>): Record<string, string | number> {
  const filters: Record<string, string | number> = {};
  const location = listingLocationText(requirement.location);
  if (location) filters.location = location;
  if (typeof requirement.purpose === 'string' && requirement.purpose.trim()) filters.purpose = requirement.purpose.trim();
  const propertyType = Array.isArray(requirement.propertyType) ? requirement.propertyType.filter(Boolean).map(String) : requirement.propertyType;
  if (Array.isArray(propertyType) && propertyType.length) filters.propertyType = propertyType.join(',');
  else if (typeof propertyType === 'string' && propertyType.trim()) filters.propertyType = propertyType.trim();
  if (requirement.minBudget != null && requirement.minBudget !== '' && Number.isFinite(Number(requirement.minBudget))) filters.minPrice = Number(requirement.minBudget);
  if (requirement.maxBudget != null && requirement.maxBudget !== '' && Number.isFinite(Number(requirement.maxBudget))) filters.maxPrice = Number(requirement.maxBudget);
  return filters;
}

// Load location and budget matches plus requirement based recommendations without duplicates.
function useRelatedListings(property: Record<string, any> | null, currentId: string) {
  const [similar, setSimilar] = useState<RelatedListing[]>([]);
  const [recommended, setRecommended] = useState<RelatedListing[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!property || !currentId) return;
    const activeProperty = property;
    let active = true;
    async function load() {
      setLoading(true);
      const location = listingLocationText(activeProperty.location);
      const price = listingTotalPriceNumber(activeProperty);
      const similarFilters: Record<string, string | number> = {};
      if (location) similarFilters.location = location;
      if (price) {
        similarFilters.minPrice = Math.floor(price * 0.9);
        similarFilters.maxPrice = Math.ceil(price * 1.1);
      }
      try {
        const [similarResponse, requirementsResponse] = await Promise.all([
          Object.keys(similarFilters).length
            ? logica.estate.listings.search({ filters: similarFilters, statuses: ['active'], limit: RELATED_LISTING_LIMIT })
            : Promise.resolve(null),
          logica.estate.requirement.my.list({ limit: 50, offset: 0 }),
        ]);
        const similarItems = similarResponse?.ok && Array.isArray(similarResponse.body?.listings)
          ? similarResponse.body.listings.filter((item: any) => String(item?.id) !== currentId) as RelatedListing[]
          : [];
        if (!active) return;
        setSimilar(similarItems.slice(0, RELATED_LISTING_LIMIT));

        const requirements = requirementsResponse.ok ? requirementRecords(requirementsResponse.body) : [];
        const candidates = new Map<string, RelatedListing>();
        for (const requirement of requirements) {
          const filters = requirementFilters(requirement);
          if (!Object.keys(filters).length) continue;
          const response = await logica.estate.listings.search({ filters, statuses: ['active'], limit: RELATED_LISTING_LIMIT });
          if (!response.ok || !Array.isArray(response.body?.listings)) continue;
          for (const item of response.body.listings as RelatedListing[]) {
            const itemId = String(item?.id ?? '');
            if (!itemId || itemId === currentId) continue;
            candidates.set(itemId, item);
            if (candidates.size >= RELATED_LISTING_LIMIT * 2) break;
          }
          if (candidates.size >= RELATED_LISTING_LIMIT * 2) break;
        }
        if (!active) return;
        const similarIds = new Set(similarItems.map((item) => String(item.id)));
        setRecommended([...candidates.values()].filter((item) => !similarIds.has(String(item.id))).slice(0, RELATED_LISTING_LIMIT));
      } catch {
        if (active) { setSimilar([]); setRecommended([]); }
      } finally {
        if (active) setLoading(false);
      }
    }
    void load();
    return () => { active = false; };
  }, [property, currentId]);

  return { similar, recommended, loading };
}

export default function PropertyDetails() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useAppTheme();
  const { slug: routeSlug } = useLocalSearchParams<{ slug: string | string[] }>();
  const slug = Array.isArray(routeSlug) ? routeSlug[0] : routeSlug ?? '';
  const id = slug.includes('--') ? slug.slice(slug.lastIndexOf('--') + 2) : slug;
  const { width: screenWidth } = useWindowDimensions();
  const [property, setProperty] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [savingAction, setSavingAction] = useState(false);
  const { similar, recommended, loading: relatedLoading } = useRelatedListings(property, id);
  const [activeImage, setActiveImage] = useState(0);
  const [heroHeight, setHeroHeight] = useState(0);
  const scrollY = useRef(new Animated.Value(0)).current;
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
    recordActivity('page.open', `/listings/${slug}`, { source: 'listingPage' });
    void logica.estate.listings(id).get(PROPERTY_REPRESENTATIVES_INCLUDE).then((response) => {
      console.log('[listing api response]', JSON.stringify(response, null, 2));
      if (response.ok && response.body?.success && response.body.listing) {
        const loadedProperty = response.body.listing;
        setProperty(loadedProperty);
        if (loadedProperty?.id) saveVisitedProperty(loadedProperty);
      } else {
        const storedProperty = getStoredProperty(id);
        if (storedProperty) setProperty(storedProperty);
        else setError(true);
      }
    }).catch((error) => {
      const storedProperty = getStoredProperty(id);
      if (storedProperty) setProperty(storedProperty);
      else setError(true);
    }).finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (!id) return;
    void logica.estate.listings.saved.list({ account: 'me', limit: 100, offset: 0 }).then((savedResponse) => {
      const body = savedResponse.body as any;
      const records = Array.isArray(body?.data) ? body.data : Array.isArray(body?.saved) ? body.saved : Array.isArray(body?.savedProperties) ? body.savedProperties : [];
      setIsSaved(savedResponse.ok && records.some((item: any) => String(item.propertyId ?? item.property_id ?? item.property?.id) === String(id)));
    }).catch((loadError) => {});
  }, [id]);

  async function toggleSaved() {
    if (!id || savingAction) return;
    setSavingAction(true);
    try {
      const response = isSaved
        ? await logica.estate.listings.saved.remove({ propertyId: String(id) })
        : await logica.estate.listings.saved.save(String(id));
      const body = response.body as any;
      if (!response.ok || body?.success === false) throw new Error(body?.error || 'Unable to update saved property.');
      setIsSaved(!isSaved);
      recordActivity(isSaved ? 'property.save.remove' : 'property.save', String(id), { source: 'propertyPage' });
    } catch (actionError) {
    } finally {
      setSavingAction(false);
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
    const price = pricingText(property, activeAreaUnit);
    const slug = String(property?.slug ?? property?.seo?.slug ?? property?.id ?? id);
    const url = `https://neupgroup.com/estate/properties/${slug}`;
    const message = `Hello, I found a great ${propertyType} from ${location} for just ${price}.\n\n${url}`;

    recordActivity('property.share', id, { source: 'propertyPage' });
    try {
      await Share.share({ message });
    } catch (shareError) {
    }
  };

  const images: string[] = Array.isArray(property?.images) ? property.images.map(imageUri).filter(Boolean) : [];
  const category = first(property?.category) || 'Property';
  const purpose = first(property?.purpose);
  const activeAreaUnit = areaUnitOverride ?? areaUnitPreference;
  const mortgagePrice = listingTotalPriceNumber(property ?? {});
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
  const formattedArea = formatPropertyArea(areaValue, activeAreaUnit, property?.areaUnit ?? details?.areaUnit);
  const roomAndSpacing: { label: string; value: unknown; icon: BaseIconName; onPress?: () => void }[] = [
    { label: 'Area', value: formattedArea, icon: 'area' as const, onPress: cycleAreaUnit },
    { label: 'Floors', value: details?.floors ?? property?.floors, icon: 'home' as const },
    { label: 'Bedroom', value: details?.bedrooms ?? details?.bedroom ?? property?.bedrooms ?? property?.bedroom, icon: 'bed' as const },
    { label: 'Living room', value: details?.livingRooms ?? details?.livingrooms ?? details?.livingRoom ?? details?.livingroom ?? property?.livingRooms ?? property?.livingrooms ?? property?.livingRoom ?? property?.livingroom, icon: 'home' as const },
    { label: 'Kitchen', value: details?.kitchen ?? property?.kitchen, icon: 'home' as const },
    { label: 'Bathroom', value: details?.bathrooms ?? details?.bathroom ?? property?.bathrooms ?? property?.bathroom, icon: 'shower' as const },
    { label: 'Dining room', value: details?.dining ?? details?.diningRoom ?? property?.dining ?? property?.diningRoom, icon: 'home' as const },
    { label: 'Store room', value: details?.storeRooms ?? details?.storerooms ?? details?.storeRoom ?? property?.storeRooms ?? property?.storerooms ?? property?.storeRoom, icon: 'home' as const },
    { label: 'Car parking', value: details?.carParkingSpots ?? details?.carparkingspots ?? details?.carparking ?? details?.carParking ?? property?.carParkingSpots ?? property?.carparkingspots ?? property?.carparking ?? property?.carParking, icon: 'parking' as const },
    { label: 'Bike parking', value: details?.bikeParkingSpots ?? details?.bikeparkingspots ?? details?.bikeparking ?? details?.bikeParking ?? property?.bikeParkingSpots ?? property?.bikeparkingspots ?? property?.bikeparking ?? property?.bikeParking, icon: 'parking' as const },
  ].filter((item) => item.value !== null && item.value !== undefined && item.value !== '');

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <HeaderFloating scrollY={scrollY} headerHeight={heroHeight}>
        <View style={styles.floatingActionsRow}>
          <TouchableOpacity accessibilityRole="button" accessibilityLabel="Go back" style={styles.circleButton} onPress={() => router.back()}><BaseIcon name="arrow-left" size={18} color="#173d35" /></TouchableOpacity>
          <View style={styles.floatingActions}>
            <TouchableOpacity style={styles.circleButton} accessibilityLabel={isSaved ? 'Remove from favourites' : 'Save to favourites'} disabled={savingAction} onPress={() => void toggleSaved()}><BaseIcon name="love" size={18} color={isSaved ? '#bd5a50' : '#173d35'} /></TouchableOpacity>
            <TouchableOpacity accessibilityLabel="Share property" style={styles.circleButton} onPress={() => void shareProperty()}><BaseIcon name="share" size={18} color="#173d35" /></TouchableOpacity>
          </View>
        </View>
      </HeaderFloating>
      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
        scrollEventThrottle={16}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: false })}
      >
        <View style={styles.hero} onLayout={(event) => setHeroHeight(event.nativeEvent.layout.height)}>
          {images.length > 0 ? <Reanimated.FlatList ref={carouselRef as any} data={images} horizontal pagingEnabled scrollEnabled directionalLockEnabled nestedScrollEnabled alwaysBounceHorizontal showsHorizontalScrollIndicator={false} style={styles.heroCarousel} scrollEventThrottle={16} onScroll={onImageScroll} keyExtractor={(image, index) => `${image}-${index}`} renderItem={({ item, index }) => <Pressable onPress={() => router.push(`/listings/${encodeURIComponent(slug)}/viewer?imageIndex=${index}`)} accessibilityLabel={`Open photo ${index + 1} full screen`}><Image source={{ uri: item }} style={[styles.heroImage, { width: screenWidth }]} /></Pressable>} onMomentumScrollEnd={(event) => { LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut); setActiveImage(Math.round(event.nativeEvent.contentOffset.x / event.nativeEvent.layoutMeasurement.width)); }} /> : <View style={styles.heroImagePlaceholder} />}
          <View pointerEvents="none" style={styles.heroShade} />
          <ImagePagination count={images.length} activeIndex={activeImage} scrollX={imageScrollX} width={screenWidth} onSelect={(index) => carouselRef.current?.scrollToIndex?.({ index, animated: true })} />
        </View>

        <View style={styles.body}>
          <View style={styles.eyebrowRow}><View style={styles.tagRow}><View style={styles.propertyTag}><Text name="caption">{formatPurpose(purpose, loading)}</Text></View><View style={styles.propertyTag}><Text name="caption">{toTitleCase(category)}</Text></View></View><Text name="caption">{formatUpdatedAt(property?.updatedAt)}</Text></View>
          <View style={styles.title}><Text name="title">{formatText(property?.title, loading ? 'Loading property…' : 'Property unavailable')}</Text></View>
          <View style={styles.location}><LocationIcon /><Text name="caption">{formatLocation(property?.location)}</Text></View>
          <View style={styles.price}><Text name="title">{pricingText(property, activeAreaUnit)}</Text></View>

          <PropertyHighlights items={[
            { value: details?.bedrooms ?? details?.bedroom ?? property?.bedrooms ?? property?.bedroom, label: 'Bedroom', icon: 'bed' },
            { value: details?.bathrooms ?? details?.bathroom ?? property?.bathrooms ?? property?.bathroom, label: 'Bathroom', icon: 'shower' },
            { value: formattedArea, label: 'Area', icon: 'area', onPress: cycleAreaUnit },
            { value: details?.parking ?? property?.parking, label: 'Parking', icon: 'parking' },
            { value: details?.floors ?? property?.floors, label: 'Floor', icon: 'home' },
          ].filter((item) => item.value !== null && item.value !== undefined && item.value !== '')} />

          <RoomsAndSpacing items={roomAndSpacing} />

          <Text name="title2" style={[styles.sectionTitle, { marginTop: betweenSectionsGap }]}>About this home</Text>
          <Text name="regular" style={{ marginTop: beforeItemGap }}>{property?.description || 'No description available.'}</Text>
          <PropertyFeaturesAmenities features={features} sectionTop={betweenSectionsGap} itemTop={beforeItemGap} />

          {images.length > 0 && <>
            <View style={[styles.gallerySectionHeader, { marginTop: betweenSectionsGap }]}>
              <View style={styles.galleryHeadingRow}>
                <Text name="title2" style={styles.sectionTitle}>Take a closer look</Text>
              </View>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.thumbs}>
              {images.slice(0, 7).map((image, index) => <TouchableOpacity key={`${image}-${index}`} activeOpacity={0.85} onPress={() => router.push(`/listings/${encodeURIComponent(slug)}/viewer?imageIndex=${index}`)} accessibilityLabel={`Open photo ${index + 1} full screen`}><Image source={{ uri: image }} style={styles.thumb} /></TouchableOpacity>)}
              {images.length > 7 ? (
                <TouchableOpacity style={styles.morePhotos} activeOpacity={0.8} onPress={() => router.push(`/listings/${encodeURIComponent(slug)}/gallery`)} accessibilityLabel={`Open gallery with ${images.length - 7} more photos`}>
                  <Text name="title3">+{images.length - 7}{'\n'}more images</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity style={styles.morePhotos} activeOpacity={0.8} onPress={() => router.push(`/listings/${encodeURIComponent(slug)}/gallery`)} accessibilityLabel="Open gallery; these are all the photos">
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

          {isMortgageEligibleListing(property, purpose) && mortgagePrice !== null ? <MortgageCalculator price={mortgagePrice} /> : null}

          <Text name="title2" style={[styles.sectionTitle, { marginTop: betweenSectionsGap }]}>Similar Properties</Text>
          <Text name="caption" style={styles.relatedDescription}>Homes in a similar location and within 10% of this budget.</Text>
          <View style={styles.similarGrid}>{similar.map((item) => <TouchableOpacity key={`similar-${item.id}`} style={styles.similarCard} activeOpacity={0.82} onPress={() => router.push(listingPath(item))}>
            {imageUri(Array.isArray(item.images) ? item.images[0] : item.image) ? <Image source={{ uri: imageUri(Array.isArray(item.images) ? item.images[0] : item.image) }} style={styles.similarImage} /> : <View style={[styles.similarImage, styles.similarImagePlaceholder]} />}
            <View style={styles.similarCardDetails}><Text name="title3" numberOfLines={2} style={styles.similarCardTitle}>{item.title || item.description || 'Property listing'}</Text><Text name="caption" numberOfLines={1} style={styles.similarCardLocation}>{formatLocation(item.location)}</Text><Text name="caption" numberOfLines={1} style={styles.similarCardPrice}>{pricingText(item, activeAreaUnit)}</Text></View>
          </TouchableOpacity>)}</View>
          {!relatedLoading && similar.length === 0 ? <Text name="caption" style={styles.relatedEmpty}>No similar properties found.</Text> : null}

          <Text name="title2" style={[styles.sectionTitle, { marginTop: betweenSectionsGap }]}>Recommended Properties</Text>
          <Text name="caption" style={styles.relatedDescription}>Listings matched to your saved requirements.</Text>
          {recommended.map((item) => <ProfilePropertyCard key={`recommended-${item.id}`} property={item} onPress={() => router.push(listingPath(item))} />)}
          {!relatedLoading && recommended.length === 0 ? <Text name="caption" style={styles.relatedEmpty}>No requirement matches found.</Text> : null}
          {relatedLoading && <ActivityIndicator color="#557d54" style={styles.relatedLoader} />}
        </View>
      </Animated.ScrollView>
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

function formatPurpose(purpose: unknown, loading: boolean) {
  if (typeof purpose === 'string' && purpose.trim()) {
    return toTitleCase(purpose);
  }
  return loading ? 'Loading' : 'Property';
}

// Show mortgage estimates only for sale listings in supported residential or land categories.
function isMortgageEligibleListing(property: Record<string, any> | null, purpose: unknown): boolean {
  if (!property) return false;
  const purposeText = String(first(purpose) ?? '').toLocaleLowerCase();
  if (!purposeText.includes('sell') && !purposeText.includes('sale')) return false;
  const categories = [property.category, property.type, property.propertyType]
    .flatMap((value) => Array.isArray(value) ? value : [value])
    .filter((value): value is string => typeof value === 'string')
    .map((value) => value.toLocaleLowerCase());
  return categories.some((value) => /house|home|land|apartment|flat/.test(value));
}

// Present an editable monthly mortgage estimate for a property's listed price.
function MortgageCalculator({ price }: { price: number }) {
  const [downPaymentPercent, setDownPaymentPercent] = useState(40);
  const [annualInterestRate, setAnnualInterestRate] = useState(60);
  const [loanTermYears, setLoanTermYears] = useState(20);
  const downPaymentRate = downPaymentPercent / 100;
  const annualRate = annualInterestRate;
  const years = loanTermYears;
  const loanAmount = price * (1 - downPaymentRate);
  const monthlyRate = annualRate / 100 / 12;
  const numberOfPayments = years * 12;
  const monthlyPayment = monthlyRate > 0
    ? loanAmount * monthlyRate * (1 + monthlyRate) ** numberOfPayments / ((1 + monthlyRate) ** numberOfPayments - 1)
    : numberOfPayments > 0 ? loanAmount / numberOfPayments : 0;

  return <View style={styles.mortgageSection}>
    <Text name="title2" style={styles.mortgageTitle}>Mortgage estimate</Text>
    <Text name="caption" style={styles.mortgageDescription}>Adjust the assumptions to estimate your monthly payment.</Text>
    <View style={styles.mortgageInputs}>
      <MortgageStepper label="Down payment" suffix="%" value={downPaymentPercent} step={1} minimum={0} maximum={100} onChange={setDownPaymentPercent} />
      <MortgageStepper label="Interest rate" suffix="%" value={annualInterestRate} step={0.5} minimum={0} maximum={100} onChange={setAnnualInterestRate} />
      <MortgageStepper label="Loan term" suffix="years" value={loanTermYears} step={1} minimum={1} maximum={50} onChange={setLoanTermYears} />
    </View>
    <View style={styles.mortgageResult}>
      <Text name="caption" style={styles.mortgageResultLabel}>Estimated monthly payment</Text>
      <Text name="title2" style={styles.mortgageAmount}>{formatNpr(monthlyPayment)}</Text>
      <Text name="caption" style={styles.mortgageResultLabel}>Estimated loan: {formatNpr(loanAmount)}</Text>
    </View>
    <Text name="caption" style={styles.mortgageDisclaimer}>Estimate only. Fees, taxes, and lender terms are not included.</Text>
  </View>;
}

// Render a mortgage assumption card with bounded decrement and increment controls.
function MortgageStepper({ label, suffix, value, step, minimum, maximum, onChange }: { label: string; suffix: string; value: number; step: number; minimum: number; maximum: number; onChange: (value: number) => void }) {
  return <View style={styles.mortgageStepper}>
    <Text name="caption" style={styles.mortgageInputLabel}>{label}</Text>
    <View style={styles.mortgageStepperControls}>
      <TouchableOpacity accessibilityRole="button" accessibilityLabel={`Decrease ${label.toLocaleLowerCase()}`} disabled={value <= minimum} onPress={() => onChange(Math.max(minimum, Number((value - step).toFixed(1))))} style={[styles.mortgageStepButton, value <= minimum && styles.mortgageStepButtonDisabled]}><Text name="title2" style={styles.mortgageStepSymbol}>−</Text></TouchableOpacity>
      <Text name="title3" style={styles.mortgageStepValue}>{value}{suffix === '%' ? '%' : ` ${suffix}`}</Text>
      <TouchableOpacity accessibilityRole="button" accessibilityLabel={`Increase ${label.toLocaleLowerCase()}`} disabled={value >= maximum} onPress={() => onChange(Math.min(maximum, Number((value + step).toFixed(1))))} style={[styles.mortgageStepButton, value >= maximum && styles.mortgageStepButtonDisabled]}><Text name="title2" style={styles.mortgageStepSymbol}>+</Text></TouchableOpacity>
    </View>
  </View>;
}

// Format rupee amounts using South Asian digit grouping.
function formatNpr(amount: number): string {
  if (!Number.isFinite(amount) || amount < 0) return 'NPR —';
  return `NPR ${Math.round(amount).toLocaleString('en-IN')}`;
}

function formatSharePropertyType(type: unknown) {
  const value = String(first(type) ?? '').toLowerCase();
  if (value.includes('land')) return 'land';
  if (value.includes('shop') || value.includes('commercial') || value.includes('space')) return 'shop space';
  return 'house';
}

function pricingText(property: any, areaPreference: AreaUnitPreference) {
  return formatPropertyPrice(property?.price, property?.area ?? property?.details?.house?.area ?? property?.details?.apartment?.area ?? property?.details?.land?.area, property?.areaUnit ?? property?.details?.areaUnit ?? property?.details?.house?.areaUnit ?? property?.details?.apartment?.areaUnit ?? property?.details?.land?.areaUnit, areaPreference);
}

// Return a numeric total only for prices without a per-unit or time-based basis.
function listingTotalPriceNumber(listing: Record<string, any>): number | null {
  const price = listing.price;
  if (price && typeof price === 'object') {
    const basis = typeof price.basis === 'string' ? price.basis : '';
    if (/per\s*[_-]?\s*(unit|month|year|day|week)/i.test(basis)) return null;
    const amount = Number(price.amount);
    return Number.isFinite(amount) && amount > 0 ? amount : null;
  }
  const amount = Number(price);
  return Number.isFinite(amount) && amount > 0 ? amount : null;
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
  container: { flex: 1, backgroundColor: '#ffffff' }, content: { paddingBottom: theme.spacing.space105 }, hero: { height: 330, position: 'relative' }, heroCarousel: { flex: 1 }, heroImage: { width: 392, height: '100%' }, heroImagePlaceholder: { width: '100%', height: '100%', backgroundColor: '#dfe7e3' }, heroShade: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(15,35,30,0.18)' }, floatingActionsRow: { minHeight: 44, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, floatingActions: { flexDirection: 'row', gap: theme.spacing.space10 }, circleButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#f1f5f1', alignItems: 'center', justifyContent: 'center' }, back: { color: '#173d35', fontSize: 34, lineHeight: 32, marginTop: theme.spacing.spaceNeg3 }, icon: { color: '#173d35', fontSize: 20 }, photoCount: { position: 'absolute', bottom: 20, right: 20, backgroundColor: 'rgba(23,61,53,0.88)', borderRadius: 18, paddingVertical: theme.spacing.space8, paddingHorizontal: theme.spacing.space13 }, photoText: { color: '#fff', fontSize: 12, fontWeight: '700' }, dots: { position: 'absolute', bottom: 25, left: 20, flexDirection: 'row', gap: theme.spacing.space5 }, dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.55)' }, activeDot: { width: 18, backgroundColor: '#fff' }, body: { padding: theme.spacing.space22, backgroundColor: '#ffffff' }, eyebrowRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }, tagRow: { flexDirection: 'row', gap: theme.spacing.space8, alignItems: 'center' }, propertyTag: { backgroundColor: '#eaf2e3', borderRadius: 999, paddingHorizontal: theme.spacing.space11, paddingVertical: theme.spacing.space5 }, eyebrow: { color: '#658b4f', fontSize: 11, letterSpacing: 1.5, fontWeight: '800' }, updated: { color: '#9aa6a2', fontSize: 11 }, title: { color: '#173d35', fontSize: 27, fontWeight: '800', lineHeight: 33, letterSpacing: -0.7, marginTop: theme.spacing.space10 }, location: { color: '#71847d', fontSize: 13, marginTop: headingDescriptionGap, flexDirection: 'row', alignItems: 'center', gap: theme.spacing.space5 }, price: { color: '#173d35', fontSize: 25, fontWeight: '800', marginTop: theme.spacing.space5 }, sectionTitle: { fontWeight: '700', letterSpacing: -0.3 }, sectionTitle: { color: '#173d35', fontSize: 18, fontWeight: '800', marginTop: theme.spacing.space25 }, description: { color: '#71817b', fontSize: 13, lineHeight: 21, marginTop: theme.spacing.space9 }, sectionDescription: { marginTop: theme.spacing.space4 }, gallerySectionHeader: { gap: theme.spacing.space4 }, galleryHeadingRow: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.space5 }, spaceTop: { marginTop: theme.spacing.space27 }, thumbs: { gap: theme.spacing.space10, paddingVertical: theme.spacing.space13 }, thumb: { width: 112, height: 86, borderRadius: 12, backgroundColor: '#e8edeb' }, morePhotos: { width: 88, height: 86, borderRadius: 12, backgroundColor: '#dce6d3', alignItems: 'center', justifyContent: 'center' }, morePhotosText: { color: '#42604b', fontWeight: '800', fontSize: 13, textAlign: 'center', lineHeight: 18 }, agentCard: { backgroundColor: '#eaf2e3', borderWidth: 1, borderColor: '#cbdcc5', borderRadius: 14, padding: theme.spacing.space12, flexDirection: 'row', alignItems: 'center' }, agentAvatarPlaceholder: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#dfe7e3' }, agentDetails: { flex: 1, marginLeft: theme.spacing.space11 }, agentLabel: { color: '#9aa6a2', fontSize: 9, letterSpacing: 1.2, fontWeight: '800' }, agentName: { color: '#173d35', fontWeight: '800', fontSize: 14, marginTop: theme.spacing.space3 }, agentCompany: { color: '#87958f', fontSize: 11, marginTop: theme.spacing.space3 }, agentArrow: { width: 34, height: 34, borderRadius: 17, backgroundColor: '#eef5e7', alignItems: 'center', justifyContent: 'center' }, arrow: { color: '#557d54', fontSize: 18 }, error: { position: 'absolute', top: 52, left: 70, right: 70, backgroundColor: '#fff', padding: theme.spacing.space10, borderRadius: 12 }, errorText: { color: '#b64d43', fontSize: 12 }, bottomBar: { position: 'absolute', bottom: 0, left: 0, right: 0, borderTopWidth: 1, borderTopColor: '#edf0ee', paddingHorizontal: theme.spacing.space20, paddingTop: theme.spacing.space13, flexDirection: 'row', gap: theme.spacing.space10 }, messageButton: { flex: 1, height: 48, borderRadius: 14, backgroundColor: '#173d35', alignItems: 'center', justifyContent: 'center' }, tourText: { color: '#d8f36a', fontWeight: '800', fontSize: 13 },
  mortgageSection: { marginTop: betweenSectionsGap }, mortgageTitle: { color: '#173d35' }, mortgageDescription: { color: '#71817b', marginTop: theme.spacing.space4, lineHeight: 18 }, mortgageInputs: { gap: theme.spacing.space10, marginTop: theme.spacing.space16 }, mortgageStepper: { gap: theme.spacing.space6 }, mortgageInputLabel: { color: '#71817b' }, mortgageStepperControls: { minHeight: 56, paddingHorizontal: theme.spacing.space10, borderWidth: 1, borderColor: '#dfe6e2', borderRadius: 12, backgroundColor: '#fff', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, mortgageStepButton: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#eaf2e3', alignItems: 'center', justifyContent: 'center' }, mortgageStepButtonDisabled: { opacity: 0.4 }, mortgageStepSymbol: { color: '#173d35', lineHeight: 24 }, mortgageStepValue: { color: '#173d35' }, mortgageResult: { marginTop: theme.spacing.space16, paddingVertical: theme.spacing.space14, borderTopWidth: 1, borderBottomWidth: 1, borderColor: '#dfe6e2' }, mortgageResultLabel: { color: '#587166' }, mortgageAmount: { color: '#173d35', marginVertical: theme.spacing.space4 }, mortgageDisclaimer: { color: '#87958f', marginTop: theme.spacing.space10, lineHeight: 17 },
  relatedDescription: { color: '#71817b', marginTop: -theme.spacing.space4, marginBottom: theme.spacing.space12 }, relatedEmpty: { color: '#87958f', marginBottom: theme.spacing.space8 }, relatedLoader: { marginVertical: theme.spacing.space12 }, similarGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }, similarCard: { width: '48.5%', overflow: 'hidden', borderWidth: 1, borderColor: '#dfe6e2', borderRadius: 14, marginBottom: theme.spacing.space12, backgroundColor: '#fff' }, similarImage: { width: '100%', height: 112, backgroundColor: '#e8edeb' }, similarImagePlaceholder: { backgroundColor: '#dfe7e3' }, similarCardDetails: { padding: theme.spacing.space10 }, similarCardTitle: { color: '#27413a', minHeight: 38 }, similarCardLocation: { color: '#71817b', marginTop: theme.spacing.space5 }, similarCardPrice: { color: '#173d35', fontWeight: '700', marginTop: theme.spacing.space5 },
  dotsAnimated: { position: 'absolute', bottom: 25, left: 20, height: 18, flexDirection: 'row', gap: theme.spacing.space1 }, dotsBackdrop: { ...StyleSheet.absoluteFill, top: -5, bottom: -5, left: -8, right: -8, borderRadius: 999, overflow: 'hidden' }, dotSlot: { width: 11, height: 18, alignItems: 'center', justifyContent: 'center' }, savedHeart: { color: '#d94b4b' },
});
