import { Text } from '@neup/components/ui/text';
import { StyleSheet, View } from 'react-native';
import { PropertyDetailStat, type PropertyDetailStatItem } from './property-detail-stat';

export function RoomsAndSpacing({ items }: { items: PropertyDetailStatItem[] }) {
  if (items.length === 0) return null;
  return <View style={styles.section}>
    <Text name="title2" style={styles.title}>Rooms and Spacing</Text>
    <View style={styles.list}>{items.map((item) => <PropertyDetailStat key={item.label} item={item} minimal />)}</View>
  </View>;
}

const styles = StyleSheet.create({
  section: { marginTop: 20 },
  title: { color: '#173d35', fontSize: 18, fontWeight: '700', letterSpacing: -0.3, marginBottom: 10 },
  list: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'flex-start', rowGap: 0, columnGap: 8 },
});
