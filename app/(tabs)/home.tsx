import { AppPressable as TouchableOpacity } from '@/components/element/touch-feedback';
import { StatusBar } from 'expo-status-bar';
import { Animated, Image, NativeScrollEvent, NativeSyntheticEvent, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useAuthSession } from '@neup/auth/AuthSessionProvider';
import { useUserInfo } from '@neup/auth/auth';

import logica from '@neup/logica';
import { Text } from '@neup/components/ui/text';
import { PropertyCardSkeleton } from '@/components/element/propertyCard.skeleton';
import { ListingCard, type ListingCardProperty } from '@/components/element/listing-card';
import { RequirementsSection } from '@/components/section/requirements';
import { getWelcomeCopy, WelcomeBlock } from '@/components/section/welcome-block';
import { recordActivity } from '@neup/core/database/estate';
import theme from '@base/theme.json';
import { listingPath } from '@/components/element/listing-route';
import AppIcon from '@base/images/icon.png';
import { HeaderFloating, HeaderStatic } from '@neup/components/ui/header';
import { getAreaUnitPreference, type AreaUnitPreference } from '@base/area-units';

const betweenSectionsGap = theme.spacing.betweenSections;

type HomeProperty = ListingCardProperty;

function imageUri(value: unknown): string {
  if (typeof value === 'string') return value;
  if (!value || typeof value !== 'object') return '';

  const image = value as {
    uri?: unknown;
    url?: unknown;
    src?: unknown;
  };

  return imageUri(image.uri ?? image.url ?? image.src);
}

// Resolve a readable property category for the listing card summary.
function homeListingType(listing: Record<string, any>): string {
  const value = listing.category ?? listing.listingType ?? listing.propertyType ?? listing.type;
  const label = Array.isArray(value) ? value[0] : value;
  if (typeof label === 'string' && label.trim()) return capitalizeListingLabel(label.trim());
  if (label && typeof label === 'object') return capitalizeListingLabel(String(label.name ?? label.title ?? 'Property'));
  return 'Property';
}

// Capitalize a listing label without changing the remainder of its casing.
function capitalizeListingLabel(value: string): string {
  return value ? value.charAt(0).toLocaleUpperCase() + value.slice(1) : value;
}

// Convert common sale and rental purpose values into concise listing copy.
function homeListingPurpose(value: unknown): string {
  const purpose = Array.isArray(value) ? value[0] : value;
  if (typeof purpose !== 'string' || !purpose.trim()) return 'For sale';
  const normalized = purpose.trim().toLocaleLowerCase();
  if (normalized.includes('rent') || normalized.includes('lease')) return 'Rent';
  if (normalized.includes('sell') || normalized === 'sale') return 'Sale';
  const trimmedPurpose = purpose.trim();
  return trimmedPurpose.charAt(0).toLocaleUpperCase() + trimmedPurpose.slice(1);
}

// Read bedroom, bathroom, and area details for the property photo overlay.
function homePropertyFeatures(listing: Record<string, any>): Pick<HomeProperty, 'bedrooms' | 'bathrooms' | 'kitchens' | 'area'> {
  const details = listing.details?.house ?? listing.details?.apartment ?? listing.details?.land ?? listing.details?.flat ?? listing.details?.space ?? listing.details ?? {};
  return {
    bedrooms: featureValue(details.bedrooms ?? details.bedroom ?? listing.bedrooms ?? listing.bedroom),
    bathrooms: featureValue(details.bathrooms ?? details.bathroom ?? listing.bathrooms ?? listing.bathroom),
    kitchens: featureValue(details.kitchens ?? details.kitchen ?? listing.kitchens ?? listing.kitchen),
    area: details.area ?? listing.area,
  };
}

// Convert a listing feature value into concise display text.
function featureValue(value: unknown): string {
  if (value === null || value === undefined || value === '') return '';
  if (typeof value === 'object') {
    const record = value as Record<string, unknown>;
    return featureValue(record.value ?? record.amount ?? record.count ?? record.name);
  }
  return String(value);
}

// Load the saved property IDs so card hearts match the signed-in account.
async function loadSavedListingIds(): Promise<Set<string> | null> {
  try {
    const response = await logica.estate.listings.saved.list({ account: 'me', limit: 100, offset: 0 });
    const body = response.body as any;
    const records = Array.isArray(body?.data) ? body.data : Array.isArray(body?.saved) ? body.saved : Array.isArray(body?.savedProperties) ? body.savedProperties : [];
    if (!response.ok || body?.success === false) return null;
    return new Set(records.map((record: any) => String(record.propertyId ?? record.property_id ?? record.property?.id ?? '')).filter(Boolean));
  } catch {
    return null;
  }
}

// Format location values returned as text or structured place objects.
function homeLocationText(value: unknown): string {
  if (typeof value === 'string' && value.trim()) return value.trim();
  if (!value || typeof value !== 'object') return 'Location unavailable';
  const location = value as Record<string, any>;
  const formatted = location.formatted ?? location.text ?? location.name;
  if (typeof formatted === 'string' && formatted.trim()) return formatted.trim();
  if (location.structured && typeof location.structured === 'object') {
    const parts = ['address', 'neighborhood', 'city', 'state', 'country'].map((key) => location.structured[key]).filter((part) => typeof part === 'string' && part.trim());
    if (parts.length) return parts.join(', ');
  }
  return 'Location unavailable';
}

const PAGE_SIZE = 10;

export default function Home() {
  const router = useRouter();
  const user = useUserInfo();
  const welcomeCopy = getWelcomeCopy(user);
  const { error: accountError, retry: retryAccount } = useAuthSession();
  const [areaUnitPreference, setAreaUnitPreference] = useState<AreaUnitPreference>('Aana system');
  const [savedListingIds, setSavedListingIds] = useState<Set<string>>(new Set());
  const [savingListingIds, setSavingListingIds] = useState<Set<string>>(new Set());
  const [properties, setProperties] = useState<HomeProperty[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [headerHeight, setHeaderHeight] = useState(0);

  const loadingMoreRef = useRef(false);
  const offsetRef = useRef(0);
  const hasMoreRef = useRef(true);
  const scrollY = useRef(new Animated.Value(0)).current;

  // Save or remove a listing and update its card heart after the API confirms the change.
  async function toggleSavedListing(propertyId: string) {
    if (savingListingIds.has(propertyId)) return;
    const isSaved = savedListingIds.has(propertyId);
    setSavingListingIds((current) => new Set(current).add(propertyId));
    try {
      const response = isSaved
        ? await logica.estate.listings.saved.remove({ propertyId })
        : await logica.estate.listings.saved.save(propertyId);
      const body = response.body as any;
      if (!response.ok || body?.success === false) return;
      setSavedListingIds((current) => {
        const next = new Set(current);
        if (isSaved) next.delete(propertyId);
        else next.add(propertyId);
        return next;
      });
      recordActivity(isSaved ? 'property.save.remove' : 'property.save', propertyId, { source: 'homeFeed' });
    } catch {
    } finally {
      setSavingListingIds((current) => {
        const next = new Set(current);
        next.delete(propertyId);
        return next;
      });
    }
  }

const loadProperties = async (isRefresh = false) => {
  if (isRefresh) {
    if (loadingMoreRef.current) {
      return;
    }

    setRefreshing(true);

    offsetRef.current = 0;
    hasMoreRef.current = true;

    setHasMore(true);

  } else {
    if (loadingMoreRef.current || !hasMoreRef.current) {
      return;
    }

    setLoadingMore(true);
  }

  loadingMoreRef.current = true;
  setError(null);

  const requestOffset = isRefresh
    ? 0
    : offsetRef.current;

  try {

    const response = await logica.estate.listings.list({
      limit: PAGE_SIZE,
      offset: requestOffset,
      status: 'active',
      fields: ['id', 'slug', 'title', 'description', 'images', 'location', 'pricing', 'status', 'purpose', 'category', 'type', 'propertyType', 'details', 'area', 'bedrooms', 'bedroom', 'bathrooms', 'bathroom'],
    });

    const responseBody = response.body as any;
    const listings = Array.isArray(responseBody?.listings)
      ? responseBody.listings
      : Array.isArray(responseBody?.data?.listings)
        ? responseBody.data.listings
        : Array.isArray(responseBody?.data)
          ? responseBody.data
          : null;

    if (!response.ok || responseBody?.success === false) {
      setError(responseBody?.error || 'Unable to load properties.');
      return;
    }

    if (!listings) {
      setError(responseBody?.error || 'Unable to load properties.');
      return;
    }

    const liveHomes: HomeProperty[] = await Promise.all(
      listings
        .filter((item: any) => String(item?.status ?? '').toLowerCase() === 'active')
      .map((item: any) => {
        const image = Array.isArray(item.images)
          ? item.images[0]
          : item.image;

        return {
          id: String(item.id),
          slug: typeof item.slug === 'string' ? item.slug : typeof item.seo?.slug === 'string' ? item.seo.slug : undefined,
          listingType: homeListingType(item),
          purpose: homeListingPurpose(item.purpose),
          ...homePropertyFeatures(item),

          location: homeLocationText(item.location),

          price:
            item.pricing?.raw ||
            (
              item.price != null
                ? `NPR ${item.price}`
                : 'Price on request'
            ),

          image: imageUri(image),
        };

      }),
    );

    const nextOffset = requestOffset + listings.length;

    if (isRefresh) {
      setProperties(liveHomes);
    } else {
      setProperties((current) => {
        const existingIds = new Set(
          current.map(
            (property) => property.id,
          ),
        );

        const uniqueNewProperties =
          liveHomes.filter(
            (property) =>
              !existingIds.has(property.id),
          );

        return [
          ...current,
          ...uniqueNewProperties,
        ];
      });
    }

    offsetRef.current = nextOffset;

    // A full page means more may be available. Let an empty follow-up
    // request determine the end, including when the total is a multiple
    // of PAGE_SIZE or the API's totalCount is page-scoped.
    const moreAvailable = listings.length === PAGE_SIZE;

    hasMoreRef.current =
      moreAvailable;

    setHasMore(
      moreAvailable,
    );
  } catch (loadError) {
    setError(loadError instanceof Error ? loadError.message : 'Unable to load properties.');
  } finally {
    setLoading(false);
    setRefreshing(false);
    setLoadingMore(false);

    loadingMoreRef.current = false;
  }
};

  // Track the measured header transition and continue loading as the feed approaches its end.
  function handleHomeScroll(event: NativeSyntheticEvent<NativeScrollEvent>) {
    const { contentSize, layoutMeasurement, contentOffset } = event.nativeEvent;
    scrollY.setValue(Math.max(0, contentOffset.y));
    if (contentOffset.y > 0) {
      recordActivity('propertyFeed.scroll', 'properties', { offset: contentOffset.y });
    }
    const distanceToBottom = contentSize.height - (contentOffset.y + layoutMeasurement.height);
    if (
      properties.length >= PAGE_SIZE &&
      distanceToBottom <= layoutMeasurement.height * 0.75 &&
      hasMoreRef.current &&
      !loadingMoreRef.current
    ) {
      void loadProperties();
    }
  }

  useEffect(() => {
    void loadProperties();
  }, []);

  useFocusEffect(useCallback(() => {
    let isActive = true;
    void getAreaUnitPreference().then((preference) => {
      if (isActive) setAreaUnitPreference(preference);
    });
    void loadSavedListingIds().then((listingIds) => {
      if (isActive && listingIds) setSavedListingIds(listingIds);
    });
    return () => { isActive = false; };
  }, []));

  return (
    <View style={s.page}>
      <StatusBar style="dark" />
      <HeaderFloating scrollY={scrollY} headerHeight={headerHeight}>
        <View style={s.brand}><Image source={AppIcon} style={s.brandLogo} /><Text name="title2" size={20} lineHeight={27} style={s.brandText}>Neup.Estates</Text></View>
      </HeaderFloating>

      <ScrollView
        contentContainerStyle={s.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => void loadProperties(true)}
            tintColor="#557d54"
            colors={['#557d54']}
          />
        }
        onScroll={handleHomeScroll}
        scrollEventThrottle={100}
      >
        <HeaderStatic onHeightChange={setHeaderHeight} style={s.homeHeader}>
          <View style={[s.brand, s.staticBrand]}><Image source={AppIcon} style={s.brandLogo} /><Text name="title" style={s.brandText}>Hello {welcomeCopy.firstName}!</Text></View>
          <Text name="exploreSubtitle" style={s.welcomeDescription}>{welcomeCopy.description}</Text>
          <WelcomeBlock showGreeting={false} />
        </HeaderStatic>
        {accountError && <TouchableOpacity onPress={() => void retryAccount()} accessibilityRole="button"><Text name="propertyError">{accountError} Tap to retry your account.</Text></TouchableOpacity>}

        <RequirementsSection />

        <View style={s.listingsHeading}>
          <Text name="title2">
            Recent Listings
          </Text>
          <Text name="caption" style={s.listingsDescription}>
            Find the latest properties added to Neup.Estates.
          </Text>
        </View>

        {(loading || refreshing) &&
          Array.from({ length: 3 }, (_, index) => (
            <PropertyCardSkeleton
              key={`property-skeleton-${index}`}
            />
          ))}

        {error && !loading && !refreshing && (
          <Text style={s.status}>
            {error}
          </Text>
        )}

        {!loading && !refreshing && properties.map((h) => (
          <ListingCard
            key={h.id}
            property={h}
            areaUnitPreference={areaUnitPreference}
            isSaved={savedListingIds.has(h.id)}
            isSaving={savingListingIds.has(h.id)}
            onOpen={() => router.push(listingPath(h))}
            onToggleSaved={() => void toggleSavedListing(h.id)}
          />
        ))}

        {loadingMore && (
          <View style={s.loadingMoreContainer}>
            <PropertyCardSkeleton />
            <PropertyCardSkeleton />
          </View>
        )}

        {!hasMore &&
          properties.length > 0 &&
          !loading && (
            <Text style={s.endText}>
              You've reached the end.
            </Text>
          )}
      </ScrollView>
    </View>
  );
}

export const s = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: '#ffffff',
  },

  header: { paddingHorizontal: theme.spacing.space20, paddingTop: theme.spacing.space20, paddingBottom: theme.spacing.space16, flexDirection: 'row', alignItems: 'center', gap: theme.spacing.space14 },

  brand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.space9,
  },

  logo: {
    width: 36,
    height: 36,
    borderRadius: 9,
  },

  brandText: {
    color: '#173d35',
  },

  avatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#e5eddf',
    alignItems: 'center',
    justifyContent: 'center',
  },

  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 17,
  },

  content: {
    padding: theme.spacing.space20,
    paddingTop: 0,
    paddingBottom: theme.spacing.space100,
  },

  homeHeader: {
    marginHorizontal: -theme.spacing.space20,
    paddingTop: theme.spacing.space72,
    paddingHorizontal: theme.spacing.space20,
    paddingBottom: theme.spacing.space8,
  },

  staticBrand: {
    alignItems: 'flex-end',
    gap: theme.spacing.space4,
  },

  brandLogo: {
    width: 36,
    height: 36,
  },

  welcomeDescription: {
    marginTop: 0,
  },

  kicker: {
    color: '#8a8f8d',
    marginTop: theme.spacing.space14,
  },

  listingsHeading: {
    marginTop: betweenSectionsGap,
    marginBottom: theme.spacing.space14,
  },

  listingsDescription: {
    marginTop: theme.spacing.space1,
    color: '#81918b',
  },

  section: {
    color: '#173d35',
    fontSize: 18,
    fontWeight: '800',
  },

  status: {
    color: '#81918b',
    fontSize: 12,
    marginBottom: theme.spacing.space12,
  },

  loadingMoreContainer: {
    gap: theme.spacing.space18,
  },

  endText: {
    textAlign: 'center',
    color: '#9aa6a2',
    fontSize: 12,
    paddingVertical: theme.spacing.space20,
  },
});
