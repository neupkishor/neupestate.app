import { AppPressable as TouchableOpacity } from '@/components/element/touch-feedback';
import { StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';

import { Text } from '@neup/components/ui/text';
import theme from '@base/theme.json';
import { BaseIcon } from '@/components/element/base-icon';

const betweenSectionsGap = theme.spacing.betweenSections;
const beforeItemGap = theme.spacing.beforeItem;

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
          <BaseIcon name="home" size={22} color="#173d35" />
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
    marginTop: theme.spacing.space6,
  },
  card: {
    backgroundColor: '#eaf2e3',
    borderWidth: 1,
    borderColor: '#cbdcc5',
    borderRadius: 14,
    padding: theme.spacing.space12,
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
    marginLeft: theme.spacing.space12,
    marginRight: theme.spacing.space8,
  },
});
