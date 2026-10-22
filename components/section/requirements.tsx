import { AppPressable as TouchableOpacity } from '@/components/element/touch-feedback';
import { StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';

import { Text } from '@neup/components/ui/text';
import spacing from '@base/spacing.json';

const betweenSectionsGap = Number.parseInt(spacing.gap.betweenSections, 10);
const beforeItemGap = Number.parseInt(spacing.gap.beforeItem, 10);

export function RequirementsSection() {
  const router = useRouter();

  return (
    <View style={styles.section}>
      <Text name="title2">
        Your Requirements
      </Text>
      <Text name="caption">
        Help us understand your requirements, We'll show you the best deals!
      </Text>

      <TouchableOpacity activeOpacity={0.85} style={styles.card} onPress={() => router.push('/profile/requirements')}>
        <View style={styles.cardIcon}>
          <Text name="requirementsIcon">⌕</Text>
        </View>
        <View style={styles.cardCopy}>
          <Text name="title3">Tell us what you’re looking for</Text>
          <Text name="regular">Share your preferences and find better matches.</Text>
        </View>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginTop: betweenSectionsGap,
  },
  title: {
    color: '#173d35',
    fontSize: 18,
    fontWeight: '800',
  },
  subtitle: {
    color: '#71817b',
    fontSize: 13,
    lineHeight: 19,
    marginTop: 6,
  },
  card: {
    backgroundColor: '#eaf2e3',
    borderWidth: 1,
    borderColor: '#cbdcc5',
    borderRadius: 14,
    padding: 12,
    marginTop: beforeItemGap,
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#173d35',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardCopy: {
    flex: 1,
    marginLeft: 12,
    marginRight: 8,
  },
});
