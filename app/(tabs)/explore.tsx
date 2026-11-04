import { AppPressable as TouchableOpacity } from '@/components/element/touch-feedback';
import { StatusBar } from 'expo-status-bar';
import { Animated, Image, NativeScrollEvent, NativeSyntheticEvent, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Text } from '@neup/components/ui/text';
import theme from '@base/theme.json';
import { BaseIcon } from '@/components/element/base-icon';
import { HeaderFloating, HeaderStatic } from '@neup/components/ui/header';
import { logica } from '@neup/logica';
import type { EstateLocation } from '@neup/logica/estate/locations';

type TrendingDestination = {
  id: string;
  name: string;
  count: string;
  image: string;
};

const betweenSectionsGap = theme.spacing.betweenSections;
const destinationImages = [
  'https://images.unsplash.com/photo-1531218150217-54595bc2b934?w=800&q=85',
  'https://images.unsplash.com/photo-1510798831971-661eb04b3739?w=800&q=85',
  'https://images.unsplash.com/photo-1494526585095-c41746248156?w=800&q=85',
];

// Convert API location records into the compact cards used by Explore.
function toTrendingDestinations(locations: EstateLocation[]): TrendingDestination[] {
  return locations.map((location, index) => ({
    id: String(location.id),
    name: location.title,
    count: location.parent?.title ?? 'Explore homes',
    image: typeof location.image === 'string'
      ? location.image
      : typeof location.imageUrl === 'string'
        ? location.imageUrl
        : destinationImages[index % destinationImages.length],
  }));
}

// Load trending destination data from the estate locations API.
function useTrendingDestinations() {
  const [destinations, setDestinations] = useState<TrendingDestination[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let isCurrent = true;

    async function loadDestinations() {
      try {
        const response = await logica.estate.locations.list({ limit: 10, offset: 0 });
        if (!isCurrent) return;
        if (!response.ok || !response.body?.data) {
          setError(true);
          return;
        }
        setDestinations(toTrendingDestinations(response.body.data));
      } catch {
        if (isCurrent) setError(true);
      } finally {
        if (isCurrent) setLoading(false);
      }
    }

    void loadDestinations();
    return () => { isCurrent = false; };
  }, []);

  return { destinations, loading, error };
}

export default function Explore() {
  const router = useRouter();
  const [headerHeight, setHeaderHeight] = useState(0);
  const scrollY = useRef(new Animated.Value(0)).current;
  const { destinations, loading, error } = useTrendingDestinations();

  // Keep the shared sticky header synchronized with Explore scrolling.
  function handleScroll(event: NativeSyntheticEvent<NativeScrollEvent>) {
    scrollY.setValue(Math.max(0, event.nativeEvent.contentOffset.y));
  }

  return <View style={s.page}>
    <StatusBar style="dark" />
    <HeaderFloating scrollY={scrollY} headerHeight={headerHeight}><Text name="title2" size={20} lineHeight={27}>Let's find a Place!</Text></HeaderFloating>
    <Animated.ScrollView contentContainerStyle={s.content} onScroll={handleScroll} scrollEventThrottle={16}>
      <HeaderStatic onHeightChange={setHeaderHeight} style={[s.exploreHeader, s.compactHeaderSpacing]}><Text name="title">Let's find a Place!</Text><Text name="exploreSubtitle" style={s.introSubtitle}>Find a neighbourhood that feels like you.</Text></HeaderStatic>
      <TouchableOpacity style={s.search} activeOpacity={0.8} onPress={() => router.push('/search')}><BaseIcon name="search" size={18} color="#173d35" style={s.searchIcon} /><Text name="explorePlaceholder">Search a city or neighborhood</Text></TouchableOpacity>
      <Text name="title2">Trending Destinations</Text><Text name="exploreSubtitle" style={s.trendingSubtitle}>Explore places worth calling home.</Text>
      {loading ? <Text name="exploreSubtitle" style={s.stateMessage}>Loading destinations…</Text> : null}
      {!loading && error ? <Text name="exploreSubtitle" style={s.stateMessage}>Destinations are unavailable right now.</Text> : null}
      {!loading && !error && destinations.length === 0 ? <Text name="exploreSubtitle" style={s.stateMessage}>No destinations to show yet.</Text> : null}
      {destinations.map(destination => <TouchableOpacity style={s.card} key={destination.id} activeOpacity={0.9} accessibilityRole="button" accessibilityLabel={`View ${destination.name}`} onPress={() => router.push(`/locations/${encodeURIComponent(destination.name.toLocaleLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''))}--${encodeURIComponent(destination.id)}`)}><Image source={{ uri: destination.image }} style={s.image} /><View style={s.overlay}><Text name="explorePlaceName">{destination.name}</Text><View style={s.placeCount}><Text name="explorePlaceCount">{destination.count}</Text><BaseIcon name="arrow-left" rotation={180} size={14} color="#fff" /></View></View></TouchableOpacity>)}
      <Text name="title2" style={s.browseHeading}>Browse by lifestyle</Text><View style={s.tags}>{['Quiet & calm', 'Walkable', 'Room to grow', 'Design lovers'].map(t => <TouchableOpacity style={s.tag} key={t}><Text name="exploreTag">{t}</Text></TouchableOpacity>)}</View>
    </Animated.ScrollView>
  </View>;
}

const s = StyleSheet.create({ page: { flex: 1, backgroundColor: '#ffffff' }, content: { paddingHorizontal: theme.spacing.space20, paddingBottom: theme.spacing.space100 }, exploreHeader: { marginHorizontal: -theme.spacing.space20 }, compactHeaderSpacing: { marginBottom: -theme.spacing.space10 }, introSubtitle: { marginTop: theme.spacing.headingDescriptionGap }, search: { height: 51, borderRadius: 14, borderWidth: 1, borderColor: '#cdd8d3', backgroundColor: '#fff', flexDirection: 'row', alignItems: 'center', paddingHorizontal: theme.spacing.space15, marginTop: 0, marginBottom: theme.spacing.space27 }, searchIcon: { marginRight: theme.spacing.space8 }, section: { marginBottom: theme.spacing.space14, marginTop: theme.spacing.space4 }, trendingSubtitle: { marginTop: theme.spacing.headingDescriptionGap, marginBottom: theme.spacing.space16 }, stateMessage: { marginBottom: theme.spacing.space16 }, browseHeading: { marginTop: betweenSectionsGap }, card: { height: 145, borderRadius: 18, overflow: 'hidden', marginBottom: theme.spacing.space14 }, image: { width: '100%', height: '100%' }, overlay: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: theme.spacing.space16, backgroundColor: 'rgba(14,43,36,.62)' }, placeCount: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.space6 }, tags: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.space9 }, tag: { backgroundColor: '#fff', borderRadius: 20, paddingHorizontal: theme.spacing.space15, paddingVertical: theme.spacing.space11 } });
