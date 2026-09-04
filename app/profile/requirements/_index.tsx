import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';

import AppIcon from '$/images/icon.png';
import { Image } from 'react-native';
import { Text } from '#/components/ui/text';

export default function Requirements() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.page} edges={['top']}>
      <StatusBar style="dark" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.back}>‹</Text>
        </TouchableOpacity>
        <View style={styles.brand}>
          <Image source={AppIcon} style={styles.logo} />
          <Text name="appTitle">Neup.Estate</Text>
        </View>
        <View style={styles.headerSpace} />
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text name="sectionTitle">Your Requirements</Text>
        <Text name="requirementsCardSubtitle" style={styles.intro}>
          Tell us what you need and we’ll find the best deals for you.
        </Text>

        <TouchableOpacity style={styles.addCard} onPress={() => router.push('/profile/requirements/new')}>
          <View style={styles.addIcon}><Text style={styles.addIconText}>+</Text></View>
          <View style={styles.cardCopy}>
            <Text style={styles.cardTitle}>Add a requirement</Text>
            <Text style={styles.cardSubtitle}>Tell us what kind of property you need.</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.requirementCard} onPress={() => router.push('/profile/requirements/1')}>
          <Text style={styles.cardEyebrow}>TO BUY</Text>
          <Text style={styles.cardTitle}>A home in Kathmandu</Text>
          <Text style={styles.cardSubtitle}>2–3 bedrooms · NPR 15M–25M</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.requirementCard} onPress={() => router.push('/profile/requirements/2')}>
          <Text style={styles.cardEyebrow}>TO RENT</Text>
          <Text style={styles.cardTitle}>An apartment in Lalitpur</Text>
          <Text style={styles.cardSubtitle}>1–2 bedrooms · NPR 35K–55K / month</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: '#f6f7f9' },
  header: { height: 70, paddingHorizontal: 20, backgroundColor: '#fff', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', elevation: 12, shadowColor: '#173d35', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.24, shadowRadius: 12 },
  backButton: { width: 36, height: 36, justifyContent: 'center' },
  back: { color: '#173d35', fontSize: 35, lineHeight: 35 },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  logo: { width: 36, height: 36, borderRadius: 9 },
  headerSpace: { width: 36 },
  content: { padding: 20, paddingBottom: 40 },
  intro: { marginTop: 6 },
  addCard: { backgroundColor: '#eaf2e3', borderWidth: 1, borderColor: '#cbdcc5', borderRadius: 14, padding: 12, marginTop: 24, flexDirection: 'row', alignItems: 'center' },
  addIcon: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#173d35', alignItems: 'center', justifyContent: 'center' },
  addIconText: { color: '#d8f36a', fontSize: 28, lineHeight: 30 },
  cardCopy: { marginLeft: 12 },
  requirementCard: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#e0e8e3', borderRadius: 14, padding: 16, marginTop: 12 },
  cardEyebrow: { color: '#658b4f', fontSize: 10, fontWeight: '800', letterSpacing: 1.4 },
  cardTitle: { color: '#173d35', fontSize: 15, fontWeight: '800', marginTop: 5 },
  cardSubtitle: { color: '#71817b', fontSize: 12, marginTop: 5 },
});
