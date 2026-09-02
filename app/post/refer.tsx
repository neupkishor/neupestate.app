import { StatusBar } from 'expo-status-bar';
import { KeyboardAvoidingView, Pressable, ScrollView, StyleSheet, TextInput, View, Platform } from 'react-native';
import { useRouter } from 'expo-router';

import { Text } from '#/components/ui/text';

export default function ReferLead() {
  const router = useRouter();

  return (
    <View style={styles.page}>
      <StatusBar style="dark" />
      <KeyboardAvoidingView style={styles.keyboard} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <Pressable onPress={() => router.back()} hitSlop={12} style={styles.back}>
          <Text style={styles.backText}>‹  Back</Text>
        </Pressable>
        <Text style={styles.eyebrow}>POST A LEAD</Text>
        <Text style={styles.heading}>Refer someone who’s ready to move.</Text>
        <Text style={styles.subtitle}>Share a few details about your lead. Our team will take it from here and keep you updated.</Text>

        <View style={styles.card}>
          <Text style={styles.label}>Lead’s name</Text>
          <TextInput placeholder="Full name" placeholderTextColor="#9aabbc" style={styles.input} />
          <Text style={styles.label}>Phone number</Text>
          <TextInput placeholder="98XXXXXXXX" placeholderTextColor="#9aabbc" keyboardType="phone-pad" style={styles.input} />
          <Text style={styles.label}>What are they looking for?</Text>
          <TextInput placeholder="e.g. 2 bedroom home in Kathmandu" placeholderTextColor="#9aabbc" style={[styles.input, styles.message]} multiline />
          <Pressable style={styles.submit} onPress={() => {}}>
            <Text style={styles.submitText}>Submit lead  →</Text>
          </Pressable>
        </View>
        <Text style={styles.note}>Your lead details are kept private and used only to connect them with the right property expert.</Text>
      </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: '#f4f7fb' }, keyboard: { flex: 1 }, scroll: { flex: 1 }, content: { flexGrow: 1, padding: 20, paddingTop: 62, paddingBottom: 40 },
  back: { marginBottom: 34 }, backText: { color: '#3975b5', fontSize: 16, fontWeight: '700' },
  eyebrow: { color: '#5c84b5', fontSize: 11, fontWeight: '800', letterSpacing: 1.8, marginBottom: 12 },
  heading: { color: '#163a63', fontSize: 30, lineHeight: 36, fontWeight: '800', maxWidth: 340 },
  subtitle: { color: '#82908a', fontSize: 14, lineHeight: 21, marginTop: 11, marginBottom: 28, maxWidth: 340 },
  card: { backgroundColor: '#fff', borderRadius: 22, borderWidth: 1, borderColor: '#e3ebe6', padding: 20 }, label: { color: '#315d8e', fontSize: 13, fontWeight: '800', marginBottom: 8, marginTop: 2 },
  input: { borderWidth: 1, borderColor: '#dce6ef', borderRadius: 13, paddingHorizontal: 14, paddingVertical: 13, color: '#163a63', fontSize: 14, marginBottom: 20, backgroundColor: '#fbfdff' }, message: { minHeight: 84, textAlignVertical: 'top' },
  submit: { backgroundColor: '#3975b5', borderRadius: 14, paddingVertical: 15, alignItems: 'center', marginTop: 2 }, submitText: { color: '#fff', fontSize: 15, fontWeight: '800' },
  note: { color: '#82908a', fontSize: 12, lineHeight: 18, textAlign: 'center', marginTop: 18, paddingHorizontal: 12 },
});
