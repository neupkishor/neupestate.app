import { useCallback, useEffect, useState } from 'react';
import { Image, RefreshControl, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { getEstateProperty } from '#/logica/estate/property/list';
import { getStoredProperty, estateDatabase } from '#/core/database/estate';
import { Text } from '#/components/ui/text';

type SavedProperty = Record<string, any> & { id: string };

export default function Saved() {
  const router = useRouter();
  const [properties, setProperties] = useState<SavedProperty[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const loadSaved = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true); else setLoading(true);
    setError(null);
    try {
      const rows = estateDatabase.getAllSync<{ activity_on: string }>(`SELECT activity_on FROM activities WHERE activity_type LIKE 'property.%like%' OR activity_type LIKE 'property.%save%' OR activity_type LIKE 'property.%favor%' ORDER BY rowid DESC`);
      const ids = [...new Set(rows.map((row) => row.activity_on).filter(Boolean))];
      const loaded = await Promise.all(ids.map(async (id) => {
        try { const response = await getEstateProperty(String(id)); if (response.ok) { const property = response.body.property ?? response.body.data ?? response.body; if (property?.id) return { ...property, id: String(property.id) } as SavedProperty; } } catch (loadError) { console.warn('[saved-properties] unable to load property', id, loadError); }
        const stored = getStoredProperty(String(id)); return stored ? { ...stored, id: String(stored.id) } as SavedProperty : null;
      }));
      setProperties(loaded.filter((property): property is SavedProperty => Boolean(property)));
    } catch (loadError) { console.error('[saved-properties] unable to load saved properties', loadError); setError('Unable to load saved homes.'); }
    finally { setLoading(false); setRefreshing(false); }
  }, []);
  useEffect(() => { void loadSaved(); }, [loadSaved]);
  return <View style={s.page}><View style={s.header}><TouchableOpacity onPress={() => router.back()}><Text style={s.back}>‹</Text></TouchableOpacity><View><Text style={s.title}>Saved homes</Text><Text style={s.subtitle}>Your shortlist, all in one place</Text></View><View style={{ width: 28 }} /></View><ScrollView contentContainerStyle={s.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void loadSaved(true)} />}>{loading && <Text style={s.empty}>Loading saved homes…</Text>}{!loading && error && <Text style={s.empty}>{error}</Text>}{!loading && !error && properties.length === 0 && <Text style={s.empty}>You have no saved homes yet.</Text>}{!loading && !error && properties.map((property) => <TouchableOpacity key={property.id} style={s.card} onPress={() => router.push(`/property/${property.id}`)}>{propertyImage(property) ? <Image source={{ uri: propertyImage(property) }} style={s.image} /> : <View style={[s.image, s.placeholder]} />}<View style={s.info}><Text style={s.itemTitle}>{property.title || property.description || 'Property listing'}</Text><Text style={s.location}>⌖  {formatLocation(property.location)}</Text><Text style={s.value}>{property.pricing?.raw || property.price?.raw || (property.price != null ? `NPR ${property.price}` : 'Price on request')}</Text></View><Text style={s.chevron}>›</Text></TouchableOpacity>)}</ScrollView></View>;
}
function propertyImage(property: Record<string, any>) { const image = Array.isArray(property.images) ? property.images[0] : property.image; return typeof image === 'string' ? image : image?.uri || image?.url || image?.src || ''; }
function formatLocation(location: unknown) { if (typeof location === 'string' && location.trim()) return location; if (location && typeof location === 'object') { const value = location as any; return value.formatted || value.text || value.structured || 'Location unavailable'; } return 'Location unavailable'; }
const s = StyleSheet.create({ page: { flex: 1, backgroundColor: '#f6f7f9' }, header: { height: 105, paddingTop: 43, paddingHorizontal: 20, backgroundColor: '#fff', flexDirection: 'row', alignItems: 'center', gap: 14, elevation: 12, shadowColor: '#173d35', shadowOffset: { width: 0, height: 6 }, shadowOpacity: .24, shadowRadius: 12 }, back: { color: '#173d35', fontSize: 35, lineHeight: 30 }, title: { color: '#173d35', fontSize: 17, fontWeight: '800' }, subtitle: { color: '#8b9994', fontSize: 11, marginTop: 3 }, content: { padding: 20, paddingBottom: 35 }, card: { backgroundColor: '#fff', borderRadius: 16, marginBottom: 14, overflow: 'hidden', flexDirection: 'row', alignItems: 'center', padding: 10 }, image: { width: 94, height: 94, borderRadius: 11 }, placeholder: { backgroundColor: '#dfe7e3' }, info: { flex: 1, paddingHorizontal: 12 }, itemTitle: { color: '#27413a', fontSize: 14, fontWeight: '800', lineHeight: 19 }, location: { color: '#87958f', fontSize: 11, marginTop: 7 }, value: { color: '#173d35', fontSize: 14, fontWeight: '800', marginTop: 9 }, chevron: { color: '#9aa6a2', fontSize: 25, marginRight: 3 }, empty: { color: '#87958f', textAlign: 'center', marginTop: 60 } });
