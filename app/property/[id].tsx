import { StatusBar } from 'expo-status-bar';
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { getEstateProperty } from '#/logica/estate/property/list';

export default function PropertyDetails() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [property, setProperty] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    void getEstateProperty(id).then((response) => {
      if (response.ok) setProperty(response.body.property ?? response.body);
    }).catch((error) => console.error('Failed to load property:', error)).finally(() => setLoading(false));
  }, [id]);

  const images: string[] = Array.isArray(property?.images)
    ? property.images.map(imageUri).filter(Boolean)
    : [];
  const heroImage = images[0];

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <View style={styles.hero}>
          {heroImage ? <Image source={{ uri: heroImage }} style={styles.heroImage} /> : <View style={styles.heroImagePlaceholder} />}
          <View style={styles.heroShade} />
          <View style={styles.topBar}>
            <TouchableOpacity style={styles.circleButton} onPress={() => router.back()}><Text style={styles.back}>‹</Text></TouchableOpacity>
            <View style={styles.topActions}>
              <TouchableOpacity style={styles.circleButton}><Text style={styles.icon}>↗</Text></TouchableOpacity>
              <TouchableOpacity style={styles.circleButton}><Text style={styles.icon}>♡</Text></TouchableOpacity>
            </View>
          </View>
          <View style={styles.photoCount}><Text style={styles.photoText}>▧  1 / {Math.max(images.length, 1)}</Text></View>
        </View>

        <View style={styles.body}>
          <View style={styles.eyebrowRow}><Text style={styles.eyebrow}>{formatPurpose(property?.purpose, loading)}</Text><Text style={styles.updated}>{formatUpdatedAt(property?.updatedAt)}</Text></View>
          <Text style={styles.title}>{formatText(property?.title, loading ? 'Loading property…' : 'Property unavailable')}</Text>
          <Text style={styles.location}>⌖  {formatLocation(property?.location)}</Text>
          <Text style={styles.price}>{property?.pricing?.raw || (property?.price != null ? `NPR ${property.price}` : '')}</Text>

          <View style={styles.stats}>
            <Stat value={String(property?.bedrooms ?? 0)} label="Beds" />
            <Stat value={String(property?.bathrooms ?? 0)} label="Baths" />
            <Stat value={property?.area ? `${property.area}` : '—'} label={property?.areaUnit || 'Area'} />
            <Stat value={property?.floors ? String(property.floors) : '—'} label="Floors" />
          </View>

          <Text style={styles.sectionTitle}>About this home</Text>
          <Text style={styles.description}>{property?.description || 'No description available.'}</Text>
          <TouchableOpacity><Text style={styles.readMore}>Read full description  →</Text></TouchableOpacity>

          <Text style={[styles.sectionTitle, styles.spaceTop]}>Take a closer look</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.thumbs}>
            {images.slice(1, 5).map((image) => <Image key={image} source={{ uri: image }} style={styles.thumb} />)}
            {images.length > 5 && <View style={styles.morePhotos}><Text style={styles.morePhotosText}>+ {images.length - 5}{`\n`}photos</Text></View>}
          </ScrollView>

          <View style={styles.agentCard}>
            <View style={styles.agentAvatarPlaceholder} />
            <View style={styles.agentDetails}><Text style={styles.agentLabel}>LISTED BY</Text><Text style={styles.agentName}>{property?.listingAgent || 'Agent unavailable'}</Text><Text style={styles.agentCompany}>{property?.agency?.name || ''}</Text></View>
            <TouchableOpacity style={styles.agentArrow}><Text style={styles.arrow}>→</Text></TouchableOpacity>
          </View>
        </View>
      </ScrollView>
      <View style={styles.bottomBar}><TouchableOpacity style={styles.messageButton}><Text style={styles.messageText}>Message agent</Text></TouchableOpacity><TouchableOpacity style={styles.tourButton}><Text style={styles.tourText}>Request a tour</Text></TouchableOpacity></View>
    </View>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return <View style={styles.stat}><Text style={styles.statValue}>{value}</Text><Text style={styles.statLabel}>{label}</Text></View>;
}

function formatPurpose(purpose: unknown, loading: boolean) {
  if (typeof purpose === 'string' && purpose.trim()) {
    return `FOR ${purpose.toUpperCase()}`;
  }
  return loading ? 'LOADING' : 'PROPERTY';
}

function imageUri(value: unknown): string {
  if (typeof value === 'string') return value;
  if (!value || typeof value !== 'object') return '';

  const image = value as { uri?: unknown; url?: unknown; src?: unknown };
  return imageUri(image.uri ?? image.url ?? image.src);
}

function formatUpdatedAt(updatedAt: unknown) {
  if (!updatedAt) return '';
  const date = new Date(String(updatedAt));
  return Number.isNaN(date.getTime()) ? '' : `Updated ${date.toLocaleDateString()}`;
}

function formatText(value: unknown, fallback: string) {
  return typeof value === 'string' && value.trim() ? value : fallback;
}

function formatLocation(location: unknown) {
  if (typeof location === 'string' && location.trim()) return location;
  if (!location || typeof location !== 'object') return 'Location unavailable';

  const value = location as { text?: unknown; structured?: unknown };
  if (typeof value.text === 'string' && value.text.trim()) return value.text;
  if (typeof value.structured === 'string' && value.structured.trim()) return value.structured;
  if (value.structured && typeof value.structured === 'object') {
    const structured = value.structured as Record<string, unknown>;
    const parts = ['address', 'neighborhood', 'city', 'state', 'country']
      .map((key) => structured[key])
      .filter((part): part is string => typeof part === 'string' && part.trim().length > 0);
    if (parts.length) return parts.join(', ');
  }
  return 'Location unavailable';
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f6f7f9' }, content: { paddingBottom: 105 }, hero: { height: 330, position: 'relative' }, heroImage: { width: '100%', height: '100%' }, heroImagePlaceholder: { width: '100%', height: '100%', backgroundColor: '#dfe7e3' }, heroShade: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(15,35,30,0.18)' }, topBar: { position: 'absolute', top: 52, left: 20, right: 20, flexDirection: 'row', justifyContent: 'space-between' }, topActions: { flexDirection: 'row', gap: 10 }, circleButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.9)', alignItems: 'center', justifyContent: 'center' }, back: { color: '#173d35', fontSize: 34, lineHeight: 32, marginTop: -3 }, icon: { color: '#173d35', fontSize: 20 }, photoCount: { position: 'absolute', bottom: 20, right: 20, backgroundColor: 'rgba(23,61,53,0.88)', borderRadius: 18, paddingVertical: 8, paddingHorizontal: 13 }, photoText: { color: '#fff', fontSize: 12, fontWeight: '700' }, body: { padding: 22, backgroundColor: '#f6f7f9' }, eyebrowRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }, eyebrow: { color: '#658b4f', fontSize: 11, letterSpacing: 1.5, fontWeight: '800' }, updated: { color: '#9aa6a2', fontSize: 11 }, title: { color: '#173d35', fontSize: 27, fontWeight: '800', lineHeight: 33, letterSpacing: -0.7, marginTop: 10 }, location: { color: '#71847d', fontSize: 13, marginTop: 9 }, price: { color: '#173d35', fontSize: 25, fontWeight: '800', marginTop: 18 }, stats: { flexDirection: 'row', backgroundColor: '#fff', borderRadius: 16, paddingVertical: 16, marginTop: 20, justifyContent: 'space-around' }, stat: { alignItems: 'center', minWidth: 55 }, statValue: { color: '#173d35', fontSize: 17, fontWeight: '800' }, statLabel: { color: '#8a9893', fontSize: 11, marginTop: 4 }, sectionTitle: { color: '#173d35', fontSize: 18, fontWeight: '800', marginTop: 25 }, description: { color: '#71817b', fontSize: 13, lineHeight: 21, marginTop: 9 }, readMore: { color: '#557d54', fontSize: 12, fontWeight: '800', marginTop: 9 }, spaceTop: { marginTop: 27 }, thumbs: { gap: 10, paddingVertical: 13 }, thumb: { width: 112, height: 86, borderRadius: 12 }, morePhotos: { width: 88, height: 86, borderRadius: 12, backgroundColor: '#dce6d3', alignItems: 'center', justifyContent: 'center' }, morePhotosText: { color: '#42604b', fontWeight: '800', fontSize: 13, textAlign: 'center', lineHeight: 18 }, agentCard: { backgroundColor: '#fff', borderRadius: 17, padding: 13, flexDirection: 'row', alignItems: 'center', marginTop: 18 }, agentAvatar: { width: 48, height: 48, borderRadius: 24 }, agentAvatarPlaceholder: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#dfe7e3' }, agentDetails: { flex: 1, marginLeft: 11 }, agentLabel: { color: '#9aa6a2', fontSize: 9, letterSpacing: 1.2, fontWeight: '800' }, agentName: { color: '#173d35', fontWeight: '800', fontSize: 14, marginTop: 3 }, agentCompany: { color: '#87958f', fontSize: 11, marginTop: 3 }, agentArrow: { width: 34, height: 34, borderRadius: 17, backgroundColor: '#eef5e7', alignItems: 'center', justifyContent: 'center' }, arrow: { color: '#557d54', fontSize: 18 }, bottomBar: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#edf0ee', paddingHorizontal: 20, paddingVertical: 13, flexDirection: 'row', gap: 10 }, messageButton: { flex: 1, height: 48, borderRadius: 14, borderWidth: 1, borderColor: '#cdd8d3', alignItems: 'center', justifyContent: 'center' }, messageText: { color: '#173d35', fontWeight: '800', fontSize: 13 }, tourButton: { flex: 1.25, height: 48, borderRadius: 14, backgroundColor: '#173d35', alignItems: 'center', justifyContent: 'center' }, tourText: { color: '#d8f36a', fontWeight: '800', fontSize: 13 },
});
