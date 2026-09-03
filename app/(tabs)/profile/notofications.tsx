import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text } from '#/components/ui/text';
import { useAuthSession } from '#/core/auth-session';
import { runApi } from '#/core/infrastructure/api';
import { useEffect, useState } from 'react';

const NOTIFICATIONS_URL = 'https://neupgroup.com/account/bridge/api.v1/notification/me';
type Notification = { id: string; title: string; message: string; type: string; read: boolean; createdAt: string; detail: string | null };
type NotificationsResponse = { success?: boolean; notifications?: Notification[] };

export default function Notifications() {
  const router = useRouter();
  const { token } = useAuthSession();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    console.log('[notifications] GET request', { url: NOTIFICATIONS_URL, method: 'GET', headers: { 'x-auth-account': '[redacted]' } });
    void runApi<NotificationsResponse>({
      baseUrl: 'https://neupgroup.com/account',
      path: '/bridge/api.v1/notification/me',
      headers: { 'x-auth-account': token },
    }).then((result) => {
      console.log('[notifications] GET response', { status: result.status, ok: result.ok, body: result.body });
      if (!result.ok || result.body?.success === false) setError(`Notification request failed (${result.status}).`);
      else setNotifications(result.body?.notifications ?? []);
    }).catch((requestError) => {
      console.error('[notifications] GET failed', requestError);
      setError('Unable to load notifications.');
    }).finally(() => setLoading(false));
  }, [token]);

  const markAsRead = async (notification: Notification) => {
    if (notification.read || !token) return;
    const body = { notificationId: notification.id };
    console.log('[notifications] PATCH request', { url: NOTIFICATIONS_URL, method: 'PATCH', headers: { 'x-auth-account': '[redacted]', 'Content-Type': 'application/json' }, body });
    try {
      const result = await runApi({ baseUrl: 'https://neupgroup.com/account', path: '/bridge/api.v1/notification/me', method: 'PATCH', headers: { 'x-auth-account': token }, body });
      console.log('[notifications] PATCH response', { status: result.status, ok: result.ok, body: result.body });
      if (!result.ok) return;
      setNotifications((current) => current.map((item) => item.id === notification.id ? { ...item, read: true } : item));
    } catch (requestError) {
      console.error('[notifications] PATCH failed', requestError);
    }
  };

  const groups = groupByDay(notifications);
  return <SafeAreaView style={s.safe}><StatusBar style="dark" /><View style={s.header}><TouchableOpacity onPress={() => router.back()} accessibilityLabel="Go back"><Text name="propertyNavIcon" style={s.back}>‹</Text></TouchableOpacity><Text name="appTitle" style={s.headerTitle}>Notifications</Text><View style={s.headerSpacer} /></View><ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}><Text name="homeSubtitle" style={s.subtitle}>Stay up to date with your account activity.</Text>{loading && <SkeletonSet />}{error && <Text name="propertyError" style={s.error}>{error}</Text>}{!loading && !error && notifications.length === 0 && <Text name="regular" style={s.muted}>You have no notifications.</Text>}{groups.map(([day, items]) => <View key={day} style={s.group}><Text name="sectionTitle" style={s.day}>{day}</Text><View style={s.cardSet}>{items.map((notification, index) => <TouchableOpacity key={notification.id} style={[s.card, !notification.read && s.unread, index === 0 && s.firstCard, index === items.length - 1 && s.lastCard, index < items.length - 1 && s.separator]} activeOpacity={0.8} onPress={() => void markAsRead(notification)}><View style={s.cardHeader}><Text name="requirementsCardTitle" style={s.cardTitle}>{notification.title}</Text></View><Text name="medium" style={s.message}>{notification.message}</Text>{notification.detail && <Text name="requirementsCardSubtitle" style={s.detail}>{notification.detail}</Text>}<Text name="propertyMeta" style={s.date}>{new Date(notification.createdAt).toLocaleString()}</Text></TouchableOpacity>)}</View></View>)}</ScrollView></SafeAreaView>;
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
  safe: { flex: 1, backgroundColor: '#fff' },
  header: { height: 88, paddingTop: 38, paddingHorizontal: 20, backgroundColor: '#fff', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', elevation: 12, shadowColor: '#173d35', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.24, shadowRadius: 12, zIndex: 10 },
  back: { color: '#193d35', fontSize: 34 },
  headerTitle: { color: '#173d35', fontSize: 18 },
  headerSpacer: { width: 24 },
  content: { padding: 24, paddingBottom: 40 },
  title: { color: '#173d35' },
  subtitle: { marginTop: 8 },
  muted: { color: '#70817c', fontSize: 14, marginTop: 28 },
  error: { color: '#a23b35', fontSize: 14, marginTop: 20 },
  group: { marginTop: 24 },
  day: { marginBottom: 10 },
  cardSet: { borderRadius: 16, overflow: 'hidden' },
  card: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#e3ebe6', paddingVertical: 5, paddingHorizontal: 9 },
  firstCard: { borderTopLeftRadius: 16, borderTopRightRadius: 16 },
  lastCard: { borderBottomLeftRadius: 16, borderBottomRightRadius: 16 },
  separator: { borderBottomWidth: 1, borderBottomColor: '#e3ebe6' },
  unread: { backgroundColor: '#f3f8ef', borderColor: '#d7e5d2' },
  cardHeader: { flexDirection: 'row', alignItems: 'center' },
  cardTitle: { color: '#173d35', fontSize: 16, fontWeight: '900', flex: 1 },
  message: { color: '#29443d', fontSize: 14, lineHeight: 19, marginTop: 3 },
  detail: { color: '#5f756d', fontSize: 13, lineHeight: 17, marginTop: 3 },
  date: { color: '#8b9994', fontSize: 11, marginTop: 5 },
  skeletonSet: { marginTop: 24 },
  skeletonCard: { backgroundColor: '#edf2ee', borderRadius: 16, padding: 9, marginBottom: 8 },
  skeletonTitle: { width: '48%', height: 16, borderRadius: 6, backgroundColor: '#dce7df' },
  skeletonLine: { width: '88%', height: 12, borderRadius: 6, backgroundColor: '#dce7df', marginTop: 14 },
  skeletonShortLine: { width: '35%', height: 10, borderRadius: 5, backgroundColor: '#dce7df', marginTop: 12 },
});
