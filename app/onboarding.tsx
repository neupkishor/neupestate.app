import { StatusBar } from 'expo-status-bar';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';

import AppIcon from '../base/images/icon.png';
import { Image } from 'react-native';
import { Text } from '#/components/ui/text';

export default function Onboarding() {
  const router = useRouter();

  return (
    <View style={styles.page}>
      <StatusBar style="dark" />

      <View style={styles.header}>
        <View style={styles.brand}>
          <Image source={AppIcon} style={styles.logo} />
          <Text name="appTitle">Neup.Estate</Text>
        </View>
      </View>

      <View style={styles.content}>
        <Text name="onboardingEyebrow">WELCOME TO NEUP.ESTATE</Text>
        <Text name="onboardingHeading">Find a place that feels like home.</Text>
        <Text name="onboardingSubtitle">
          Discover thoughtful spaces, save your favorites, and make your next move with confidence.
        </Text>

        <TouchableOpacity style={styles.primaryButton} onPress={() => router.replace('/home')}>
          <Text style={styles.primaryButtonText}>Get started</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: '#f6f7f9',
  },
  header: {
    height: 88,
    paddingTop: 38,
    paddingHorizontal: 20,
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 12,
    shadowColor: '#173d35',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.24,
    shadowRadius: 12,
    zIndex: 10,
  },
  brand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
  },
  logo: {
    width: 36,
    height: 36,
    borderRadius: 9,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  primaryButton: {
    backgroundColor: '#173d35',
    borderRadius: 15,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 32,
  },
  primaryButtonText: {
    color: '#d8f36a',
    fontSize: 15,
    fontWeight: '800',
  },
});
