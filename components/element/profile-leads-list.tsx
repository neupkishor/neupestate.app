import { useCallback, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, StyleSheet, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { useAuthSession } from '@neup/auth/AuthSessionProvider';
import { useUserInfo } from '@neup/auth/auth';
import logica from '@neup/logica';
import { Input } from '@neup/components/ui/input';
import { Text } from '@neup/components/ui/text';
import { PageHeader } from '@/components/element/page-header';
import theme from '@base/theme.json';
import { rememberProfileLead } from '@/components/element/profile-lead-cache';

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
  const offset = useRef(0);
  const hasMore = useRef(true);
  const activeRequest = useRef(false);

  const load = useCallback(async (refresh = false) => {
    if (activeRequest.current || authLoading) return;
    if (!authenticated) {
      setLeads([]);
      setError('Sign in to view leads.');
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
      console.log(`[${kind}-leads] requesting`, { endpoint: `estate.lead.${kind}.list`, ...options });
      const response = kind === 'my'
        ? await logica.estate.lead.my.list(options)
        : kind === 'team'
          ? await logica.estate.lead.shared.list(options)
          : await logica.estate.lead.base.list(options);
      console.log(`[${kind}-leads] response`, { status: response.status, ok: response.ok, body: response.body });
      const body = response.body as any;
      const rows = response.ok && body?.success !== false ? extractRows(body) : null;
      if (!rows) throw new Error(body?.error || `Unable to load ${pageInfo[kind].title.toLowerCase()}.`);
      setLeads((current) => refresh || requestOffset === 0 ? rows : [...current, ...rows]);
      const pagination = body?.pagination ?? body?.data?.pagination;
      offset.current = requestOffset + rows.length;
      hasMore.current = typeof pagination?.hasMore === 'boolean' ? pagination.hasMore : rows.length === PAGE_SIZE;
    } catch (loadError) {
      console.error(`[${kind}-leads] request failed`, loadError);
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
    <PageHeader onBack={() => router.back()} />
    <Text name="title" style={styles.title}>{pageInfo[kind].title}</Text>
    <Text name="regular" style={styles.subtitle}>{pageInfo[kind].subtitle}</Text>
    <Input value={search} onChangeText={setSearch} placeholder="Search leads" style={styles.search} postIcon={<Text name="title2" style={styles.searchIcon}>⌕</Text>} />
    {loading && leads.length === 0 ? <View style={styles.center}><ActivityIndicator color="#173d35" /></View> : error && leads.length === 0 ? <View style={styles.center}><Text name="regular" style={styles.emptyText}>{error}</Text></View> : <FlatList
      data={filteredLeads}
      keyExtractor={(lead, index) => String(lead.id ?? lead.leadId ?? lead._id ?? index)}
      contentContainerStyle={[styles.list, leads.length === 0 && styles.emptyList]}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void load(true)} />}
      onEndReached={() => { if (hasMore.current && !activeRequest.current) void load(false); }}
      onEndReachedThreshold={0.5}
      ListEmptyComponent={<Text name="regular" style={styles.emptyText}>{query ? 'No leads match your search.' : error || pageInfo[kind].empty}</Text>}
      ListFooterComponent={loadingMore ? <ActivityIndicator color="#173d35" style={styles.footer} /> : null}
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
    />}
  </View>;
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: '#ffffff' },
  title: { marginHorizontal: theme.spacing.space20 },
  subtitle: { marginHorizontal: theme.spacing.space20, marginTop: theme.spacing.headingDescriptionGap, color: '#71817b' },
  search: { marginHorizontal: theme.spacing.space20, marginTop: theme.spacing.space16, marginBottom: theme.spacing.space8, height: 48 },
  searchIcon: { color: '#557d54', fontSize: 22 },
  list: { padding: theme.spacing.space20, paddingTop: theme.spacing.space20, paddingBottom: theme.spacing.space40 },
  emptyList: { flexGrow: 1, justifyContent: 'center' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: theme.spacing.space24 },
  emptyText: { textAlign: 'center', color: '#71817b' },
  card: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#e0e8e3', borderRadius: 14, padding: theme.spacing.space16, marginBottom: theme.spacing.space12 },
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
