import { AppPressable as TouchableOpacity } from '@/components/element/touch-feedback';
import { useRouter } from 'expo-router';
import { Text, View } from 'react-native';
import { StyleSheet } from 'react-native';

import theme from '@base/theme.json';
import { Text as AppText } from '@neup/components/ui/text';
import { useUserInfo } from '@neup/auth/auth';
import { getFirstName } from '@neup/auth/user-info';
import { BaseIcon } from '@/components/element/base-icon';

const beforeItemGap = theme.spacing.space14;

function formatToday() {
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  }).format(new Date());
}

// Build the personalized greeting shown below the Home brand header.
export function getWelcomeCopy(user: ReturnType<typeof useUserInfo>) {
  const firstName = getFirstName(user) || 'there';
  return {
    firstName,
    title: `Hello ${firstName}!`,
    description: `It's ${formatToday()}. Let's find the best deals for you.`,
  };
}

export function WelcomeBlock({ showGreeting = true }: { showGreeting?: boolean }) {
  const router = useRouter();
  const user = useUserInfo();
  const welcomeCopy = getWelcomeCopy(user);

  return (
    <View>
      {showGreeting ? <>
        <AppText name="title" style={styles.heading}>{welcomeCopy.title}</AppText>
        <AppText name="homeSubtitle" style={styles.subtitle}>{welcomeCopy.description}</AppText>
      </> : null}
      <TouchableOpacity
        style={styles.search}
        activeOpacity={0.8}
        onPress={() => router.push('/search')}
      >
        <BaseIcon name="search" size={18} color="#173d35" style={styles.searchIcon} />
        <AppText name="regular" style={styles.placeholder}>Search city, neighborhood, or ZIP</AppText>
        <BaseIcon name="settings" size={18} color="#173d35" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  heading: { marginTop: theme.spacing.space2 },
  subtitle: { marginTop: theme.spacing.space3 },
  search: {
    height: 51,
    borderRadius: 10,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#cbdcc5',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.space15,
    marginTop: beforeItemGap,
  },
  searchIcon: { marginRight: theme.spacing.space8 },
  placeholder: { flex: 1, color: '#9aa6a2' },
});
