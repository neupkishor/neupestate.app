import { AppPressable as TouchableOpacity } from '@/components/element/touch-feedback';
import { StatusBar } from 'expo-status-bar';
import { Animated, NativeScrollEvent, NativeSyntheticEvent, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text } from '@neup/components/ui/text';
import { useAuthSession } from '@neup/auth/AuthSessionProvider';
import { runApi } from '@neup/core/infrastructure/api';
import { getErrorMessage } from '@neup/core/error-messages';
import { useEffect, useRef, useState } from 'react';
import theme from '@base/theme.json';
import { BaseIcon, type BaseIconName } from '@/components/element/base-icon';
import { HeaderFloating, HeaderStatic } from '@neup/components/ui/header';
import { SignInPromptCard } from '@/components/element/sign-in-prompt-card';

const updatesPath = '/bridge/api.v1/notification/me';

type Update = { id: string; title: string; message: string; type: string; read: boolean; createdAt: string; detail: string | null };
type UpdatesResponse = { success?: boolean; notifications?: Update[] };

// Show account activity and mark an update as read when selected.
export default function Updates() {
  const { token, authenticated, loading: accountLoading } = useAuthSession();
  const [headerHeight, setHeaderHeight] = useState(0);
  const scrollY = useRef(new Animated.Value(0)).current;
  const accountToken = authenticated && !accountLoading ? token : null;
  const currentAccountToken = useRef(accountToken);
  currentAccountToken.current = accountToken;
  const [updates, setUpdates] = useState<Update[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setUpdates([]);
    setError(null);
    setLoading(accountLoading || Boolean(accountToken));
    if (!accountToken) return () => { active = false; };

    void runApi<UpdatesResponse>({
      baseUrl: 'https://neupgroup.com/account',
      path: updatesPath,
      headers: { 'x-auth': accountToken },
    }).then((result) => {
      if (!active) return;
      if (!result.ok || result.body?.success === false) {
        setError(getErrorMessage((result.body as { error?: string })?.error, `Updates request failed (${result.status}).`));
      } else {
        setUpdates(result.body?.notifications ?? []);
      }
    }).catch(() => {
      if (active) setError('Unable to load updates.');
    }).finally(() => {
      if (active) setLoading(false);
    });

    return () => { active = false; };
  }, [accountToken, accountLoading]);

  // Mark a selected update as read and update the local row after success.
  async function markAsRead(update: Update) {
    if (update.read || !accountToken) return;
    const requestToken = accountToken;
    try {
      const result = await runApi({
        baseUrl: 'https://neupgroup.com/account',
        path: updatesPath,
        method: 'PATCH',
        headers: { 'x-auth': requestToken },
        body: { notificationId: update.id },
      });
      if (currentAccountToken.current !== requestToken) return;
      if (!result.ok) {
        setError(getErrorMessage((result.body as { error?: string })?.error, `Updates request failed (${result.status}).`));
        return;
      }
      setUpdates((current) => current.map((item) => item.id === update.id ? { ...item, read: true } : item));
    } catch {
      setError('Unable to update this item.');
    }
  }

  const groups = groupByDay(updates);
  function handleScroll(event: NativeSyntheticEvent<NativeScrollEvent>) {
    scrollY.setValue(Math.max(0, event.nativeEvent.contentOffset.y));
  }

  return <SafeAreaView style={s.safe}>
    <StatusBar style="dark" />
    <HeaderFloating scrollY={scrollY} headerHeight={headerHeight}><Text name="title2" size={20} lineHeight={27}>Updates</Text></HeaderFloating>
    <Animated.ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false} onScroll={handleScroll} scrollEventThrottle={16}>
      <HeaderStatic onHeightChange={setHeaderHeight} style={s.pageHeader}>
        <Text name="title">Updates</Text>
        <Text name="homeSubtitle" style={s.subtitle}>Stay up to date with your account activity.</Text>
      </HeaderStatic>
      {loading && <SkeletonSet />}
      {error && <Text name="propertyError" style={s.error}>{error}</Text>}
      {!accountLoading && !authenticated && <SignInPromptCard title="Sign In/Up to view updates." description="Sign In/Up to stay updated with your account." />}
      {!loading && !error && authenticated && updates.length === 0 && <Text name="regular" style={s.muted}>You have no updates.</Text>}
      {groups.map(([day, items]) => <View key={day} style={s.cardSet}>
        {items.map((update) => <TouchableOpacity
          key={update.id}
          style={[s.card, !update.read && s.unread]}
          activeOpacity={0.8}
          onPress={() => void markAsRead(update)}
        >
          <View style={s.cardTopRow}>
            <View style={[s.typeIcon, !update.read && s.unreadTypeIcon]}>
              <BaseIcon name={getUpdateIcon(update.type)} size={18} color="#35644d" />
            </View>
            <View style={s.cardCopy}>
              <View style={s.titleRow}>
                <Text name="title3" style={s.cardTitle}>{update.title}</Text>
                {!update.read && <View style={s.unreadDot} />}
              </View>
              <Text name="medium" style={s.message}>{update.message}</Text>
              {update.detail && <Text name="requirementsCardSubtitle" style={s.detail}>{update.detail}</Text>}
              <Text name="propertyMeta" style={s.date}>{formatUpdateDate(update.createdAt)}</Text>
            </View>
          </View>
        </TouchableOpacity>)}
      </View>)}
    </Animated.ScrollView>
  </SafeAreaView>;
}

// Choose a familiar symbol for common account update types.
function getUpdateIcon(type: string): BaseIconName {
  const normalizedType = type.toLowerCase();
  if (normalizedType.includes('property')) return 'home';
  if (normalizedType.includes('message') || normalizedType.includes('inquiry')) return 'comments';
  if (normalizedType.includes('visit') || normalizedType.includes('viewing')) return 'location';
  if (normalizedType.includes('save') || normalizedType.includes('favorite')) return 'love';
  return 'bell';
}

// Keep card timestamps brief while retaining the full date and time.
function formatUpdateDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
}

// Group account updates by their local calendar day.
function groupByDay(items: Update[]) {
  const groups = new Map<string, Update[]>();
  items.forEach((item) => {
    const date = new Date(item.createdAt);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);
    const key = date.toDateString() === today.toDateString()
      ? 'Today'
      : date.toDateString() === yesterday.toDateString()
        ? 'Yesterday'
        : date.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
    groups.set(key, [...(groups.get(key) ?? []), item]);
  });
  return Array.from(groups.entries());
}

// Render placeholder cards while the account updates request is pending.
function SkeletonSet() {
  return <View style={s.skeletonSet}>{[1, 2, 3].map((item) => <View key={item} style={s.skeletonCard}>
    <View style={s.skeletonTitle} />
    <View style={s.skeletonLine} />
    <View style={s.skeletonShortLine} />
  </View>)}</View>;
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#ffffff' },
  content: { paddingHorizontal: theme.spacing.space20, paddingBottom: theme.spacing.space40 },
  pageHeader: { marginHorizontal: -theme.spacing.space20, marginBottom: theme.spacing.space20 },
  subtitle: { marginTop: theme.spacing.headingDescriptionGap },
  muted: { color: '#70817c', fontSize: 14, marginTop: theme.spacing.space28 },
  error: { color: '#a23b35', fontSize: 14, marginTop: theme.spacing.space20 },
  cardSet: { gap: theme.spacing.space10, marginTop: theme.spacing.space10 },
  card: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#e5ece7', borderRadius: 18, padding: theme.spacing.space14, shadowColor: '#173d35', shadowOpacity: 0.04, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 1 },
  unread: { backgroundColor: '#f5f9f2', borderColor: '#cddfc7' },
  cardTopRow: { flexDirection: 'row', alignItems: 'flex-start', gap: theme.spacing.space12 },
  typeIcon: { width: 40, height: 40, borderRadius: 14, backgroundColor: '#f0f4f1', alignItems: 'center', justifyContent: 'center' },
  unreadTypeIcon: { backgroundColor: '#e4efdf' },
  cardCopy: { flex: 1, alignSelf: 'flex-start' },
  titleRow: { flexDirection: 'row', alignItems: 'flex-start', gap: theme.spacing.space7 },
  cardTitle: { color: '#173d35', flex: 1 },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#557d54' },
  message: { color: '#52665e', fontSize: 14, lineHeight: 20, marginTop: theme.spacing.space5 },
  detail: { color: '#788982', fontSize: 13, lineHeight: 18, marginTop: theme.spacing.space5 },
  date: { color: '#8b9994', fontSize: 11, marginTop: theme.spacing.space2 },
  skeletonSet: { marginTop: theme.spacing.space24 },
  skeletonCard: { backgroundColor: '#edf2ee', borderRadius: 16, padding: theme.spacing.space12, marginBottom: theme.spacing.space8 },
  skeletonTitle: { width: '48%', height: 16, borderRadius: 6, backgroundColor: '#dce7df' },
  skeletonLine: { width: '88%', height: 12, borderRadius: 6, backgroundColor: '#dce7df', marginTop: theme.spacing.space14 },
  skeletonShortLine: { width: '35%', height: 10, borderRadius: 5, backgroundColor: '#dce7df', marginTop: theme.spacing.space12 },
});
