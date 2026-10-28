import { AppPressable as Pressable } from '@/components/element/touch-feedback';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, Image, RefreshControl, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthSession } from '@neup/auth/AuthSessionProvider';
import { useUserInfo } from '@neup/auth/auth';
import logica from '@neup/logica';
import { estateDatabase, getStoredProperty } from '@neup/core/database/estate';
import { Text } from '@neup/components/ui/text';
import { PageHeader } from '@/components/element/page-header';
import theme from '@base/theme.json';
const headingDescriptionGap = theme.spacing.headingDescriptionGap;

type PropertyRecord = Record<string, any> & { id: string };
type ProfilePropertyListProps = { kind: 'listed' | 'mine' | 'saved' | 'reacted' };
const PAGE_SIZE = 15;

function collectionRecords(body: any): any[] | null {
  const candidates = [body?.data, body?.saved, body?.savedProperties, body?.reactions, body?.properties, body?.data?.saved, body?.data?.savedProperties, body?.data?.reactions, body?.data?.properties];
  return candidates.find(Array.isArray) ?? null;
}

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
    if (requestActive.current || accountLoading) return;
    if (!accountId) {
      setProperties([]);
      setError(kind === 'listed' ? 'Sign in to view properties you have listed.' : kind === 'mine' ? 'Sign in to view properties you own.' : `Sign in to view properties you ${kind === 'saved' ? 'saved' : 'reacted to'}.`);
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
    if (!refresh && !hasMore.current) return;

    requestActive.current = true;
    if (refresh) {
      setRefreshing(true);
      offset.current = 0;
      hasMore.current = true;
    } else if (offset.current > 0) {
      setLoadingMore(true);
    } else {
      setLoading(true);
    }
    setError(null);

    try {
      if (kind === 'saved' || kind === 'reacted') {
        const requestOffset = refresh ? 0 : offset.current;
        const response = kind === 'saved'
          ? await logica.estate.property.saved.list({ account: 'me', limit: PAGE_SIZE, offset: requestOffset })
          : await logica.estate.property.reacted.list({ account: 'me', limit: PAGE_SIZE, offset: requestOffset });
        const body = response.body as any;
        const rows = response.ok && body?.success !== false ? collectionRecords(body) : null;
        if (!rows) throw new Error(body?.error || `Unable to load ${kind} properties.`);
        const loaded = await Promise.all(rows.map(async (record) => {
          const id = record.propertyId ?? record.property_id ?? record.property?.id;
          if (id == null) return null;
          const embeddedProperty = record.property && typeof record.property === 'object' ? record.property : null;
          if (embeddedProperty) return { ...embeddedProperty, id: String(embeddedProperty.id ?? id), ...(record.reaction ? { reaction: record.reaction } : {}) } as PropertyRecord;
          try {
            const response = await logica.estate.property(String(id)).get();
            const body = response.body as any;
            const property = body?.property ?? body?.data?.property ?? body?.data;
            if (response.ok && property && typeof property === 'object' && property.id != null) {
              return { ...property, id: String(property.id), ...(record.reaction ? { reaction: record.reaction } : {}) } as PropertyRecord;
            }
          } catch (loadError) {
            console.warn(`[${kind}-properties] unable to load property`, id, loadError);
          }
          const stored = getStoredProperty(String(id));
          return stored ? { ...stored, id: String(stored.id), ...(record.reaction ? { reaction: record.reaction } : {}) } as PropertyRecord : null;
        }));
        const normalized = loaded.filter((property): property is PropertyRecord => Boolean(property));
        setProperties((current) => refresh || requestOffset === 0 ? normalized : [...current, ...normalized]);
        offset.current = requestOffset + rows.length;
        hasMore.current = typeof body?.pagination?.hasMore === 'boolean' ? body.pagination.hasMore : rows.length === PAGE_SIZE;
      } else {
        const requestOffset = refresh ? 0 : offset.current;
        const response = await logica.estate.property.list({
          accountId,
          status: ['drafts', 'pending', 'rejected', 'active', 'sold', 'rented', 'archived', 'awaiting_creation', 'awaiting_deletion'],
          fields: ['id', 'title', 'description', 'images', 'location', 'pricing', 'status'],
          limit: PAGE_SIZE,
          offset: requestOffset,
        });
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
    if (!accountLoading) void load(true);
  }, [accountLoading, kind, load]);

  const loadNextPage = () => {
    if (kind !== 'mine' && hasMore.current && !requestActive.current) void load(false);
  };

  const title = kind === 'listed' ? 'Listed properties' : kind === 'mine' ? 'My properties' : kind === 'saved' ? 'Saved properties' : 'Reacted properties';
  const subtitle = kind === 'listed' ? 'Properties you have listed' : kind === 'mine' ? 'Properties you own' : kind === 'saved' ? 'Your shortlist, all in one place' : 'Properties you have liked, disliked, or reported';
  const emptyMessage = kind === 'listed' ? 'You have not listed any properties yet.' : kind === 'mine' ? 'You do not have any owner-listed properties yet.' : kind === 'saved' ? 'You have no saved properties yet.' : 'You have not reacted to any properties yet.';

  return (
    <View style={styles.page}>
      <PageHeader onBack={() => router.back()} />
      <Text name="title" style={styles.title}>{title}</Text>
      <Text name="regular" style={styles.subtitle}>{subtitle}</Text>
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
                {kind === 'reacted' && item.reaction && <Text name="caption" style={styles.location}>Reaction: {String(item.reaction)}</Text>}
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
  page: { flex: 1, backgroundColor: '#ffffff' },
  title: { marginHorizontal: theme.spacing.space20 },
  subtitle: { marginHorizontal: theme.spacing.space20, marginTop: headingDescriptionGap, color: '#71817b' },
  list: { padding: theme.spacing.space20, paddingTop: theme.spacing.space20, paddingBottom: theme.spacing.space35 },
  emptyList: { flexGrow: 1, justifyContent: 'center' },
  card: { backgroundColor: '#fff', borderRadius: 16, overflow: 'hidden', marginBottom: theme.spacing.space14, flexDirection: 'row', alignItems: 'center', padding: theme.spacing.space10 },
  image: { width: 110, height: 110, borderRadius: 11 },
  placeholder: { backgroundColor: '#dfe7e3' },
  info: { flex: 1, padding: theme.spacing.space12 },
  location: { marginTop: theme.spacing.space5 },
  price: { marginTop: theme.spacing.space5 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: theme.spacing.space24 },
  emptyText: { color: '#87958f', textAlign: 'center' },
  footer: { paddingVertical: theme.spacing.space12 },
});
