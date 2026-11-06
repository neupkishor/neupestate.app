import { useCallback, useRef, useState } from 'react';
import { ActivityIndicator, Animated, Pressable, RefreshControl, StyleSheet, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { useAuthSession } from '@neup/auth/AuthSessionProvider';
import { useUserInfo } from '@neup/auth/auth';
import logica from '@neup/logica';
import { Input } from '@neup/components/ui/input';
import { Text } from '@neup/components/ui/text';
import { BaseIcon } from '@/components/element/base-icon';
import { HeaderFloating, HeaderStatic } from '@neup/components/ui/header';
import theme from '@base/theme.json';
import { rememberProfileLead } from '@/components/element/profile-lead-cache';
import { SignInPromptCard } from '@/components/element/sign-in-prompt-card';

type LeadKind = 'my' | 'team' | 'base';
type Lead = Record<string, any>;
const PAGE_SIZE = 25;

const pageInfo: Record<LeadKind, { title: string; subtitle: string; empty: string }> = {
  my: { title: 'My Leads', subtitle: 'Leads assigned or shared with you.', empty: 'No leads are currently shared with you.' },
  team: { title: 'Team Leads', subtitle: 'Leads your team is working on.', empty: 'No team leads are available.' },
  base: { title: 'Base Leads', subtitle: 'Leads available to your account.', empty: 'No base leads are available.' },
};

function extractRows(body: any): Lead[] | null {
  const candidates = [body?.data, body?.leads, body?.items, body?.data?.leads, body?.data?.items, body?.data?.results];
  return candidates.find(Array.isArray) ?? null;
}

function firstText(...values: unknown[]): string | undefined {
  return values.find((value): value is string => typeof value === 'string' && value.trim().length > 0)?.trim();
}

function personName(person: Lead | undefined): string | undefined {
  if (!person) return undefined;
  const fullName = [person.firstName, person.lastName]
    .filter((value): value is string => typeof value === 'string' && value.trim().length > 0)
    .map((value) => value.trim())
    .join(' ');
  return fullName || undefined;
}

function leadTitle(lead: Lead): string {
  return firstText(
    personName(lead.client),
    personName(lead),
    lead.name,
    lead.personName,
    lead.customerName,
    lead.contactName,
    lead.client?.name,
    lead.user?.name,
    lead.account?.displayName,
  ) ?? 'Lead';
}

function leadRole(lead: Lead): string {
  const role = firstText(lead.role, lead.leadType, lead.personType, lead.customerType, lead.contactType, lead.userType, lead.type, lead.purpose, lead.requirement?.purpose);
  return role ? role.replace(/[_-]+/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase()) : 'Role not specified';
}

function leadPriority(lead: Lead): string {
  const priority = firstText(lead.priority, lead.leadPriority, lead.qualification?.priority);
  return priority ? priority.replace(/[_-]+/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase()) : 'Not set';
}

function priorityStyle(priority: string) {
  switch (priority.toLocaleLowerCase()) {
    case 'hot': return styles.hotPriority;
    case 'warm': return styles.warmPriority;
    case 'cold': return styles.coldPriority;
    default: return styles.priority;
  }
}

function leadStatus(lead: Lead): string {
  if (lead.followUpRequired === true || lead.followupRequired === true) return 'Follow-up required';
  const status = firstText(lead.status, lead.leadStatus, lead.followUpStatus, lead.followupStatus, lead.nextAction);
  if (!status) return 'Not set';
  const normalized = status.toLocaleLowerCase().replace(/[_\s-]+/g, ' ').trim();
  if (normalized === 'followup required' || normalized === 'follow up required') return 'Follow-up required';
  return normalized.replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function daysAgo(lead: Lead): string {
  const value = firstText(lead.createdAt, lead.createdOn, lead.created, lead.updatedAt, lead.updatedOn);
  if (!value) return 'Date unavailable';
  const timestamp = new Date(value).getTime();
  if (!Number.isFinite(timestamp)) return 'Date unavailable';
  const days = Math.max(0, Math.floor((Date.now() - timestamp) / 86_400_000));
  return days === 0 ? 'Today' : `${days} ${days === 1 ? 'day' : 'days'} ago`;
}

function searchableText(lead: Lead): string {
  return [leadTitle(lead), leadRole(lead), leadPriority(lead), leadStatus(lead), lead.phone, lead.phoneNumber, lead.email, lead.property?.title, lead.propertyTitle, lead.propertyName, lead.propertyId]
    .filter((value) => typeof value === 'string')
    .join(' ')
    .toLocaleLowerCase();
}

function Meta({ label, value }: { label: string; value?: string }) {
  if (!value) return null;
  return <View style={styles.meta}><Text name="caption" style={styles.metaLabel}>{label}</Text><Text name="regular" style={styles.metaValue}>{value}</Text></View>;
}

export function ProfileLeadsList({ kind }: { kind: LeadKind }) {
  const router = useRouter();
  const user = useUserInfo();
  const { loading: authLoading } = useAuthSession();
  const authenticated = user.isAuthenticated;
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [headerHeight, setHeaderHeight] = useState(0);
  const scrollY = useRef(new Animated.Value(0)).current;
  const offset = useRef(0);
  const hasMore = useRef(true);
  const activeRequest = useRef(false);

  const load = useCallback(async (refresh = false) => {
    if (activeRequest.current || authLoading) return;
    if (!authenticated) {
      setLeads([]);
      setError(null);
      setLoading(false);
      setRefreshing(false);
      return;
    }
    if (!refresh && !hasMore.current) return;

    activeRequest.current = true;
    const requestOffset = refresh ? 0 : offset.current;
    if (refresh) {
      setRefreshing(true);
      offset.current = 0;
      hasMore.current = true;
    } else if (requestOffset > 0) setLoadingMore(true);
    else setLoading(true);
    setError(null);

    try {
      const options = { limit: PAGE_SIZE, offset: requestOffset };
      const response = kind === 'my'
        ? await logica.estate.lead.my.list(options)
        : kind === 'team'
          ? await logica.estate.lead.shared.list(options)
          : await logica.estate.lead.base.list(options);
      const body = response.body as any;
      const rows = response.ok && body?.success !== false ? extractRows(body) : null;
      if (!rows) throw new Error(body?.error || `Unable to load ${pageInfo[kind].title.toLowerCase()}.`);
      setLeads((current) => refresh || requestOffset === 0 ? rows : [...current, ...rows]);
      const pagination = body?.pagination ?? body?.data?.pagination;
      offset.current = requestOffset + rows.length;
      hasMore.current = typeof pagination?.hasMore === 'boolean' ? pagination.hasMore : rows.length === PAGE_SIZE;
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load leads.');
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
      activeRequest.current = false;
    }
  }, [authLoading, authenticated, kind]);

  useFocusEffect(useCallback(() => {
    if (!authLoading) void load(true);
  }, [authLoading, load]));

  const query = search.trim().toLocaleLowerCase();
  const filteredLeads = query ? leads.filter((lead) => searchableText(lead).includes(query)) : leads;

  return <View style={styles.page}>
    <HeaderFloating scrollY={scrollY} headerHeight={headerHeight}>
      <View style={styles.floatingHeaderContent}>
        <Pressable accessibilityRole="button" accessibilityLabel="Go back" onPress={() => router.back()} style={styles.floatingBackButton}><BaseIcon name="arrow-left-bold" size={20} color="#173d35" /></Pressable>
        <Text name="title2" size={20} lineHeight={27} numberOfLines={1}>{pageInfo[kind].title}</Text>
      </View>
    </HeaderFloating>
    <Animated.FlatList
      data={filteredLeads}
      ListHeaderComponent={<>
        <HeaderStatic onHeightChange={setHeaderHeight} style={styles.leadsHeader}>
        <Pressable accessibilityRole="button" accessibilityLabel="Go back" onPress={() => router.back()} style={styles.backButton}><BaseIcon name="arrow-left" size={18} color="#173d35" /><Text name="regular" style={styles.backLabel}>Back</Text></Pressable>
        <Text name="title" style={styles.title}>{pageInfo[kind].title}</Text>
        <Text name="regular" style={styles.subtitle}>{pageInfo[kind].subtitle}</Text>
        </HeaderStatic>
        <Input value={search} onChangeText={setSearch} placeholder="Search leads" style={styles.search} postIcon={<BaseIcon name="search" size={18} color="#173d35" />} />
        {loading && leads.length === 0 && <ActivityIndicator color="#173d35" style={styles.initialLoading} />}
      </>}
      keyExtractor={(lead, index) => String(lead.id ?? lead.leadId ?? lead._id ?? index)}
      contentContainerStyle={[styles.list, leads.length === 0 && styles.emptyList]}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void load(true)} />}
      onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: false })}
      scrollEventThrottle={16}
      onEndReached={() => { if (hasMore.current && !activeRequest.current) void load(false); }}
      onEndReachedThreshold={0.5}
      ListEmptyComponent={loading && leads.length === 0 ? undefined : !authenticated
        ? <SignInPromptCard
          title={kind === 'my' ? 'Sign In/Up to view your leads.' : kind === 'team' ? 'Sign In/Up to view shared leads.' : 'Sign In/Up to view base leads.'}
          description="Sign In/Up to stay updated with your leads."
        />
        : <Text name="regular" style={styles.emptyText}>{query ? 'No leads match your search.' : error || pageInfo[kind].empty}</Text>}
      ListFooterComponent={loadingMore ? <ActivityIndicator color="#173d35" style={styles.footer} /> : undefined}
      renderItem={({ item }) => {
        const leadId = item.id ?? item.leadId ?? item._id;
        const scope = kind === 'base' ? 'base' : 'shared';
        return <Pressable style={styles.card} disabled={leadId == null} onPress={() => {
          const id = String(leadId);
          rememberProfileLead(scope, id, item);
          router.push(scope === 'base' ? `/profile/leads/base/${id}` : `/profile/leads/shared/${id}`);
        }}>
        <View style={styles.cardHeader}><View style={styles.headingCopy}><Text name="title3" style={styles.name}>{leadTitle(item)}</Text><Text name="caption" style={styles.role}>{leadRole(item)}</Text></View><Text name="caption" style={styles.age}>{daysAgo(item)}</Text></View>
        <View style={styles.badges}><Text name="caption" style={[styles.badge, priorityStyle(leadPriority(item))]}>Priority: {leadPriority(item)}</Text><Text name="caption" style={[styles.badge, styles.status]}>Status: {leadStatus(item)}</Text></View>
        <Meta label="Phone" value={firstText(item.phone, item.phoneNumber, item.contact?.phone)} />
        <Meta label="Email" value={firstText(item.email, item.contact?.email)} />
        <Meta label="Property" value={firstText(item.property?.title, item.propertyTitle, item.propertyName, item.propertyId)} />
      </Pressable>;
      }}
    />
  </View>;
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: '#ffffff' },
  leadsHeader: { paddingBottom: theme.spacing.space8 },
  floatingHeaderContent: { minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: theme.spacing.space2 },
  floatingBackButton: { width: 24, height: 44, justifyContent: 'center' },
  backButton: { alignSelf: 'flex-start', minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: theme.spacing.space6 },
  backLabel: { color: '#173d35' },
  title: { color: '#173d35' },
  subtitle: { marginTop: 0, color: '#71817b' },
  search: { marginTop: theme.spacing.space14, marginBottom: 0, height: 48 },
  list: { paddingBottom: theme.spacing.space40 },
  initialLoading: { marginTop: theme.spacing.space24 },
  emptyList: { flexGrow: 1 },
  emptyText: { textAlign: 'center', color: '#71817b' },
  card: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#e0e8e3', borderRadius: 14, padding: theme.spacing.space16, marginHorizontal: theme.spacing.space20, marginBottom: theme.spacing.space12 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: theme.spacing.space12, marginBottom: theme.spacing.space9 },
  headingCopy: { flex: 1 },
  name: { color: '#173d35' },
  role: { color: '#71817b', marginTop: theme.spacing.space3 },
  age: { color: '#8b9994' },
  badges: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.space7, marginBottom: theme.spacing.space8 },
  badge: { borderRadius: 999, overflow: 'hidden', paddingHorizontal: theme.spacing.space8, paddingVertical: theme.spacing.space4 },
  priority: { color: '#557064', backgroundColor: '#eef2ef' },
  hotPriority: { color: '#a3332a', backgroundColor: '#fde8e6' },
  warmPriority: { color: '#8b5e13', backgroundColor: '#fff3d6' },
  coldPriority: { color: '#356982', backgroundColor: '#e6f3f8' },
  status: { color: '#42604b', backgroundColor: '#eaf2e3' },
  meta: { flexDirection: 'row', paddingVertical: theme.spacing.space4 },
  metaLabel: { width: 72, color: '#8b9994' },
  metaValue: { flex: 1, color: '#40534c' },
  footer: { paddingVertical: theme.spacing.space12 },
});
