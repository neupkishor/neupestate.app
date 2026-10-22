import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { AppPressable as TouchableOpacity } from '@/components/element/touch-feedback';
import { Text } from '@neup/components/ui/text';
import outfitFonts from '@base/fonts/outfitfonts';

export default function AssistMessage() {
  const router = useRouter();

  return (
    <KeyboardAvoidingView style={s.page} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <StatusBar style="dark" />
      <View style={s.header}>
        <TouchableOpacity accessibilityLabel="Go back" style={s.backButton} onPress={() => router.back()}>
          <Text name="propertyNavIcon">‹</Text>
        </TouchableOpacity>
        <View style={s.headerCopy}>
          <Text name="title3">Nia</Text>
          <Text name="caption" style={s.online}>Your personal assistant</Text>
        </View>
        <View style={s.headerSpacer} />
      </View>
      <ScrollView contentContainerStyle={s.messages} keyboardShouldPersistTaps="handled">
        <View style={s.welcomeMessage}>
          <Text name="regular" style={s.messageText}>Hi! I’m Nia. What can I help you with today?</Text>
        </View>
      </ScrollView>
      <View style={s.composer}>
        <View style={s.composerBox}>
          <TextInput style={s.input} placeholder="Write a message..." placeholderTextColor="#9aa6a2" multiline />
          <View style={s.sendButton}><Text name="title3" style={s.sendIcon}>↑</Text></View>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  page: { flex: 1, backgroundColor: '#f6f7f9' },
  header: { height: 88, paddingTop: 34, paddingHorizontal: 16, backgroundColor: '#fff', flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#e3ebe6' },
  backButton: { width: 40, height: 44, justifyContent: 'center' },
  headerCopy: { flex: 1, marginLeft: 4 },
  online: { color: '#70817c', marginTop: -3 },
  headerSpacer: { width: 40 },
  messages: { flexGrow: 1, justifyContent: 'flex-end', padding: 20 },
  welcomeMessage: { alignSelf: 'flex-start', maxWidth: '86%', paddingHorizontal: 16, paddingVertical: 12, borderRadius: 18, borderBottomLeftRadius: 5, backgroundColor: '#fff', borderWidth: 1, borderColor: '#e3ebe6' },
  messageText: { color: '#173d35' },
  composer: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 16 },
  composerBox: { minHeight: 58, flexDirection: 'row', alignItems: 'center', padding: 6, backgroundColor: '#fff', borderRadius: 29, borderWidth: 1, borderColor: '#d7e1dc', shadowColor: '#173d35', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  input: { flex: 1, minHeight: 44, maxHeight: 112, paddingHorizontal: 15, paddingVertical: 11, color: '#173d35', fontFamily: outfitFonts.regular, fontSize: 15, lineHeight: 21 },
  sendButton: { width: 44, height: 44, marginLeft: 6, borderRadius: 22, backgroundColor: '#173d35', alignItems: 'center', justifyContent: 'center' },
  sendIcon: { color: '#d8f36a', fontSize: 23 },
});
