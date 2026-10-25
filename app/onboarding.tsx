import { StatusBar } from 'expo-status-bar';
import { Button } from '@neup/components/ui/button';
import { StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';

import { Text } from '@neup/components/ui/text';
import theme from '@base/theme.json';

export default function Onboarding() {
  const router = useRouter();

  return (
    <View style={styles.page}>
      <StatusBar style="dark" />

      <View style={styles.content}>
        <Text name="onboardingEyebrow">WELCOME TO NEUP.ESTATE</Text>
        <Text name="onboardingHeading">Find a place that feels like home.</Text>
        <Text name="onboardingSubtitle">
          Discover thoughtful spaces, save your favorites, and make your next move with confidence.
        </Text>

        <Button variant="solid" size="lg" style={styles.primaryButton} onPress={() => router.replace('/home')}>
          <Text style={styles.primaryButtonText}>Get started</Text>
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: { paddingHorizontal: theme.spacing.space20, paddingTop: theme.spacing.space20, paddingBottom: theme.spacing.space16, flexDirection: 'row', alignItems: 'center', gap: theme.spacing.space14 },
  brand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.space9,
  },
  logo: {
    width: 36,
    height: 36,
    borderRadius: 9,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    padding: theme.spacing.space24,
    paddingTop: theme.spacing.space80,
  },
  primaryButton: {
    backgroundColor: '#173d35',
    borderRadius: 15,
    paddingVertical: theme.spacing.space16,
    alignItems: 'center',
    marginTop: theme.spacing.space32,
  },
  primaryButtonText: {
    color: '#d8f36a',
    fontSize: 15,
    fontWeight: '800',
  },
});
