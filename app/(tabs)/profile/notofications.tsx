import { AppPressable as TouchableOpacity } from '@/components/element/touch-feedback';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text } from '@neup/components/ui/text';
import { useAuthSession } from '@neup/auth/AuthSessionProvider';
import { runApi } from '@neup/core/infrastructure/api';
import { getErrorMessage } from '@neup/core/error-messages';
import { useEffect, useRef, useState } from 'react';
import { PageHeader } from '@/components/element/page-header';
import theme from '@base/theme.json';
const headingDescriptionGap = theme.spacing.headingDescriptionGap;

const NOTIFICATIONS_URL = 'https://neupgroup.com/account/bridge/api.v1/notification/me';
type Notification = { id: string; title: string; message: string; type: string; read: boolean; createdAt: string; detail: string | null };
type NotificationsResponse = { success?: boolean; notifications?: Notification[] };

export default function Notifications() {
  const router = useRouter();
  const { token, authenticated, loading: accountLoading } = useAuthSession();
  const accountToken = authenticated && !accountLoading ? token : null;
  const currentAccountToken = useRef(accountToken);
  currentAccountToken.current = accountToken;
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setNotifications([]);
    setError(null);
    setLoading(accountLoading || Boolean(accountToken));
    if (!accountToken) return;
    void runApi<NotificationsResponse>({
      baseUrl: 'https://neupgroup.com/account',
      path: '/bridge/api.v1/notification/me',
      headers: { 'x-auth-account': accountToken },
    }).then((result) => {
      if (!active) return;
      if (!result.ok || result.body?.success === false) setError(getErrorMessage((result.body as { error?: string })?.error, `Notification request failed (${result.status}).`));
      else setNotifications(result.body?.notifications ?? []);
    }).catch(() => {
      if (active) setError('Unable to load notifications.');
    }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [accountToken, accountLoading]);

  const markAsRead = async (notification: Notification) => {
    if (notification.read || !accountToken) return;
    const requestToken = accountToken;
    const body = { notificationId: notification.id };
    console.log('[notifications] PATCH request', { url: NOTIFICATIONS_URL, method: 'PATCH', headers: { 'x-auth-account': '[redacted]', 'Content-Type': 'application/json' }, body });
    try {
      const result = await runApi({ baseUrl: 'https://neupgroup.com/account', path: '/bridge/api.v1/notification/me', method: 'PATCH', headers: { 'x-auth-account': requestToken }, body });
      console.log('[notifications] PATCH response', { status: result.status, ok: result.ok, body: result.body });
      if (currentAccountToken.current !== requestToken) return;
      if (!result.ok) { setError(getErrorMessage((result.body as { error?: string })?.error, `Notification request failed (${result.status}).`)); return; }
      setNotifications((current) => current.map((item) => item.id === notification.id ? { ...item, read: true } : item));
    } catch (requestError) {
      console.error('[notifications] PATCH failed', requestError);
    }
  };

  const groups = groupByDay(notifications);
  return <SafeAreaView style={s.safe}><StatusBar style="dark" /><PageHeader onBack={() => router.back()} backLabel="Back" /><ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}><Text name="title" style={s.title}>Notifications</Text><Text name="homeSubtitle" style={s.subtitle}>Stay up to date with your account activity.</Text>{loading && <SkeletonSet />}{error && <Text name="propertyError" style={s.error}>{error}</Text>}{!loading && !error && notifications.length === 0 && <Text name="regular" style={s.muted}>{authenticated ? 'You have no notifications.' : 'Sign in to view your notifications.'}</Text>}{groups.map(([day, items]) => <View key={day} style={s.group}><Text name="title2" style={s.day}>{day}</Text><View style={s.cardSet}>{items.map((notification, index) => <TouchableOpacity key={notification.id} style={[s.card, !notification.read && s.unread, index === 0 && s.firstCard, index === items.length - 1 && s.lastCard, index < items.length - 1 && s.separator]} activeOpacity={0.8} onPress={() => void markAsRead(notification)}><View style={s.cardHeader}><Text name="title3" style={s.cardTitle}>{notification.title}</Text></View><Text name="medium" style={s.message}>{notification.message}</Text>{notification.detail && <Text name="requirementsCardSubtitle" style={s.detail}>{notification.detail}</Text>}<Text name="propertyMeta" style={s.date}>{new Date(notification.createdAt).toLocaleString()}</Text></TouchableOpacity>)}</View></View>)}</ScrollView></SafeAreaView>;
}

function groupByDay(items: Notification[]) {
  const groups = new Map<string, Notification[]>();
  items.forEach((item) => {
    const date = new Date(item.createdAt);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);
    const key = date.toDateString() === today.toDateString() ? 'Today' : date.toDateString() === yesterday.toDateString() ? 'Yesterday' : date.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
    groups.set(key, [...(groups.get(key) ?? []), item]);
  });
  return Array.from(groups.entries());
}

function SkeletonSet() {
  return <View style={s.skeletonSet}>{[1, 2, 3].map((item) => <View key={item} style={s.skeletonCard}><View style={s.skeletonTitle} /><View style={s.skeletonLine} /><View style={s.skeletonShortLine} /></View>)}</View>;
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#ffffff' },
  header: { paddingHorizontal: theme.spacing.space20, paddingTop: theme.spacing.space20, paddingBottom: theme.spacing.space16, flexDirection: 'row', alignItems: 'center', gap: theme.spacing.space14 },
  back: { color: '#193d35', fontSize: 34 },
  headerTitle: { color: '#173d35', fontSize: 18 },
  headerSpacer: { width: 24 },
  content: { padding: theme.spacing.space24, paddingTop: theme.spacing.space32, paddingBottom: theme.spacing.space40 },
  title: { color: '#173d35' },
  subtitle: { marginTop: headingDescriptionGap },
  muted: { color: '#70817c', fontSize: 14, marginTop: theme.spacing.space28 },
  error: { color: '#a23b35', fontSize: 14, marginTop: theme.spacing.space20 },
  group: { marginTop: theme.spacing.space24 },
  day: { marginBottom: theme.spacing.space10 },
  cardSet: { borderRadius: 16, overflow: 'hidden' },
  card: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#e3ebe6', paddingVertical: theme.spacing.space5, paddingHorizontal: theme.spacing.space9 },
  firstCard: { borderTopLeftRadius: 16, borderTopRightRadius: 16 },
  lastCard: { borderBottomLeftRadius: 16, borderBottomRightRadius: 16 },
  separator: { borderBottomWidth: 1, borderBottomColor: '#e3ebe6' },
  unread: { backgroundColor: '#f3f8ef', borderColor: '#d7e5d2' },
  cardHeader: { flexDirection: 'row', alignItems: 'center' },
  cardTitle: { flex: 1 },
  message: { color: '#29443d', fontSize: 14, lineHeight: 19, marginTop: theme.spacing.space3 },
  detail: { color: '#5f756d', fontSize: 13, lineHeight: 17, marginTop: theme.spacing.space3 },
  date: { color: '#8b9994', fontSize: 11, marginTop: theme.spacing.space5 },
  skeletonSet: { marginTop: theme.spacing.space24 },
  skeletonCard: { backgroundColor: '#edf2ee', borderRadius: 16, padding: theme.spacing.space9, marginBottom: theme.spacing.space8 },
  skeletonTitle: { width: '48%', height: 16, borderRadius: 6, backgroundColor: '#dce7df' },
  skeletonLine: { width: '88%', height: 12, borderRadius: 6, backgroundColor: '#dce7df', marginTop: theme.spacing.space14 },
  skeletonShortLine: { width: '35%', height: 10, borderRadius: 5, backgroundColor: '#dce7df', marginTop: theme.spacing.space12 },
});
