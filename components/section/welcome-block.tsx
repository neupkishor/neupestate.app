import { useRouter } from 'expo-router';
import { Text, TouchableOpacity, View } from 'react-native';
import { StyleSheet } from 'react-native';

import spacing from '$/spacing.json';
import { Text as AppText } from '#/components/ui/text';

const beforeItemGap = Number.parseInt(spacing.gap.beforeItem, 10);

function formatToday() {
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  }).format(new Date());
}

export function WelcomeBlock() {
  const router = useRouter();

  return (
    <View>
      <AppText name="homeHeading" style={styles.heading}>
        Good Morning, there!
      </AppText>
      <AppText name="homeSubtitle" style={styles.subtitle}>
        It's {formatToday()}. Let's find the best deals for you.
      </AppText>
      <TouchableOpacity
        style={styles.search}
        activeOpacity={0.8}
        onPress={() => router.push('/search')}
      >
        <Text style={styles.searchIcon}>⌕</Text>
        <Text style={styles.placeholder}>Search city, neighborhood, or ZIP</Text>
        <Text style={styles.filter}>☷</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  heading: { marginTop: 2 },
  subtitle: { marginTop: 3 },
  search: {
    height: 51,
    borderRadius: 10,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#cbdcc5',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    marginTop: beforeItemGap,
  },
  searchIcon: { fontSize: 25, color: '#173d35', marginRight: 8 },
  placeholder: { flex: 1, color: '#9aa6a2', fontSize: 13 },
  filter: { color: '#173d35', fontSize: 20 },
});
