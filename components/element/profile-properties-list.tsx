import { AppPressable as Pressable } from '@/components/element/touch-feedback';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, Image, RefreshControl, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthSession } from '@neup/auth/AuthSessionProvider';
import { useUserInfo } from '@neup/auth/auth';
import logica from '@neup/logica';
import { estateDatabase, getStoredProperty } from '@neup/core/database/estate';
import { Text } from '@neup/components/ui/text';

type PropertyRecord = Record<string, any> & { id: string };
type ProfilePropertyListProps = { kind: 'listed' | 'mine' | 'saved' };
const PAGE_SIZE = 15;

function imageUri(value: unknown): string {
  if (typeof value === 'string') return value;
  if (!value || typeof value !== 'object') return '';
  const image = value as { uri?: unknown; url?: unknown; src?: unknown };
  return imageUri(image.uri ?? image.url ?? image.src);
}

function propertyLocation(value: unknown): string {
  if (typeof value === 'string' && value.trim()) return value;
  if (value && typeof value === 'object') {
    const location = value as Record<string, unknown>;
    const formatted = location.formatted ?? location.text ?? location.structured;
    if (typeof formatted === 'string' && formatted.trim()) return formatted;
  }
  return 'Location unavailable';
}

function propertyPrice(property: PropertyRecord): string {
  return property.pricing?.raw || property.price?.raw || property.price?.basis ||
    (property.price != null ? `NPR ${property.price}` : 'Price on request');
}

export function ProfilePropertiesList({ kind }: ProfilePropertyListProps) {
  const router = useRouter();
  const user = useUserInfo();
  const { loading: accountLoading } = useAuthSession();
  const accountId = user.isAuthenticated ? user.account.id : null;
  const [properties, setProperties] = useState<PropertyRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const offset = useRef(0);
  const hasMore = useRef(true);
  const requestActive = useRef(false);

  const load = useCallback(async (refresh = false) => {
    if (requestActive.current || (kind !== 'saved' && accountLoading)) return;
    if (kind !== 'saved' && !accountId) {
      setProperties([]);
      setError(kind === 'listed' ? 'Sign in to view properties you have listed.' : 'Sign in to view properties you own.');
      setLoading(false);
      return;
    }
    if (kind === 'mine') {
      setProperties([]);
      setError('The dedicated My Properties endpoint is not available in the app SDK yet.');
      setLoading(false);
      setRefreshing(false);
      return;
    }
    if (!refresh && kind !== 'saved' && !hasMore.current) return;

    requestActive.current = true;
    if (refresh) {
      setRefreshing(true);
      offset.current = 0;
      hasMore.current = true;
    } else if (offset.current > 0 && kind === 'listed') {
      setLoadingMore(true);
    } else {
      setLoading(true);
    }
    setError(null);

    try {
      if (kind === 'saved') {
        const rows = estateDatabase.getAllSync<{ activity_on: string; activity_type: string }>(
          `SELECT activity_on, activity_type FROM activities
           WHERE activity_type LIKE 'property.like%'
              OR activity_type LIKE 'property.%save%'
              OR activity_type LIKE 'property.%favor%'
           ORDER BY rowid DESC`,
        );
        const latestByProperty = new Map<string, string>();
        rows.forEach((row) => {
          if (!latestByProperty.has(row.activity_on)) latestByProperty.set(row.activity_on, row.activity_type);
        });
        const ids = [...latestByProperty.entries()]
          .filter(([, activityType]) => activityType !== 'property.like.undo')
          .map(([propertyId]) => propertyId)
          .filter(Boolean);
        const loaded = await Promise.all(ids.map(async (id) => {
          try {
            const response = await logica.estate.property(String(id)).get();
            if (response.ok && response.body?.success && response.body.property) {
              const property = response.body.property;
              if (property.id) return { ...property, id: String(property.id) } as PropertyRecord;
            }
          } catch (loadError) {
            console.warn('[saved-properties] unable to load property', id, loadError);
          }
          const stored = getStoredProperty(String(id));
          return stored ? { ...stored, id: String(stored.id) } as PropertyRecord : null;
        }));
        setProperties(loaded.filter((property): property is PropertyRecord => Boolean(property)));
        hasMore.current = false;
      } else {
        const requestOffset = refresh ? 0 : offset.current;
        const response = await logica.estate.property.list({ accountId, limit: PAGE_SIZE, offset: requestOffset });
        const rows = response.ok && Array.isArray(response.body?.properties)
          ? response.body.properties as PropertyRecord[]
          : null;
        if (!rows) throw new Error(response.body?.error || 'Unable to load listed properties.');
        const normalized = rows.filter((item) => item?.id != null).map((item) => ({ ...item, id: String(item.id) }));
        setProperties((current) => refresh || requestOffset === 0 ? normalized : [...current, ...normalized]);
        offset.current = requestOffset + normalized.length;
        hasMore.current = typeof response.body?.totalCount === 'number'
          ? offset.current < response.body.totalCount
          : normalized.length === PAGE_SIZE;
      }
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load properties.');
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
      requestActive.current = false;
    }
  }, [accountId, accountLoading, kind]);

  useEffect(() => {
    if (kind === 'saved' || !accountLoading) void load(true);
  }, [accountLoading, kind, load]);

  const loadNextPage = () => {
    if (kind === 'listed' && hasMore.current && !requestActive.current) void load(false);
  };

  const title = kind === 'listed' ? 'Listed properties' : kind === 'mine' ? 'My properties' : 'Saved properties';
  const subtitle = kind === 'listed' ? 'Properties you have listed' : kind === 'mine' ? 'Properties you own' : 'Your shortlist, all in one place';
  const emptyMessage = kind === 'listed' ? 'You have not listed any properties yet.' : kind === 'mine' ? 'You do not have any owner-listed properties yet.' : 'You have no saved properties yet.';

  return (
    <View style={styles.page}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton} accessibilityLabel="Go back">
          <Text name="title2" color="#173d35">‹</Text>
        </Pressable>
        <View style={styles.headerCopy}>
          <Text name="title2">{title}</Text>
          <Text name="caption" style={styles.subtitle}>{subtitle}</Text>
        </View>
      </View>
      {loading && properties.length === 0 ? (
        <View style={styles.center}><ActivityIndicator size="small" color="#173d35" /></View>
      ) : error && properties.length === 0 ? (
        <View style={styles.center}><Text name="regular" style={styles.emptyText}>{error}</Text></View>
      ) : (
        <FlatList
          data={properties}
          keyExtractor={(property) => property.id}
          contentContainerStyle={[styles.list, properties.length === 0 && styles.emptyList]}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void load(true)} />}
          onEndReached={loadNextPage}
          onEndReachedThreshold={0.45}
          ListEmptyComponent={<Text name="regular" style={styles.emptyText}>{error || emptyMessage}</Text>}
          ListFooterComponent={loadingMore ? <ActivityIndicator size="small" color="#173d35" style={styles.footer} /> : undefined}
          renderItem={({ item }) => (
            <Pressable style={styles.card} onPress={() => router.push(`/property/${item.id}`)}>
              {imageUri(Array.isArray(item.images) ? item.images[0] : item.image)
                ? <Image source={{ uri: imageUri(Array.isArray(item.images) ? item.images[0] : item.image) }} style={styles.image} />
                : <View style={[styles.image, styles.placeholder]} />}
              <View style={styles.info}>
                <Text name="title2" color="#70817c" numberOfLines={2}>{item.title || item.description || 'Property listing'}</Text>
                <Text name="caption" style={styles.location} numberOfLines={1}>⌖  {propertyLocation(item.location)}</Text>
                <Text name="title2" style={styles.price} numberOfLines={1}>{propertyPrice(item)}</Text>
              </View>
              <Text name="title3" color="#9aa6a2">›</Text>
            </Pressable>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: '#f6f7f9' },
  header: { minHeight: 105, paddingTop: 42, paddingHorizontal: 20, paddingBottom: 12, backgroundColor: '#fff', flexDirection: 'row', alignItems: 'center', gap: 14, elevation: 12, shadowColor: '#173d35', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.18, shadowRadius: 12, zIndex: 10 },
  backButton: { width: 34, height: 42, justifyContent: 'center' },
  headerCopy: { flex: 1 },
  subtitle: { marginTop: 3 },
  list: { padding: 20, paddingBottom: 35 },
  emptyList: { flexGrow: 1, justifyContent: 'center' },
  card: { backgroundColor: '#fff', borderRadius: 16, overflow: 'hidden', marginBottom: 14, flexDirection: 'row', alignItems: 'center', padding: 10 },
  image: { width: 94, height: 94, borderRadius: 11 },
  placeholder: { backgroundColor: '#dfe7e3' },
  info: { flex: 1, paddingHorizontal: 12 },
  location: { marginTop: 5 },
  price: { marginTop: 5 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  emptyText: { color: '#87958f', textAlign: 'center' },
  footer: { paddingVertical: 12 },
});
