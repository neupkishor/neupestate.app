import { AppPressable as TouchableOpacity } from '@/components/element/touch-feedback';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScrollView, StyleSheet, View } from 'react-native';

import { Text } from '@neup/components/ui/text';
import { PageHeader } from '@/components/element/page-header';
import theme from '@base/theme.json';
const headingDescriptionGap = theme.spacing.headingDescriptionGap;

export default function Requirements() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.page} edges={['top']}>
      <StatusBar style="dark" />
      <PageHeader onBack={() => router.back()} backLabel="Back" />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text name="title2">Your Requirements</Text>
        <Text name="regular" style={styles.intro}>
          Tell us what you need and we’ll find the best deals for you.
        </Text>

        <TouchableOpacity style={styles.addCard} onPress={() => router.push('/profile/requirements/new')}>
          <View style={styles.addIcon}><Text style={styles.addIconText}>+</Text></View>
          <View style={styles.cardCopy}>
            <Text name="title3" style={styles.cardTitle}>Add a requirement</Text>
            <Text name="regular" style={styles.cardSubtitle}>Tell us what kind of property you need.</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.requirementCard} onPress={() => router.push('/profile/requirements/1')}>
          <Text name="caption" style={styles.cardEyebrow}>TO BUY</Text>
          <Text name="title3" style={styles.cardTitle}>A home in Kathmandu</Text>
          <Text name="regular" style={styles.cardSubtitle}>2–3 bedrooms · NPR 15M–25M</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.requirementCard} onPress={() => router.push('/profile/requirements/2')}>
          <Text name="caption" style={styles.cardEyebrow}>TO RENT</Text>
          <Text name="title3" style={styles.cardTitle}>An apartment in Lalitpur</Text>
          <Text name="regular" style={styles.cardSubtitle}>1–2 bedrooms · NPR 35K–55K / month</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: '#ffffff' },
  header: { paddingHorizontal: theme.spacing.space20, paddingTop: theme.spacing.space20, paddingBottom: theme.spacing.space16, flexDirection: 'row', alignItems: 'center', gap: theme.spacing.space14 },
  backButton: { width: 36, height: 36, justifyContent: 'center' },
  back: { color: '#173d35', fontSize: 35, lineHeight: 35 },
  brand: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.space9 },
  logo: { width: 36, height: 36, borderRadius: 9 },
  headerSpace: { width: 36 },
  content: { padding: theme.spacing.space20, paddingTop: theme.spacing.space76, paddingBottom: theme.spacing.space40 },
  intro: { marginTop: headingDescriptionGap },
  addCard: { backgroundColor: '#eaf2e3', borderWidth: 1, borderColor: '#cbdcc5', borderRadius: 14, padding: theme.spacing.space12, marginTop: theme.spacing.space24, flexDirection: 'row', alignItems: 'center' },
  addIcon: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#173d35', alignItems: 'center', justifyContent: 'center' },
  addIconText: { color: '#d8f36a', fontSize: 28, lineHeight: 30 },
  cardCopy: { marginLeft: theme.spacing.space12 },
  requirementCard: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#e0e8e3', borderRadius: 14, padding: theme.spacing.space16, marginTop: theme.spacing.space12 },
  cardEyebrow: { color: '#658b4f' },
  cardTitle: { color: '#173d35', marginTop: theme.spacing.space5 },
  cardSubtitle: { color: '#71817b', marginTop: theme.spacing.space5 },
});
