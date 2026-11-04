import { AppPressable as TouchableOpacity } from '@/components/element/touch-feedback';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Animated, Image, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View, NativeSyntheticEvent, NativeScrollEvent } from 'react-native';
import { Input } from '@neup/components/ui/input';
import { Text } from '@neup/components/ui/text';
import { BaseIcon } from '@/components/element/base-icon';
import { useLocalSearchParams, useRouter } from 'expo-router';
import logica from '@neup/logica';
import { recordActivity } from '@neup/core/database/estate';
import { HeaderFloating, HeaderStatic } from '@neup/components/ui/header';
import theme from '@base/theme.json';

const SEARCH_PAGE_SIZE = 15;

function imageUri(value: unknown): string {
  if (typeof value === 'string') return value;
  if (!value || typeof value !== 'object') return '';
  const image = value as { uri?: unknown; url?: unknown; src?: unknown };
  return imageUri(image.uri ?? image.url ?? image.src);
}

function propertyImage(item: any) {
  return imageUri(Array.isArray(item.images) ? item.images[0] : item.image);
}

export default function Search() {
  const router = useRouter();
  const { location: locationParam } = useLocalSearchParams<{ location?: string | string[] }>();
  const [term, setTerm] = useState('');
  const [submitted, setSubmitted] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [totalCount, setTotalCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [headerHeight, setHeaderHeight] = useState(0);
  const scrollY = useRef(new Animated.Value(0)).current;
  const currentPage = useRef(1);
  const loadingMoreRef = useRef(false);
  const hasMoreRef = useRef(false);
  const headerTitle = locationFilter
    ? `Homes in ${locationFilter}`
    : submitted ? `Searching ${submitted.trim()}` : 'Search properties';

  useEffect(() => {
    const location = Array.isArray(locationParam) ? locationParam[0]?.trim() : locationParam?.trim();
    setLocationFilter(location ?? '');
    setTerm(location ?? '');
    setSubmitted('');
  }, [locationParam]);

  // Keep the shared header animation synchronized with the search scroll position.
  function handleScroll(event: NativeSyntheticEvent<NativeScrollEvent>) {
    scrollY.setValue(Math.max(0, event.nativeEvent.contentOffset.y));
    const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
    const distanceToBottom = contentSize.height - (contentOffset.y + layoutMeasurement.height);
    if (results.length >= SEARCH_PAGE_SIZE && distanceToBottom <= layoutMeasurement.height * 0.75 && hasMoreRef.current && !loadingMoreRef.current) {
      void loadMoreResults();
    }
  }

  // Fetch the next page when the user approaches the end of the current results.
  async function loadMoreResults() {
    const query = submitted.trim();
    const location = locationFilter.trim();
    if ((!query && !location) || loading || loadingMoreRef.current || !hasMoreRef.current) return;

    loadingMoreRef.current = true;
    setLoadingMore(true);
    const nextPage = currentPage.current + 1;
    try {
      const response = await logica.estate.properties.search({ search: query || undefined, location: location || undefined, page: nextPage, limit: SEARCH_PAGE_SIZE });
      const nextProperties = response.ok && Array.isArray(response.body?.properties) ? response.body.properties : [];
      if (!nextProperties.length) {
        hasMoreRef.current = false;
        return;
      }
      currentPage.current = nextPage;
      hasMoreRef.current = nextProperties.length === SEARCH_PAGE_SIZE;
      setResults((current) => [...current, ...nextProperties]);
      if (typeof response.body?.totalCount === 'number') setTotalCount(response.body.totalCount);
    } catch {
      // Allow the user to retry by scrolling near the bottom again.
    } finally {
      loadingMoreRef.current = false;
      setLoadingMore(false);
    }
  }

  useEffect(() => {
    const query = submitted.trim();
    const location = locationFilter.trim();
    if (!query && !location) { setResults([]); setTotalCount(null); currentPage.current = 1; return; }
    recordActivity('search.make', query || location);
    currentPage.current = 1;
    hasMoreRef.current = false;
    loadingMoreRef.current = false;
    setResults([]);
    setTotalCount(null);
    setLoading(true);
    void logica.estate.properties.search({ search: query || undefined, location: location || undefined, limit: SEARCH_PAGE_SIZE })
      .then((response) => {
        const properties = response.ok && Array.isArray(response.body?.properties) ? response.body.properties : [];
        setResults(properties);
        hasMoreRef.current = properties.length === SEARCH_PAGE_SIZE;
        setTotalCount(response.ok && typeof response.body?.totalCount === 'number' ? response.body.totalCount : properties.length);
      })
      .catch(() => { setResults([]); setTotalCount(0); hasMoreRef.current = false; })
      .finally(() => setLoading(false));
  }, [submitted, locationFilter]);

  return <View style={styles.page}>
    <HeaderFloating scrollY={scrollY} headerHeight={headerHeight}>
      <View style={styles.floatingHeaderContent}><TouchableOpacity accessibilityRole="button" accessibilityLabel="Go back" onPress={() => router.back()} style={styles.floatingBack}><BaseIcon name="arrow-left-bold" size={20} color="#173d35" /></TouchableOpacity><Text name="title2" size={20} lineHeight={27} numberOfLines={1}>{headerTitle}</Text></View>
    </HeaderFloating>
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" onScroll={handleScroll} scrollEventThrottle={100}>
        <HeaderStatic onHeightChange={setHeaderHeight} style={styles.compactHeaderSpacing}>
          <TouchableOpacity accessibilityRole="button" accessibilityLabel="Go back" onPress={() => router.back()} style={styles.staticBack}><BaseIcon name="arrow-left" size={18} color="#173d35" /><Text name="regular" style={styles.backLabel}>Back</Text></TouchableOpacity>
          <Text name="title">{locationFilter ? `Homes in ${locationFilter}` : 'Search properties'}</Text>
          <Text name="regular" style={styles.description}>{locationFilter ? `Properties available in ${locationFilter}.` : 'Find a home that fits what you need.'}</Text>
          <Input autoFocus value={term} onChangeText={(value) => { setTerm(value); if (locationFilter) setLocationFilter(''); }} onSubmitEditing={() => setSubmitted(term)} placeholder="City, neighborhood, or ZIP" placeholderTextColor="#9aa6a2" style={styles.search} returnKeyType="search" postIcon={<BaseIcon name="search" size={18} color="#173d35" />} postAction={() => setSubmitted(term)} />
          {!loading && (submitted || locationFilter) && <Text name="caption" style={styles.resultLabel}>{totalCount ?? results.length} result{(totalCount ?? results.length) === 1 ? '' : 's'} for {locationFilter || submitted.trim().charAt(0).toUpperCase() + submitted.trim().slice(1)}</Text>}
        </HeaderStatic>
        {loading && <ActivityIndicator color="#557d54" style={styles.status} />}

        {results.map((item) => <TouchableOpacity key={String(item.id)} style={styles.card} onPress={() => router.push(`/property/${item.id}`)}>{propertyImage(item) ? <Image source={{ uri: propertyImage(item) }} style={styles.image} /> : <View style={[styles.image, styles.placeholder]} />}<View style={styles.info}><Text name="title2">{item.pricing?.raw || (item.price != null ? `NPR ${item.price}` : 'Price on request')}</Text><Text name="title2" color="#27413a" style={styles.name}>{item.title || item.description || 'Property listing'}</Text></View></TouchableOpacity>)}
        {loadingMore && <ActivityIndicator color="#557d54" style={styles.status} />}
      </ScrollView>
    </KeyboardAvoidingView>
  </View>;
}

const styles = StyleSheet.create({ page: { flex: 1, backgroundColor: '#ffffff' }, compactHeaderSpacing: { marginBottom: -theme.spacing.space10 }, floatingHeaderContent: { minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: theme.spacing.space2 }, floatingBack: { width: 24, height: 44, justifyContent: 'center' }, staticBack: { minHeight: 44, alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: theme.spacing.space6 }, backLabel: { color: '#173d35' }, description: { marginTop: theme.spacing.headingDescriptionGap, color: '#71817b' }, search: { marginHorizontal: 0, marginTop: theme.spacing.space8, marginBottom: 0, height: 52, borderRadius: 14 }, searchIcon: { color: '#557d54', fontSize: 25 }, resultLabel: { color: '#71817b', marginTop: theme.spacing.space2 }, status: { marginTop: theme.spacing.space10 }, content: { paddingBottom: theme.spacing.space35 }, card: { backgroundColor: '#fff', borderRadius: 16, overflow: 'hidden', marginHorizontal: theme.spacing.space20, marginBottom: theme.spacing.space14, flexDirection: 'row', padding: theme.spacing.space10 }, image: { width: 110, height: 110, borderRadius: 11 }, placeholder: { backgroundColor: '#dfe7e3' }, info: { flex: 1, padding: theme.spacing.space12 }, name: { marginTop: theme.spacing.space7 } });
