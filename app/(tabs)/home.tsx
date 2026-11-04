import { AppPressable as TouchableOpacity } from '@/components/element/touch-feedback';
import { StatusBar } from 'expo-status-bar';
import { Animated, Image, NativeScrollEvent, NativeSyntheticEvent, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { useAuthSession } from '@neup/auth/AuthSessionProvider';
import { useUserInfo } from '@neup/auth/auth';
import { getDisplayImage, getInitials } from '@neup/auth/user-info';

import logica from '@neup/logica';
import { Text } from '@neup/components/ui/text';
import { PropertyCardSkeleton } from '@/components/element/propertyCard.skeleton';
import { LocationIcon } from '@/components/element/location-icon';
import { BaseIcon } from '@/components/element/base-icon';
import { RequirementsSection } from '@/components/section/requirements';
import { getWelcomeCopy, WelcomeBlock } from '@/components/section/welcome-block';
import { recordActivity } from '@neup/core/database/estate';
import theme from '@base/theme.json';
import { listingPath } from '@/components/element/listing-route';
import AppIcon from '@base/images/icon.png';
import { HeaderFloating, HeaderStatic } from '@neup/components/ui/header';

const betweenSectionsGap = theme.spacing.betweenSections;

type HomeProperty = {
  id: string;
  slug?: string;
  title: string;
  location: string;
  price: string;
  image: string;
};

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

const PAGE_SIZE = 10;

export default function Home() {
  const router = useRouter();
  const user = useUserInfo();
  const welcomeCopy = getWelcomeCopy(user);
  const { loading: accountLoading, error: accountError, retry: retryAccount } = useAuthSession();
  const displayImage = getDisplayImage(user);
  const [failedImage, setFailedImage] = useState<string | null>(null);
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
      fields: ['id', 'slug', 'title', 'description', 'images', 'location', 'pricing', 'status'],
    });

    if (!response.ok) {
      setError('Unable to load properties.');
      return;
    }

    if (!Array.isArray(response.body?.listings)) {
      setError('Unable to load properties.');
      return;
    }

    const liveHomes: HomeProperty[] =
      response.body.listings
        .filter((item: any) => String(item?.status ?? '').toLowerCase() === 'active')
        .map((item: any) => {
        const image = Array.isArray(item.images)
          ? item.images[0]
          : item.image;

        return {
          id: String(item.id),
          slug: typeof item.slug === 'string' ? item.slug : typeof item.seo?.slug === 'string' ? item.seo.slug : undefined,

          title:
            item.title ||
            item.description ||
            'Property listing',

          location:
            typeof item.location === 'string'
              ? item.location
              : item.location?.formatted ||
                'Location unavailable',

          price:
            item.pricing?.raw ||
            (
              item.price != null
                ? `NPR ${item.price}`
                : 'Price on request'
            ),

          image: imageUri(image),
        };

      });

    const nextOffset = requestOffset + response.body.listings.length;

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
    const moreAvailable = response.body.listings.length === PAGE_SIZE;

    hasMoreRef.current =
      moreAvailable;

    setHasMore(
      moreAvailable,
    );
  } catch (error) {

    setError('Unable to load properties.');
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

        <View style={s.row}>
          <Text name="title2">
            Popular near you
          </Text>

          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => router.push('/explore')}
          >
            <View style={s.linkRow}><Text style={s.link}>Explore all</Text><BaseIcon name="arrow-left" rotation={180} size={14} color="#557d54" /></View>
          </TouchableOpacity>
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
          <TouchableOpacity
            key={h.id}
            style={s.card}
            activeOpacity={0.85}
            onPress={() =>
              router.push(listingPath(h))
            }
          >
            {h.image ? (
              <Image
                source={{ uri: h.image }}
                style={s.image}
              />
            ) : (
              <View style={s.imagePlaceholder} />
            )}

            <View style={s.cardText}>
              <Text name="title2" style={s.price}>
                {h.price}
              </Text>

              <Text name="title2" color="#70817c" style={s.title}>
                {h.title}
              </Text>

              <View style={[s.location, s.locationRow]}><LocationIcon /><Text name="caption">{h.location}</Text></View>

            </View>
          </TouchableOpacity>
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

  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: betweenSectionsGap,
    marginBottom: theme.spacing.space14,
  },

  section: {
    color: '#173d35',
    fontSize: 18,
    fontWeight: '800',
  },

  link: {
    color: '#557d54',
    fontSize: 12,
    fontWeight: '700',
  },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.space5,
  },

  status: {
    color: '#81918b',
    fontSize: 12,
    marginBottom: theme.spacing.space12,
  },

  card: {
    backgroundColor: '#fff',
    borderRadius: 18,
    overflow: 'hidden',
    marginBottom: theme.spacing.space18,
  },

  image: {
    width: '100%',
    height: 190,
  },

  imagePlaceholder: {
    width: '100%',
    height: 190,
    backgroundColor: '#dfe7e3',
  },

  cardText: {
    padding: theme.spacing.space15,
  },

  price: {
  },

  title: {
    marginTop: theme.spacing.space5,
  },

  location: {
    marginTop: theme.spacing.space7,
  },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.space4 },

  meta: {
    marginTop: theme.spacing.space9,
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
