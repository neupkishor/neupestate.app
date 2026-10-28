import { AppPressable as TouchableOpacity } from '@/components/element/touch-feedback';
import { StatusBar } from 'expo-status-bar';
import { Image, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
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
import { WelcomeBlock } from '@/components/section/welcome-block';
import { recordActivity } from '@neup/core/database/estate';
import theme from '@base/theme.json';
import AppIcon from '@base/images/icon.png';

const betweenSectionsGap = theme.spacing.betweenSections;

type HomeProperty = {
  id: string;
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
  const { loading: accountLoading, error: accountError, retry: retryAccount } = useAuthSession();
  const displayImage = getDisplayImage(user);
  const [failedImage, setFailedImage] = useState<string | null>(null);
  const [properties, setProperties] = useState<HomeProperty[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadingMoreRef = useRef(false);
  const offsetRef = useRef(0);
  const hasMoreRef = useRef(true);

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
    console.log(
      '[properties] requesting',
      {
        limit: PAGE_SIZE,
        offset: requestOffset,
        status: 'active',
        refresh: isRefresh,
      },
    );

    const response = await logica.estate.property.list({
      limit: PAGE_SIZE,
      offset: requestOffset,
      status: 'active',
      fields: ['id', 'title', 'description', 'images', 'location', 'pricing', 'status'],
    });

    if (!response.ok) {
      setError('Unable to load properties.');
      return;
    }

    if (!Array.isArray(response.body?.properties)) {
      setError('Unable to load properties.');
      return;
    }

    const liveHomes: HomeProperty[] =
      response.body.properties
        .filter((item: any) => String(item?.status ?? '').toLowerCase() === 'active')
        .map((item: any) => {
        const image = Array.isArray(item.images)
          ? item.images[0]
          : item.image;

        return {
          id: String(item.id),

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

    const nextOffset = requestOffset + response.body.properties.length;

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
    const moreAvailable = response.body.properties.length === PAGE_SIZE;

    hasMoreRef.current =
      moreAvailable;

    setHasMore(
      moreAvailable,
    );

    console.log(
      '[properties] received',
      {
        received: liveHomes.length,
        nextOffset,
        hasMore: moreAvailable,
      },
    );
  } catch (error) {
    console.error(
      'Failed to load properties:',
      error,
    );

    setError('Unable to load properties.');
  } finally {
    setLoading(false);
    setRefreshing(false);
    setLoadingMore(false);

    loadingMoreRef.current = false;
  }
};

  useEffect(() => {
    void loadProperties();
  }, []);

  return (
    <View style={s.page}>
      <StatusBar style="dark" />

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
        onScroll={(event) => {
          if (event.nativeEvent.contentOffset.y > 0) {
            recordActivity('propertyFeed.scroll', 'properties', { offset: event.nativeEvent.contentOffset.y });
          }
          const { contentSize, layoutMeasurement, contentOffset } = event.nativeEvent;
          const distanceToBottom = contentSize.height - (contentOffset.y + layoutMeasurement.height);

          if (
            properties.length >= PAGE_SIZE &&
            distanceToBottom <= layoutMeasurement.height * 0.75 &&
            hasMoreRef.current &&
            !loadingMoreRef.current
          ) {
            void loadProperties();
          }
        }}
        scrollEventThrottle={100}
      >
        <WelcomeBlock />
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
              router.push(`/property/${h.id}`)
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
    paddingTop: theme.spacing.space76,
    paddingBottom: theme.spacing.space100,
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
