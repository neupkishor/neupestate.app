import { AppPressable as TouchableOpacity } from '@/components/element/touch-feedback';
import { ProfilePropertyCard } from '@/components/element/profile-property-card';
import { BaseIcon } from '@/components/element/base-icon';
import { Text } from '@neup/components/ui/text';
import { logica } from '@neup/logica';
import type { EstateLocation } from '@neup/logica/estate/locations';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Animated, Image, NativeScrollEvent, NativeSyntheticEvent, StyleSheet, View } from 'react-native';
import { HeaderFloating, HeaderStatic } from '@neup/components/ui/header';
import theme from '@base/theme.json';
import { listingPath } from '@/components/element/listing-route';

type LocationProperty = Record<string, any> & { id: string };
type LocationProfile = EstateLocation & { description?: string; lifestyle?: Record<string, unknown>; lifestyleIndex?: Record<string, unknown> };
const sampleLifestyleIndices = [
  { title: 'Walkability', score: 4.5, note: 'Easy to get around' },
  { title: 'Dining', score: 4.0, note: 'Local favorites nearby' },
  { title: 'Quiet', score: 3.5, note: 'A calmer pace of life' },
];
const sampleDesignCards = [
  { title: 'Green streets', detail: 'Tree lined routes and neighborhood parks', icon: 'location' },
  { title: 'Local character', detail: 'Distinctive homes and familiar places', icon: 'home' },
  { title: 'Everyday convenience', detail: 'Useful stops close to home', icon: 'location' },
];

// Resolve a location route segment against the location list, accepting either an ID or a slug.
function locationSlugMatches(location: EstateLocation, slug: string): boolean {
  const decoded = decodeURIComponent(slug).toLocaleLowerCase();
  const titleSlug = location.title.toLocaleLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  return location.id === decoded || titleSlug === decoded || `${titleSlug}--${location.id}` === decoded;
}

// Load location details and its property listings for the detail page.
function useLocationPage(slug: string) {
  const [location, setLocation] = useState<LocationProfile | null>(null);
  const [properties, setProperties] = useState<LocationProperty[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let current = true;
    async function load() {
      setLoading(true);
      setError(false);
      try {
        const response = await logica.estate.locations.list({ limit: 100, offset: 0 });
        const match = response.ok ? response.body?.data?.find((item) => locationSlugMatches(item, slug)) : undefined;
        if (!match) { if (current) { setLocation(null); setError(true); } return; }
        const listingResponse = await logica.estate.listings.search({ filters: { location: match.title }, limit: 30 });
        if (!current) return;
        setLocation(match as LocationProfile);
        setProperties(listingResponse.ok && Array.isArray(listingResponse.body?.listings) ? listingResponse.body.listings as LocationProperty[] : []);
      } catch {
        if (current) setError(true);
      } finally {
        if (current) setLoading(false);
      }
    }
    if (slug) void load();
    return () => { current = false; };
  }, [slug]);

  return { location, properties, loading, error };
}

// Read the location from route parameters and render its overview sections.
export default function LocationDetail() {
  const router = useRouter();
  const { slug: routeSlug } = useLocalSearchParams<{ slug: string | string[] }>();
  const slug = Array.isArray(routeSlug) ? routeSlug[0] : routeSlug ?? '';
  const { location, properties, loading, error } = useLocationPage(slug);
  const [headerHeight, setHeaderHeight] = useState(0);
  const scrollY = useRef(new Animated.Value(0)).current;
  function handleScroll(event: NativeSyntheticEvent<NativeScrollEvent>) {
    scrollY.setValue(Math.max(0, event.nativeEvent.contentOffset.y));
  }

  return <View style={styles.page}>
    <HeaderFloating scrollY={scrollY} headerHeight={headerHeight}><View style={styles.floatingTitle}><TouchableOpacity accessibilityRole="button" accessibilityLabel="Go back" onPress={() => router.back()} style={styles.floatingBack}><BaseIcon name="arrow-left" size={18} color="#173d35" /></TouchableOpacity><Text name="title2" size={20} lineHeight={27} numberOfLines={1}>{location?.title ?? 'Location'}</Text></View></HeaderFloating>
    <Animated.ScrollView contentContainerStyle={styles.content} onScroll={handleScroll} scrollEventThrottle={16} showsVerticalScrollIndicator={false}>
      <HeaderStatic onHeightChange={setHeaderHeight} style={styles.staticHeader}><TouchableOpacity accessibilityRole="button" accessibilityLabel="Go back" onPress={() => router.back()} style={styles.back}><BaseIcon name="arrow-left" size={18} color="#173d35" /><Text name="regular" style={styles.backText}>Back</Text></TouchableOpacity></HeaderStatic>
      {loading ? <ActivityIndicator color="#557d54" style={styles.state} /> : error || !location ? <Text name="regular" style={styles.state}>This location is unavailable.</Text> : <>
        <Text name="title" style={styles.title}>{location.title}{location.parent?.title ? `, ${location.parent.title}` : ''}</Text>
        {typeof location.description === 'string' && location.description.trim() ? <Text name="regular" style={styles.description}>{location.description}</Text> : null}

        <View style={styles.statCard}><Text name="title2" style={styles.statValue}>{properties.length}</Text><Text name="caption" style={styles.statLabel}>Listings</Text></View>

        <Text name="title2" style={styles.sectionTitle}>Lifestyle</Text>
        <View style={styles.lifestyleGrid}>{sampleLifestyleIndices.map((item) => <View key={item.title} style={styles.indexCard}><View style={styles.indexHeader}><Text name="caption" style={styles.statLabel}>{item.title}</Text><View style={styles.rating}><Text name="title3" style={styles.indexScore}>{item.score % 1 ? item.score.toFixed(1) : item.score.toFixed(0)}</Text><Text name="title3" style={styles.starIcon}>★</Text></View></View><Text name="caption" style={styles.indexNote}>{item.note}</Text></View>)}</View>
        <Text name="title3" style={styles.designHeading}>Neighborhood highlights</Text>
        {sampleDesignCards.map((item) => <View key={item.title} style={styles.designCard}><View style={styles.designIcon}><BaseIcon name={item.icon as 'home' | 'location'} size={18} color="#557d54" /></View><View style={styles.designCopy}><Text name="title3" style={styles.lifestyleValue}>{item.title}</Text><Text name="caption" style={styles.indexNote}>{item.detail}</Text></View><BaseIcon name="arrow-left" rotation={180} size={15} color="#87958f" /></View>)}

        <Text name="title2" style={styles.sectionTitle}>Properties</Text>
        {properties.length ? properties.map((property) => <ProfilePropertyCard key={String(property.id)} property={property} onPress={() => router.push(listingPath(property))} />) : <Text name="caption" style={styles.empty}>No properties listed here yet.</Text>}

        <Text name="title2" style={styles.sectionTitle}>Active agencies</Text>
        {Array.from(new Set(properties.flatMap((property) => representatives(property).filter(isAgency).map(representativeName)).filter(Boolean))).map((name) => <View key={name} style={styles.nameCard}><Text name="title3">{name}</Text></View>)}
        {!properties.some((property) => representatives(property).some(isAgency)) ? <Text name="caption" style={styles.empty}>No active agencies.</Text> : null}

        <Text name="title2" style={styles.sectionTitle}>Active agents</Text>
        {uniqueAgents(properties).map((agent) => <View key={agent.id} style={styles.agentCard}>{agent.image ? <Image source={{ uri: agent.image }} style={styles.agentImage} /> : <View style={styles.agentImage} />}<View style={styles.agentInfo}><Text name="title3">{agent.name}</Text>{agent.agency ? <Text name="caption" style={styles.statLabel}>{agent.agency}</Text> : null}</View></View>)}
        {!uniqueAgents(properties).length ? <Text name="caption" style={styles.empty}>No active agents.</Text> : null}
      </>}
    </Animated.ScrollView>
  </View>;
}

// Return listing representatives in the formats supported by the estate API.
function representatives(property: LocationProperty): Record<string, any>[] {
  const values = property.representatives ?? property.representation ?? property.agents ?? [];
  return Array.isArray(values) ? values.filter((value) => value && typeof value === 'object') : [];
}

// Determine whether a representative is an agency.
function isAgency(person: Record<string, any>): boolean {
  return person.isAgency === true || String(person.type ?? person.role ?? '').toLocaleLowerCase().includes('agency');
}

// Get a representative's display name.
function representativeName(person: Record<string, any>): string {
  return String(person.name ?? person.title ?? '').trim();
}

// Collect unique active agents across the location's property listings.
function uniqueAgents(properties: LocationProperty[]) {
  const agents = new Map<string, { id: string; name: string; agency?: string; image?: string }>();
  properties.flatMap(representatives).filter((person) => !isAgency(person)).forEach((person, index) => {
    const name = representativeName(person);
    if (!name) return;
    const id = String(person.id ?? name ?? index);
    agents.set(id, { id, name, agency: person.agency?.name ?? person.agencyName, image: person.image ?? person.avatar ?? person.photo });
  });
  return [...agents.values()];
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: '#fff' }, content: { paddingHorizontal: theme.spacing.space20, paddingBottom: theme.spacing.space60 }, staticHeader: { marginHorizontal: -theme.spacing.space20, paddingBottom: theme.spacing.space8 }, floatingTitle: { minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: theme.spacing.space8 }, floatingBack: { width: 26, height: 44, justifyContent: 'center' },
  back: { minHeight: 44, alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: theme.spacing.space6 }, backText: { color: '#173d35' },
  title: { color: '#173d35', marginTop: theme.spacing.space12 }, description: { color: '#71817b', marginTop: theme.spacing.space8, lineHeight: 21 }, state: { marginTop: theme.spacing.space40, color: '#71817b', textAlign: 'center' },
  statCard: { borderRadius: 16, backgroundColor: '#eaf2e3', padding: theme.spacing.space18, marginTop: theme.spacing.space20 }, statValue: { color: '#173d35' }, statLabel: { color: '#71817b', textTransform: 'capitalize', marginTop: theme.spacing.space4 }, sectionTitle: { color: '#173d35', marginTop: theme.spacing.space27, marginBottom: theme.spacing.space12 },
  lifestyleGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.space10 }, indexCard: { flexGrow: 1, minWidth: '46%', borderRadius: 14, borderWidth: 1, borderColor: '#dfe6e2', padding: theme.spacing.space14 }, indexHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }, rating: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.space4 }, indexScore: { color: '#173d35' }, starIcon: { color: '#c38b35', fontSize: 17 }, indexNote: { color: '#71817b', marginTop: theme.spacing.space6 }, designHeading: { color: '#27413a', marginTop: theme.spacing.space18, marginBottom: theme.spacing.space10 }, designCard: { flexDirection: 'row', alignItems: 'center', padding: theme.spacing.space12, borderRadius: 14, backgroundColor: '#f6f8f5', marginBottom: theme.spacing.space8 }, designIcon: { width: 38, height: 38, borderRadius: 12, backgroundColor: '#eaf2e3', justifyContent: 'center', alignItems: 'center' }, designCopy: { flex: 1, marginHorizontal: theme.spacing.space10 }, lifestyleValue: { color: '#173d35', marginTop: theme.spacing.space2 }, empty: { color: '#87958f', marginVertical: theme.spacing.space8 }, nameCard: { padding: theme.spacing.space14, borderWidth: 1, borderColor: '#dfe6e2', borderRadius: 14, marginBottom: theme.spacing.space10 }, agentCard: { flexDirection: 'row', alignItems: 'center', padding: theme.spacing.space12, borderWidth: 1, borderColor: '#dfe6e2', borderRadius: 14, marginBottom: theme.spacing.space10 }, agentImage: { width: 46, height: 46, borderRadius: 23, backgroundColor: '#dfe7e3' }, agentInfo: { marginLeft: theme.spacing.space12, flex: 1 },
});
