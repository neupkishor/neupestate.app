import { AppPressable as TouchableOpacity } from '@/components/element/touch-feedback';
import { BaseIcon, type BaseIconName } from '@/components/element/base-icon';
import { Text } from '@neup/components/ui/text';
import { StyleSheet, View } from 'react-native';

export type PropertyDetailStatItem = {
  label: string;
  value: unknown;
  icon: BaseIconName;
  onPress?: () => void;
};

export function PropertyDetailStat({ item, minimal = false }: { item: PropertyDetailStatItem; minimal?: boolean }) {
  const value = formatValue(String(item.value), item.label);
  const content = <><BaseIcon name={item.icon} size={17} color="#557d54" /><Text name="regular" style={styles.value}>{value}</Text></>;

  return item.onPress
    ? <TouchableOpacity style={[styles.stat, minimal && styles.minimal]} onPress={item.onPress} activeOpacity={0.7} accessibilityRole="button" accessibilityLabel={`${item.label}: ${item.value}. Tap to change unit.`}>{content}</TouchableOpacity>
    : <View style={[styles.stat, minimal && styles.minimal]}>{content}</View>;
}

function formatValue(value: string, label: string): string {
  const normalized = label.toLowerCase().replace(/[^a-z]/g, '');
  if (normalized === 'area') return value;
  const units: Record<string, { singular: string; plural: string }> = {
    floor: { singular: 'floor', plural: 'floors' },
    floors: { singular: 'floor', plural: 'floors' },
    bedroom: { singular: 'bedroom', plural: 'bedrooms' },
    bedrooms: { singular: 'bedroom', plural: 'bedrooms' },
    livingroom: { singular: 'living room', plural: 'living rooms' }, 
    livingrooms: { singular: 'living room', plural: 'living rooms' },
    kitchen: { singular: 'kitchen', plural: 'kitchens' }, 
    kitchens: { singular: 'kitchen', plural: 'kitchens' },
    bathroom: { singular: 'bathroom', plural: 'bathrooms' },
    bathrooms: { singular: 'bathroom', plural: 'bathrooms' },
    diningroom: { singular: 'dining room', plural: 'dining rooms' },
    diningrooms: { singular: 'dining room', plural: 'dining rooms' },
    storeroom: { singular: 'store room', plural: 'store rooms' },
    storerooms: { singular: 'store room', plural: 'store rooms' },
    parking: { singular: 'parking spot', plural: 'parking spots' },
    parkings: { singular: 'parking spot', plural: 'parking spots' },
    parkingspot: { singular: 'parking spot', plural: 'parking spots' },
    parkingspots: { singular: 'parking spot', plural: 'parking spots' },
    carparking: { singular: 'car parking spot', plural: 'car parking spots' },
    carparkings: { singular: 'car parking spot', plural: 'car parking spots' },
    carparkingspot: { singular: 'car parking spot', plural: 'car parking spots' },
    carparkingspots: { singular: 'car parking spot', plural: 'car parking spots' },
    bikeparking: { singular: 'bike parking spot', plural: 'bike parking spots' },
    bikeparkings: { singular: 'bike parking spot', plural: 'bike parking spots' },
    bikeparkingspot: { singular: 'bike parking spot', plural: 'bike parking spots' },
    bikeparkingspots: { singular: 'bike parking spot', plural: 'bike parking spots' },
  };
  const unit = units[normalized] ?? { singular: label.toLowerCase(), plural: `${label.toLowerCase()}s` };
  const match = value.match(/\d+(?:\.\d+)?/);
  if (!match) return `${value.trim()} ${unit.plural}`;
  const count = Number(match[0]);
  const counter = new Intl.NumberFormat('en', { maximumFractionDigits: 2 }).format(count);
  return `${counter} ${count === 1 ? unit.singular : unit.plural}`;
}

const styles = StyleSheet.create({
  stat: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-start', gap: 7, minHeight: 32 },
  minimal: { paddingHorizontal: 2, paddingVertical: 2 },
  value: { color: '#71817b', fontSize: 13, fontWeight: '600' },
});
