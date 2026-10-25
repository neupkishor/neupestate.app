import { useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View, type NativeSyntheticEvent, type NativeScrollEvent, type ScrollViewInstance } from 'react-native';
import { Input } from '@neup/components/ui/input';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { AppPressable as TouchableOpacity } from '@/components/element/touch-feedback';
import { Text } from '@neup/components/ui/text';
import outfitFonts from '@base/fonts/outfitfonts';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PageHeader } from '@/components/element/page-header';
import theme from '@base/theme.json';

type Message = { id: number; text: string; from: 'nia' | 'you' };

export default function AssistMessage() {
  const router = useRouter();
  const scrollRef = useRef<ScrollViewInstance | null>(null);
  const [draft, setDraft] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    { id: 1, from: 'nia', text: 'Hi! I’m Nia. What can I help you with today?' },
    { id: 2, from: 'nia', text: 'You can ask about properties, neighborhoods, or anything you need help finding.' },
  ]);
  const [showOlderHint, setShowOlderHint] = useState(false);
  const send = () => {
    const text = draft.trim();
    if (!text) return;
    setMessages((current) => [...current, { id: Date.now(), from: 'you', text }]);
    setDraft('');
    requestAnimationFrame(() => scrollRef.current?.scrollToEnd({ animated: true }));
  };
  const onScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    setShowOlderHint(event.nativeEvent.contentOffset.y > 24);
  };

  return (
    <SafeAreaView style={s.safe} edges={['bottom']}>
    <KeyboardAvoidingView style={s.page} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <StatusBar style="dark" />
      <PageHeader onBack={() => router.back()} backLabel="Back" />
      <View style={s.historyArea}>
        {showOlderHint && <View style={s.olderHint}><Text name="caption" style={s.hintText}>Swipe down to see older messages</Text></View>}
        <ScrollView ref={scrollRef} contentContainerStyle={s.messages} keyboardShouldPersistTaps="handled" onScroll={onScroll} scrollEventThrottle={16}>
          <Text name="title" style={s.pageTitle}>Nia</Text>
          <Text name="regular" style={s.pageDescription}>Ask about homes, neighbourhoods, and your next move.</Text>
          {messages.map((message) => <View key={message.id} style={[s.message, message.from === 'you' ? s.userMessage : s.niaMessage]}>
            <Text name="regular" style={[s.messageText, message.from === 'you' && s.userMessageText]}>{message.text}</Text>
          </View>)}
        </ScrollView>
      </View>
      <View style={s.composer}>
        <View style={s.composerRow}>
          <Input value={draft} onChangeText={setDraft} onSubmitEditing={send} returnKeyType="send" style={s.input} placeholder="Write a message..." placeholderTextColor="#9aa6a2" multiline />
          <TouchableOpacity accessibilityRole="button" accessibilityLabel="Send message" onPress={send} style={s.sendButton}>
            <Text name="title3" style={s.sendIcon}>↑</Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#ffffff' },
  page: { flex: 1, backgroundColor: '#ffffff' },
  historyArea: { flex: 1 },
  olderHint: { position: 'absolute', top: 8, zIndex: 1, alignSelf: 'center', paddingHorizontal: theme.spacing.space12, paddingVertical: theme.spacing.space6, borderRadius: 14, backgroundColor: '#eaf0eb' },
  hintText: { color: '#70817c' },
  messages: { flexGrow: 1, justifyContent: 'flex-end', padding: theme.spacing.space20, paddingTop: theme.spacing.space72, gap: theme.spacing.space12 },
  pageTitle: { marginBottom: theme.spacing.space0 },
  pageDescription: { color: '#71817b', marginBottom: theme.spacing.space12 },
  message: { maxWidth: '86%', paddingHorizontal: theme.spacing.space16, paddingVertical: theme.spacing.space12, borderRadius: 18 },
  niaMessage: { alignSelf: 'flex-start', borderBottomLeftRadius: 5, backgroundColor: '#fff', borderWidth: 1, borderColor: '#e3ebe6' },
  userMessage: { alignSelf: 'flex-end', borderBottomRightRadius: 5, backgroundColor: '#173d35' },
  messageText: { color: '#173d35' },
  userMessageText: { color: '#fff' },
  composer: { paddingHorizontal: theme.spacing.space16, paddingTop: theme.spacing.space8, paddingBottom: Platform.OS === 'ios' ? 8 : 4 },
  composerRow: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.space8 },
  input: { flex: 1, minHeight: 48, maxHeight: 112, paddingVertical: theme.spacing.space10, color: '#173d35', fontFamily: outfitFonts.regular, fontSize: 15, lineHeight: 21 },
  sendButton: { width: 44, height: 44, marginLeft: theme.spacing.space6, borderRadius: 22, backgroundColor: '#173d35', alignItems: 'center', justifyContent: 'center' },
  sendIcon: { color: '#d8f36a', fontSize: 23 },
});
