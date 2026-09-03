import { StatusBar } from 'expo-status-bar';
import {
  Image,
  RefreshControl,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';

import { listProperties } from '#/logica/estate/properties/list';
import { Text } from '#/components/ui/text';
import { PropertyCardSkeleton } from '@/components/element/propertyCard.skeleton';
import { RequirementsSection } from '@/components/section/requirements';
import { WelcomeBlock } from '@/components/section/welcome-block';
import spacing from '$/spacing.json';
import AppIcon from '../../base/images/icon.png';

const betweenSectionsGap = Number.parseInt(spacing.gap.betweenSections, 10);

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
const LOAD_MORE_AFTER = 7;

export default function Home() {
  const router = useRouter();
  const [properties, setProperties] = useState<HomeProperty[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadingMoreRef = useRef(false);
  const offsetRef = useRef(0);
  const hasMoreRef = useRef(true);
  const cardPositions = useRef<Record<number, number>>({});

const loadProperties = async (isRefresh = false) => {
  if (isRefresh) {
    if (loadingMoreRef.current) {
      return;
    }

    setRefreshing(true);

    offsetRef.current = 0;
    hasMoreRef.current = true;

    setOffset(0);
    setHasMore(true);

    // IMPORTANT:
    // Do NOT clear cardPositions here.
    //
    // Existing cards may keep their React keys after refresh,
    // meaning onLayout might not fire again.
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
        refresh: isRefresh,
      },
    );

    const response = await listProperties({
      limit: PAGE_SIZE,
      offset: requestOffset,
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
      response.body.properties.map((item: any) => {
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

    const nextOffset =
      requestOffset + liveHomes.length;

    if (isRefresh) {
      /*
       * Keep positions for the refreshed first page.
       *
       * Remove positions belonging to old pages
       * that no longer exist after refresh.
       */
      const refreshedPositions: Record<number, number> = {};

      for (
        let index = 0;
        index < liveHomes.length;
        index++
      ) {
        const existingPosition =
          cardPositions.current[index];

        if (existingPosition !== undefined) {
          refreshedPositions[index] =
            existingPosition;
        }
      }

      cardPositions.current =
        refreshedPositions;

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
    setOffset(nextOffset);

    const totalCount =
      response.body.totalCount;

    const moreAvailable =
      liveHomes.length === PAGE_SIZE &&
      (
        totalCount == null ||
        nextOffset < totalCount
      );

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
        totalCount,
        hasMore: moreAvailable,
      },
    );
  } catch (error) {
    console.error(
      'Failed to load properties:',
      error,
    );

    setError(
      'Unable to load properties.',
    );
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

      <View style={s.header}>
        <View style={s.brand}>
          <Image source={AppIcon} style={s.logo} />

          <Text name="appTitle">
            Neup.Estate
          </Text>
        </View>

        <TouchableOpacity
          style={s.avatar}
          activeOpacity={0.8}
          onPress={() => router.push('/profile')}
        >
          <Text>KM</Text>
        </TouchableOpacity>
      </View>

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
          const {
            layoutMeasurement,
            contentOffset,
          } = event.nativeEvent;

          const viewportBottom =
            contentOffset.y + layoutMeasurement.height;

          const viewedThrough = Object.entries(
            cardPositions.current,
          ).reduce(
            (furthest, [index, top]) =>
              top <= viewportBottom
                ? Math.max(furthest, Number(index))
                : furthest,
            -1,
          );

          /*
           * PAGE_SIZE = 10
           * LOAD_MORE_AFTER = 7
           *
           * First page:
           * 10 - (10 - 7) - 1
           * = 6
           *
           * Index 6 = seventh card.
           *
           * Second page:
           * 20 loaded
           * trigger index = 16
           *
           * So the next request happens after reaching
           * the seventh card of each currently loaded batch.
           */
          const loadMoreThreshold =
            properties.length -
            (PAGE_SIZE - LOAD_MORE_AFTER) -
            1;

          if (
            properties.length >= PAGE_SIZE &&
            viewedThrough >= loadMoreThreshold &&
            hasMoreRef.current &&
            !loadingMoreRef.current
          ) {
            void loadProperties();
          }
        }}
        scrollEventThrottle={100}
      >
        <WelcomeBlock />

        <RequirementsSection />

        <View style={s.row}>
          <Text name="sectionTitle">
            Popular near you
          </Text>

          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => router.push('/explore')}
          >
            <Text style={s.link}>
              Explore all →
            </Text>
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

        {!loading && !refreshing && properties.map((h, index) => (
          <TouchableOpacity
            key={h.id}
            style={s.card}
            activeOpacity={0.85}
            onLayout={(event) => {
              cardPositions.current[index] =
                event.nativeEvent.layout.y;
            }}
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
              <Text name="propertyPrice" style={s.price}>
                {h.price}
              </Text>

              <Text name="propertyTitle" style={s.title}>
                {h.title}
              </Text>

              <Text name="propertyLocation" style={s.location}>
                ⌖ {h.location}
              </Text>

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
    backgroundColor: '#f6f7f9',
  },

  header: {
    height: 88,
    paddingTop: 38,
    paddingHorizontal: 20,
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    elevation: 12,
    shadowColor: '#173d35',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.24,
    shadowRadius: 12,
    zIndex: 10,
  },

  brand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
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
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#e5eddf',
    alignItems: 'center',
    justifyContent: 'center',
  },

  content: {
    padding: 20,
    paddingBottom: 100,
  },

  kicker: {
    color: '#8a8f8d',
    marginTop: 14,
  },

  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: betweenSectionsGap,
    marginBottom: 14,
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

  status: {
    color: '#81918b',
    fontSize: 12,
    marginBottom: 12,
  },

  card: {
    backgroundColor: '#fff',
    borderRadius: 18,
    overflow: 'hidden',
    marginBottom: 18,
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
    padding: 15,
  },

  price: {
  },

  title: {
    marginTop: 5,
  },

  location: {
    marginTop: 7,
  },

  meta: {
    marginTop: 9,
  },

  loadingMoreContainer: {
    gap: 18,
  },

  endText: {
    textAlign: 'center',
    color: '#9aa6a2',
    fontSize: 12,
    paddingVertical: 20,
  },
});
