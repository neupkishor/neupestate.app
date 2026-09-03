import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScrollView, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';

import AppIcon from '../../base/images/icon.png';
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

        <View style={styles.formCard}>
          <Text style={styles.label}>Looking for</Text>
          <View style={styles.choiceRow}>
            <TouchableOpacity style={[styles.choice, styles.choiceActive]}>
              <Text style={styles.choiceActiveText}>To buy</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.choice}>
              <Text style={styles.choiceText}>To rent</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.label}>Preferred location</Text>
          <TextInput style={styles.input} placeholder="City or neighborhood" placeholderTextColor="#9aa6a2" />

          <Text style={styles.label}>Budget</Text>
          <TextInput style={styles.input} placeholder="Your preferred budget" placeholderTextColor="#9aa6a2" keyboardType="numeric" />

          <TouchableOpacity style={styles.saveButton} onPress={() => router.back()}>
            <Text style={styles.saveText}>Save requirements</Text>
          </TouchableOpacity>
        </View>
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
  formCard: { backgroundColor: '#fff', borderRadius: 14, padding: 16, marginTop: 24 },
  label: { color: '#173d35', fontSize: 13, fontWeight: '800', marginBottom: 9, marginTop: 4 },
  choiceRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  choice: { flex: 1, borderWidth: 1, borderColor: '#d7e1dc', borderRadius: 10, paddingVertical: 13, alignItems: 'center' },
  choiceActive: { backgroundColor: '#eaf2e3', borderColor: '#a9c59d' },
  choiceText: { color: '#71817b', fontSize: 13, fontWeight: '700' },
  choiceActiveText: { color: '#42604b', fontSize: 13, fontWeight: '800' },
  input: { height: 48, borderWidth: 1, borderColor: '#d7e1dc', borderRadius: 10, paddingHorizontal: 13, color: '#173d35', fontSize: 13, marginBottom: 20 },
  saveButton: { backgroundColor: '#173d35', borderRadius: 12, paddingVertical: 15, alignItems: 'center', marginTop: 4 },
  saveText: { color: '#d8f36a', fontSize: 14, fontWeight: '800' },
});
