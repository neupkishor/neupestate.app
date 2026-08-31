import { StatusBar } from 'expo-status-bar';
import {
  Image,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';

import { listEstateProperties } from '#/logica/estate/property/list';
import { PropertyCardSkeleton } from '@/components/element/propertyCard.skeleton';

type HomeProperty = {
  id: string;
  title: string;
  location: string;
  price: string;
  image: string;
};

export default function Home() {
  const router = useRouter();

  const [properties, setProperties] = useState<HomeProperty[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadProperties = async (isRefresh = false) => {
      if (isRefresh) setRefreshing(true);
      setError(null);
      try {
        const response = await listEstateProperties({
          limit: 18,
        });

        if (!response.ok) {
          setError('Unable to load properties.');
          return;
        }

        if (!Array.isArray(response.body?.properties)) {
          setError('Unable to load properties.');
          return;
        }

        const liveHomes: HomeProperty[] = response.body.properties.map(
          (item: any) => {
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

              price: item.pricing?.raw || (item.price != null ? `NPR ${item.price}` : 'Price on request'),

              image:
                typeof image === 'string'
                  ? image
                  : image?.url ||
                    '',
            };
          },
        );

        setProperties(liveHomes);
      } catch (error) {
        console.error('Failed to load properties:', error);
        setError('Unable to load properties.');
      } finally {
        setLoading(false);
        setRefreshing(false);
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
          <Text style={s.logo}>N</Text>

          <Text style={s.brandText}>
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
      >
        <Text style={s.kicker}>
          GOOD MORNING
        </Text>

        <Text style={s.heading}>
          Find your next place
        </Text>

        <Text style={s.sub}>
          Homes shared by people who know them best.
        </Text>

        <View style={s.search}>
          <Text style={s.searchIcon}>
            ⌕
          </Text>

          <Text style={s.placeholder}>
            Search city, neighborhood, or ZIP
          </Text>

          <Text style={s.filter}>
            ☷
          </Text>
        </View>

        <View style={s.row}>
          <Text style={s.section}>
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

        {loading && Array.from({ length: 3 }, (_, index) => (
          <PropertyCardSkeleton key={`property-skeleton-${index}`} />
        ))}

        {error && !loading && <Text style={s.status}>{error}</Text>}

        {properties.map((h) => (
          <TouchableOpacity
            key={h.id}
            style={s.card}
            onPress={() => router.push(`/property/${h.id}`)}
          >
              <Image
                source={{ uri: h.image }}
                style={s.image}
              />

              <View style={s.cardText}>
              <Text style={s.price}>
                {h.price}
              </Text>

              <Text style={s.title}>
                {h.title}
              </Text>

              <Text style={s.location}>
                ⌖ {h.location}
              </Text>

              <Text style={s.meta}>
                Live listing from Neup Estate
              </Text>
              </View>
          </TouchableOpacity>
        ))}
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
  },

  brand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
  },

  logo: {
    backgroundColor: '#173d35',
    color: '#d8f36a',
    fontSize: 19,
    fontWeight: '800',
    padding: 5,
    borderRadius: 9,
  },

  brandText: {
    color: '#173d35',
    fontSize: 19,
    fontWeight: '700',
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
    color: '#78908a',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.5,
    marginTop: 14,
  },

  heading: {
    color: '#173d35',
    fontSize: 29,
    fontWeight: '800',
    marginTop: 7,
  },

  sub: {
    color: '#70817c',
    fontSize: 14,
    marginTop: 7,
  },

  search: {
    height: 51,
    borderRadius: 14,
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    marginTop: 20,
    marginBottom: 27,
  },

  searchIcon: {
    fontSize: 25,
    color: '#173d35',
    marginRight: 8,
  },

  placeholder: {
    flex: 1,
    color: '#9aa6a2',
    fontSize: 13,
  },

  filter: {
    color: '#173d35',
    fontSize: 20,
  },

  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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

  cardText: {
    padding: 15,
  },

  price: {
    color: '#173d35',
    fontSize: 18,
    fontWeight: '800',
  },

  title: {
    color: '#27413a',
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 20,
    marginTop: 5,
  },

  location: {
    color: '#81918b',
    fontSize: 12,
    marginTop: 7,
  },

  meta: {
    color: '#9aa6a2',
    fontSize: 11,
    marginTop: 9,
  },

  nav: {
    position: 'absolute',
    bottom: 0,
    height: 74,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#edf0ee',
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },

  navIcon: {
    textAlign: 'center',
    color: '#9aa6a2',
    fontSize: 22,
  },

  navText: {
    color: '#9aa6a2',
    fontSize: 10,
    marginTop: 2,
    textAlign: 'center',
  },

  active: {
    color: '#173d35',
    fontWeight: '800',
  },

  post: {
    backgroundColor: '#173d35',
    borderRadius: 17,
    width: 48,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
  },

  plus: {
    color: '#d8f36a',
    fontSize: 25,
  },
});
