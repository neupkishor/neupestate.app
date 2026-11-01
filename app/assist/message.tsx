import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View, type NativeSyntheticEvent, type NativeScrollEvent, type ScrollViewInstance } from 'react-native';
import { Input } from '@neup/components/ui/input';
import { StatusBar } from 'expo-status-bar';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { AppPressable as TouchableOpacity } from '@/components/element/touch-feedback';
import { Text } from '@neup/components/ui/text';
import outfitFonts from '@base/fonts/outfitfonts';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PageHeader } from '@/components/element/page-header';
import theme from '@base/theme.json';
import { BaseIcon } from '@/components/element/base-icon';
import { logica } from '@neup/logica';
import type { AssistMessage as AssistChatMessage } from '@neup/logica/assist';
import { MarkdownMessage } from '@/components/element/markdown-message';

type Message = { id: string; text: string; from: 'nia' | 'you' };

/* Builds a readable API failure message without exposing request credentials. */
function getAssistFailure(response: { status: number; body: unknown }, fallback: string): string {
  if (response.body && typeof response.body === 'object') {
    const body = response.body as { error?: unknown; message?: unknown; error_description?: unknown };
    const detail = [body.error, body.error_description, body.message]
      .find((value): value is string => typeof value === 'string' && value.trim().length > 0);
    if (detail) return `${fallback} (HTTP ${response.status}: ${detail})`;
  }
  return `${fallback} (HTTP ${response.status})`;
}

/* Converts the Assist API message model to the Nia conversation row model. */
function toNiaMessage(message: AssistChatMessage): Message {
  return {
    id: message.id,
    text: message.content,
    from: message.role === 'user' ? 'you' : 'nia',
  };
}

/* Renders conversation-shaped placeholders while chat messages are loading. */
function ChatSkeleton() {
  return (
    <View style={s.skeletonGroup} accessibilityLabel="Loading conversation">
      <View style={[s.skeletonBubble, s.skeletonIncoming, s.skeletonWide]}>
        <View style={[s.skeletonLine, s.skeletonLineLong]} />
        <View style={[s.skeletonLine, s.skeletonLineMedium]} />
      </View>
      <View style={[s.skeletonBubble, s.skeletonOutgoing, s.skeletonMedium]}>
        <View style={[s.skeletonLine, s.skeletonLineMedium, s.skeletonLineOnDark]} />
      </View>
      <View style={[s.skeletonBubble, s.skeletonIncoming, s.skeletonMedium]}>
        <View style={[s.skeletonLine, s.skeletonLineLong]} />
      </View>
      <View style={[s.skeletonBubble, s.skeletonOutgoing, s.skeletonWide]}>
        <View style={[s.skeletonLine, s.skeletonLineMedium, s.skeletonLineOnDark]} />
        <View style={[s.skeletonLine, s.skeletonLineShort, s.skeletonLineOnDark]} />
      </View>
    </View>
  );
}

/* Displays and sends messages in the active Nia assist conversation. */
export default function AssistMessage() {
  const router = useRouter();
  const params = useLocalSearchParams<{ chatId?: string; propertyId?: string; intent?: string }>();
  const scrollRef = useRef<ScrollViewInstance | null>(null);
  const chatIdRef = useRef<string | null>(params.chatId ?? null);
  const loadingRef = useRef(false);
  const sendingRef = useRef(false);
  const [draft, setDraft] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [showOlderHint, setShowOlderHint] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  /* Loads the latest conversation or creates one when the account has none. */
  const loadConversation = useCallback(async (quiet = false) => {
    if (loadingRef.current) return;
    loadingRef.current = true;
    if (!quiet) setLoading(true);
    try {
      let chatId = chatIdRef.current;
      if (!chatId) {
        const chatsResponse = await logica.assist.chats.get({ limit: 50, offset: 0 });
        if (!chatsResponse.ok) throw new Error(getAssistFailure(chatsResponse, 'Unable to load conversations.'));
        const chats = chatsResponse.body.chats ?? [];
        chatId = chats[0]?.id ?? null;
        if (!chatId) {
          const createResponse = await logica.assist.chats.create();
          if (!createResponse.ok) throw new Error(getAssistFailure(createResponse, 'Unable to start a conversation.'));
          chatId = createResponse.body.id;
        }
        chatIdRef.current = chatId;
      }
      if (!chatId) throw new Error('No conversation is available.');
      const response = await logica.assist.chats.messages(chatId).get({ limit: 50, offset: 0 });
      if (!response.ok) throw new Error(getAssistFailure(response, 'Unable to load messages.'));
      setMessages((response.body.messages ?? []).map(toNiaMessage));
    } catch (error) {
      console.error('[nia] conversation load failed', error);
      if (!quiet) Alert.alert('Nia is unavailable', 'We could not load your conversation. Please try again.');
    } finally {
      loadingRef.current = false;
      if (!quiet) setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadConversation();
    const poll = setInterval(() => void loadConversation(true), 5000);
    return () => clearInterval(poll);
  }, [loadConversation]);

  /* Sends the current draft and displays the returned assistant messages. */
  const send = useCallback(async () => {
    const content = draft.trim();
    if (!content || sendingRef.current) return;
    sendingRef.current = true;
    setSending(true);
    setDraft('');
    try {
      if (!chatIdRef.current) await loadConversation();
      const chatId = chatIdRef.current;
      if (!chatId) throw new Error('No conversation is available.');
      const response = await logica.assist.chats.messages(chatId).send(content);
      if (!response.ok) throw new Error(getAssistFailure(response, 'Message could not be sent.'));
      if (response.body.messages?.length) {
        setMessages(response.body.messages.map(toNiaMessage));
      } else {
        setMessages((current) => [...current, { id: `${Date.now()}`, text: content, from: 'you' }]);
        await loadConversation(true);
      }
      requestAnimationFrame(() => scrollRef.current?.scrollToEnd({ animated: true }));
    } catch (error) {
      console.error('[nia] message send failed', error);
      setDraft(content);
      Alert.alert('Message not sent', 'Please check your connection and try again.');
    } finally {
      sendingRef.current = false;
      setSending(false);
    }
  }, [draft, loadConversation]);

  /* Tracks whether the conversation is scrolled away from the latest message. */
  const onScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    setShowOlderHint(event.nativeEvent.contentOffset.y > 24);
  };

  const pageDescription = params.intent === 'tour'
    ? `I can help arrange a tour for property ${params.propertyId ?? ''}.`
    : params.intent === 'message'
      ? `Ask me about property ${params.propertyId ?? ''}.`
      : 'Ask about homes, neighbourhoods, and your next move.';

  return (
    <SafeAreaView style={s.safe} edges={['bottom']}>
      <KeyboardAvoidingView style={s.page} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <StatusBar style="dark" />
        <PageHeader onBack={() => router.back()} backLabel="Back" />
        <View style={s.chatTitleHeader}>
          <Text name="title">Nia</Text>
        </View>
        <View style={s.historyArea}>
          {showOlderHint && <View style={s.olderHint}><Text name="caption" style={s.hintText}>Swipe down to see older messages</Text></View>}
          <ScrollView ref={scrollRef} contentContainerStyle={s.messages} keyboardShouldPersistTaps="handled" onScroll={onScroll} scrollEventThrottle={16}>
            <Text name="regular" style={s.pageDescription}>{pageDescription}</Text>
            {loading && <ChatSkeleton />}
            {messages.map((message) => <View key={message.id} style={[s.message, message.from === 'you' ? s.userMessage : s.niaMessage]}>
              <MarkdownMessage content={message.text} fromUser={message.from === 'you'} />
            </View>)}
            {sending && <View style={[s.message, s.niaMessage, s.pendingMessage]}><ActivityIndicator size="small" color="#557d54" /></View>}
          </ScrollView>
        </View>
        <View style={s.composer}>
          <View style={s.composerRow}>
            <Input value={draft} onChangeText={setDraft} onSubmitEditing={() => void send()} returnKeyType="send" style={s.input} placeholder="Write a message..." placeholderTextColor="#9aa6a2" multiline editable={!sending} />
            <TouchableOpacity accessibilityRole="button" accessibilityLabel="Send message" accessibilityState={{ disabled: sending || !draft.trim() }} onPress={() => void send()} style={[s.sendButton, (sending || !draft.trim()) && s.sendButtonDisabled]}>
              {sending ? <ActivityIndicator size="small" color="#d8f36a" /> : <BaseIcon name="enter" size={19} color="#d8f36a" />}
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
  chatTitleHeader: { paddingHorizontal: theme.spacing.space20, paddingBottom: theme.spacing.space8 },
  olderHint: { position: 'absolute', top: 8, zIndex: 1, alignSelf: 'center', paddingHorizontal: theme.spacing.space12, paddingVertical: theme.spacing.space6, borderRadius: 14, backgroundColor: '#eaf0eb' },
  hintText: { color: '#70817c' },
  messages: { flexGrow: 1, justifyContent: 'flex-end', padding: theme.spacing.space20, paddingTop: theme.spacing.space72, gap: theme.spacing.space12 },
  pageDescription: { color: '#71817b', marginBottom: theme.spacing.space12 },
  skeletonGroup: { gap: theme.spacing.space12, paddingVertical: theme.spacing.space12 },
  skeletonBubble: { borderRadius: 18, paddingHorizontal: theme.spacing.space16, paddingVertical: theme.spacing.space14, gap: theme.spacing.space8 },
  skeletonIncoming: { alignSelf: 'flex-start', borderBottomLeftRadius: 5, backgroundColor: '#edf1ee' },
  skeletonOutgoing: { alignSelf: 'flex-end', borderBottomRightRadius: 5, backgroundColor: '#dce5df' },
  skeletonWide: { width: '78%' },
  skeletonMedium: { width: '58%' },
  skeletonLine: { height: 9, borderRadius: 5, backgroundColor: '#dce3de' },
  skeletonLineOnDark: { backgroundColor: '#c2d0c6' },
  skeletonLineLong: { width: '92%' },
  skeletonLineMedium: { width: '68%' },
  skeletonLineShort: { width: '42%' },
  message: { maxWidth: '86%', paddingHorizontal: theme.spacing.space16, paddingVertical: theme.spacing.space12, borderRadius: 18 },
  niaMessage: { alignSelf: 'flex-start', borderBottomLeftRadius: 5, backgroundColor: '#fff', borderWidth: 1, borderColor: '#e3ebe6' },
  userMessage: { alignSelf: 'flex-end', borderBottomRightRadius: 5, backgroundColor: '#173d35' },
  pendingMessage: { minWidth: 56, alignItems: 'center' },
  messageText: { color: '#173d35' },
  userMessageText: { color: '#fff' },
  composer: { paddingHorizontal: theme.spacing.space16, paddingTop: theme.spacing.space8, paddingBottom: Platform.OS === 'ios' ? 8 : 4 },
  composerRow: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.space8 },
  input: { flex: 1, minHeight: 48, maxHeight: 112, paddingVertical: theme.spacing.space10, color: '#173d35', fontFamily: outfitFonts.regular, fontSize: 15, lineHeight: 21 },
  sendButton: { width: 44, height: 44, marginLeft: theme.spacing.space6, borderRadius: 22, backgroundColor: '#173d35', alignItems: 'center', justifyContent: 'center' },
  sendButtonDisabled: { opacity: 0.55 },
});
