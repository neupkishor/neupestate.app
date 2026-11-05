import { AppPressable as TouchableOpacity } from '@/components/element/touch-feedback';
import { BaseIcon } from '@/components/element/base-icon';
import { Text } from '@neup/components/ui/text';
import theme from '@base/theme.json';
import { formatPropertyArea, type AreaUnitPreference } from '@base/area-units';
import { Image, StyleSheet, View } from 'react-native';

export type ListingCardProperty = {
  id: string;
  slug?: string;
  listingType: string;
  purpose: string;
  location: string;
  price: string;
  bedrooms: string;
  bathrooms: string;
  kitchens: string;
  area: unknown;
  image: string;
};

type ListingCardProps = {
  property: ListingCardProperty;
  areaUnitPreference: AreaUnitPreference;
  isSaved: boolean;
  isSaving: boolean;
  onOpen: () => void;
  onToggleSaved: () => void;
};

// Capitalize a property's display label without changing its remaining casing.
function capitalizeFirst(value: string): string {
  return value ? value.charAt(0).toLocaleUpperCase() + value.slice(1) : value;
}

// Format a property area in the unit selected by the user.
function formatArea(value: unknown, preference: AreaUnitPreference): string {
  if (value === null || value === undefined || value === '') return '';
  const areaRecord = value && typeof value === 'object' ? value as Record<string, unknown> : undefined;
  const rawValue = areaRecord?.value ?? areaRecord?.amount ?? value;
  return formatPropertyArea(rawValue, preference, 'm²') ?? '';
}

// Render a listing photo, save action, property summary, and price.
export function ListingCard({
  property,
  areaUnitPreference,
  isSaved,
  isSaving,
  onOpen,
  onToggleSaved,
}: ListingCardProps) {
  const area = formatArea(property.area, areaUnitPreference) || 'Area unavailable';

  return (
    <View style={styles.card}>
      <View style={styles.imageContainer}>
        <TouchableOpacity
          style={styles.imageTouchable}
          activeOpacity={0.9}
          accessibilityRole="button"
          accessibilityLabel={`View ${property.listingType.toLowerCase()} listing`}
          onPress={onOpen}
        >
          {property.image ? <Image source={{ uri: property.image }} style={styles.image} /> : <View style={styles.imagePlaceholder} />}
        </TouchableOpacity>
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel={isSaved ? 'Remove from saved listings' : 'Save listing'}
          accessibilityState={{ selected: isSaved, disabled: isSaving }}
          disabled={isSaving}
          onPress={onToggleSaved}
          style={styles.saveButton}
        >
          <BaseIcon name="love" size={16} color={isSaved ? '#c74e55' : '#173d35'} />
        </TouchableOpacity>
      </View>
      <TouchableOpacity style={styles.cardContent} activeOpacity={0.85} onPress={onOpen}>
        <Text name="caption" style={styles.listingTitle}>
          {capitalizeFirst(property.listingType)} for {capitalizeFirst(property.purpose)} from {capitalizeFirst(property.location)}
        </Text>
        <Text name="caption" style={styles.listingSummary}>
          {property.bedrooms || '0'} beds, {property.bathrooms || '0'} bath, {property.kitchens || '0'} kitchen, {area}
        </Text>
        <Text name="title3" style={styles.listingPrice}>At just {property.price}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: theme.spacing.space32,
  },
  cardContent: {
    marginTop: theme.spacing.space12,
  },
  listingTitle: {
    color: '#71817b',
    fontWeight: '900',
    letterSpacing: 0.6,
    lineHeight: 20,
  },
  listingPrice: {
    color: '#557d54',
    marginTop: theme.spacing.space8,
    lineHeight: 24,
  },
  listingSummary: {
    color: '#71817b',
    marginTop: theme.spacing.space8,
    lineHeight: 20,
    fontWeight: '600',
  },
  image: {
    width: '100%',
    height: 190,
    borderRadius: 16,
  },
  imageContainer: {
    position: 'relative',
    borderRadius: 16,
    overflow: 'hidden',
  },
  imageTouchable: {
    position: 'relative',
  },
  imagePlaceholder: {
    width: '100%',
    height: 190,
    backgroundColor: '#e8eee9',
  },
  saveButton: {
    position: 'absolute',
    top: theme.spacing.space10,
    right: theme.spacing.space10,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.94)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
