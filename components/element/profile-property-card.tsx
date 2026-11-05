import { AppPressable } from '@/components/element/touch-feedback';
import { Image, StyleSheet, View } from 'react-native';
import { useEffect, useState } from 'react';
import { LocationIcon } from '@/components/element/location-icon';
import { Text } from '@neup/components/ui/text';
import theme from '@base/theme.json';
import { formatPropertyPrice } from '@base/area-units';
import { getAreaUnitPreference, type AreaUnitPreference } from '@base/area-units';
import { useNumberingSystem } from '@/components/numbering/NumberingSystemProvider';

type ProfileProperty = Record<string, any> & { id: string };

function imageUri(value: unknown): string | undefined {
  if (typeof value === 'string') return value;
  if (!value || typeof value !== 'object') return undefined;
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

export function ProfilePropertyCard({ property, onPress }: { property: ProfileProperty; onPress: () => void }) {
  const { numberingSystem } = useNumberingSystem();
  const [areaPreference, setAreaPreference] = useState<AreaUnitPreference>('Aana system');
  const photo = imageUri(Array.isArray(property.images) ? property.images[0] : property.image);
  useEffect(() => { void getAreaUnitPreference().then(setAreaPreference); }, []);
  return (
    <AppPressable accessibilityRole="button" activeOpacity={0.82} style={styles.card} onPress={onPress}>
      {photo ? <Image source={{ uri: photo }} style={styles.image} /> : <View style={[styles.image, styles.placeholder]} />}
      <View style={styles.details}>
        <Text name="title3" numberOfLines={2} style={styles.title}>{property.title || property.description || 'Property listing'}</Text>
        <View style={styles.locationRow}><LocationIcon /><Text name="caption" numberOfLines={1} style={styles.location}>{propertyLocation(property.location)}</Text></View>
        <Text name="caption" numberOfLines={1} style={styles.price}>{formatPropertyPrice(property.price, property.area ?? property.details?.house?.area ?? property.details?.apartment?.area ?? property.details?.land?.area, property.areaUnit ?? property.details?.areaUnit ?? property.details?.house?.areaUnit ?? property.details?.apartment?.areaUnit ?? property.details?.land?.areaUnit, areaPreference, numberingSystem)}</Text>
      </View>
    </AppPressable>
  );
}

const styles = StyleSheet.create({
  card: { flexDirection: 'row', alignItems: 'stretch', marginBottom: theme.spacing.space12 },
  image: { width: 108, height: 108, borderTopLeftRadius: 12, borderBottomLeftRadius: 12, backgroundColor: '#e7e7e7' },
  placeholder: { backgroundColor: '#e8edeb' },
  details: { flex: 1, justifyContent: 'center', padding: theme.spacing.space12, borderWidth: 1, borderColor: '#dfe6e2', borderTopRightRadius: 12, borderBottomRightRadius: 12 },
  title: { color: '#27413a' },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.space4, marginTop: theme.spacing.space6 },
  location: { color: '#71817b', flex: 1 },
  price: { color: '#173d35', fontWeight: '700', marginTop: theme.spacing.space6 },
});
