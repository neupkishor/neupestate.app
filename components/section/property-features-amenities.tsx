import { Text } from '@neup/components/ui/text';
import { StyleSheet, View } from 'react-native';

export function PropertyFeaturesAmenities({ features, sectionTop, itemTop }: { features: string[]; sectionTop: number; itemTop: number }) {
  if (features.length === 0) return null;
  return <View style={{ marginTop: sectionTop }}>
    <Text name="title2" style={styles.title}>Features &amp; amenities</Text>
    <View style={[styles.list, { marginTop: itemTop }]}>{features.map((feature) => <View key={feature} style={styles.feature}><Text name="caption">{feature}</Text></View>)}</View>
  </View>;
}

const styles = StyleSheet.create({
  title: { color: '#173d35', fontSize: 18, fontWeight: '800' },
  list: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  feature: { backgroundColor: '#eaf2e3', borderRadius: 12, paddingHorizontal: 11, paddingVertical: 8 },
});
