import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Modal, ScrollView, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthSession } from '@neup/auth/AuthSessionProvider';
import { useUserInfo } from '@neup/auth/auth';
import logica from '@neup/logica';
import { Text } from '@neup/components/ui/text';
import { AppButton as Button } from '@/components/element/app-button';
import { Input } from '@neup/components/ui/input';
import type { EstateLeadActivityInput } from '@neup/logica/estate/lead';
import { PageHeader } from '@/components/element/page-header';
import { getRememberedProfileLead, type ProfileLeadRecord } from '@/components/element/profile-lead-cache';
import theme from '@base/theme.json';

type LeadScope = 'shared' | 'base';
type ActivityType = EstateLeadActivityInput['activityType'];
type FollowUpMethod = NonNullable<EstateLeadActivityInput['followUpMethod']>;
type LeadActivity = Record<string, any>;
type PropertyOption = Record<string, any> & { id: string };
const ACTIVITY_TYPES: ActivityType[] = ['follow_up', 'visit', 'meeting', 'remarks'];
const FOLLOW_UP_METHODS: FollowUpMethod[] = ['phone call', 'whatsapp', 'email'];
const PROPERTY_PAGE_SIZE = 15;

function localDateValue(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function localTimeValue(date: Date): string {
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

function activityTimestamp(dateValue: string, timeValue: string): string | undefined {
  const dateMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateValue.trim());
  const timeMatch = /^(\d{2}):(\d{2})$/.exec(timeValue.trim());
  if (!dateMatch || !timeMatch) return undefined;
  const [, yearText, monthText, dayText] = dateMatch;
  const [, hourText, minuteText] = timeMatch;
  const year = Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);
  const hour = Number(hourText);
  const minute = Number(minuteText);
  const date = new Date(year, month - 1, day, hour, minute);
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day || hour > 23 || minute > 59) return undefined;
  return date.toISOString();
}

function rowsFrom(body: any): ProfileLeadRecord[] {
  const candidates = [body?.data, body?.leads, body?.items, body?.data?.leads, body?.data?.items, body?.data?.results];
  return candidates.find(Array.isArray) ?? [];
}

function fieldValue(...values: unknown[]): unknown {
  return values.find((value) => value !== undefined && value !== null && value !== '');
}

function displayValue(value: unknown): string | undefined {
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  if (Array.isArray(value)) return value.map(displayValue).filter(Boolean).join(', ');
  if (value && typeof value === 'object') {
    const object = value as Record<string, unknown>;
    return displayValue(object.name ?? object.title ?? object.label ?? object.value ?? object.formatted);
  }
  return undefined;
}

function personName(person: Record<string, any> | undefined): string | undefined {
  if (!person) return undefined;
  const fullName = [person.firstName, person.lastName]
    .filter((value): value is string => typeof value === 'string' && value.trim().length > 0)
    .map((value) => value.trim())
    .join(' ');
  return fullName || undefined;
}

function formatDateWithAge(value: unknown): string | undefined {
  if (typeof value !== 'string' && typeof value !== 'number' && !(value instanceof Date)) return undefined;
  const date = value instanceof Date ? value : new Date(value);
  const timestamp = date.getTime();
  if (!Number.isFinite(timestamp)) return typeof value === 'string' ? value : undefined;

  const now = Date.now();
  const elapsed = Math.max(0, now - timestamp);
  const days = Math.floor(elapsed / 86_400_000);
  const dateLabel = new Intl.DateTimeFormat(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(date);

  if (days > 3) return `${dateLabel} (${days} days ago)`;

  const weekday = new Intl.DateTimeFormat(undefined, { weekday: 'long' }).format(date);
  const time = new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit' }).format(date);
  const hours = Math.floor(elapsed / 3_600_000);
  const minutes = Math.floor((elapsed % 3_600_000) / 60_000);
  const age = hours > 0 ? `${hours}h${minutes > 0 ? ` ${minutes}m` : ''} ago` : minutes > 0 ? `${minutes}m ago` : 'just now';
  return `${weekday} ${time} (${age})`;
}

function activityRows(body: any): LeadActivity[] {
  const candidates = [body?.data, body?.activities, body?.items, body?.data?.activities, body?.data?.items];
  return candidates.find(Array.isArray) ?? [];
}

function formatActivityType(value: unknown): string {
  return typeof value === 'string' ? value.replace(/[_-]+/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase()) : 'Activity';
}

function propertyTitle(property: PropertyOption): string {
  return typeof property.title === 'string' ? property.title : typeof property.description === 'string' ? property.description : 'Property listing';
}

function propertyLocation(property: PropertyOption): string | undefined {
  const location = property.location;
  if (typeof location === 'string') return location;
  if (location && typeof location === 'object') {
    const formatted = location.formatted ?? location.text;
    return typeof formatted === 'string' ? formatted : undefined;
  }
  return undefined;
}

async function logActivityFailure(operation: 'get' | 'post', request: unknown, response: unknown, error?: unknown) {
  try {
    await logica.logger().type(`estate.lead.activity.${operation}`).error({ request, response, error });
  } catch (loggingError) {
    console.warn('[lead-activity] unable to send failure to logica.logger', loggingError);
  }
}

function LeadActivities({ leadId, scope }: { leadId: string; scope: LeadScope }) {
  const [activities, setActivities] = useState<LeadActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [activityType, setActivityType] = useState<ActivityType>('follow_up');
  const [followUpMethod, setFollowUpMethod] = useState<FollowUpMethod>('phone call');
  const [activityDate, setActivityDate] = useState(() => localDateValue(new Date()));
  const [activityTime, setActivityTime] = useState(() => localTimeValue(new Date()));
  const [selectedProperty, setSelectedProperty] = useState<PropertyOption | null>(null);
  const [properties, setProperties] = useState<PropertyOption[]>([]);
  const [propertySearch, setPropertySearch] = useState('');
  const [propertyPickerOpen, setPropertyPickerOpen] = useState(false);
  const [loadingProperties, setLoadingProperties] = useState(false);
  const [propertyError, setPropertyError] = useState<string | null>(null);
  const [propertiesHaveMore, setPropertiesHaveMore] = useState(true);
  const propertyOffset = useRef(0);
  const propertyRequestActive = useRef(false);
  const [remarks, setRemarks] = useState('');
  const [error, setError] = useState<string | null>(null);

  const loadActivities = useCallback(async () => {
    const request = { leadId };
    let failureLogged = false;
    const endpoint = scope === 'base' ? 'estate.lead.base.activity.get' : 'estate.lead.activity.get';
    console.log('[lead-activity] requesting', { endpoint, ...request });
    try {
      const response = scope === 'base'
        ? await logica.estate.lead.base.activity.get(leadId)
        : await logica.estate.lead.activity.get(leadId);
      console.log('[lead-activity] response', { status: response.status, ok: response.ok, body: response.body });
      const body = response.body as any;
      if (!response.ok || body?.success === false) {
        await logActivityFailure('get', request, { status: response.status, body });
        failureLogged = true;
        throw new Error(body?.error || 'Unable to load lead activities.');
      }
      setActivities(activityRows(body));
      setError(null);
    } catch (loadError) {
      console.error('[lead-activity] request failed', loadError);
      if (!failureLogged) await logActivityFailure('get', request, undefined, loadError);
      setError(loadError instanceof Error ? loadError.message : 'Unable to load lead activities.');
    } finally {
      setLoading(false);
    }
  }, [leadId, scope]);

  useEffect(() => { void loadActivities(); }, [loadActivities]);

  const loadProperties = useCallback(async (refresh = false) => {
    if (propertyRequestActive.current || (!refresh && !propertiesHaveMore)) return;
    propertyRequestActive.current = true;
    const offset = refresh ? 0 : propertyOffset.current;
    setLoadingProperties(true);
    setPropertyError(null);
    const request = { endpoint: 'estate.property.list', status: 'active', limit: PROPERTY_PAGE_SIZE, offset };
    console.log('[lead-activity] requesting property options', request);
    try {
      const response = await logica.estate.property.list({ status: 'active', limit: PROPERTY_PAGE_SIZE, offset });
      console.log('[lead-activity] property options response', { status: response.status, ok: response.ok, body: response.body });
      const body = response.body as any;
      if (!response.ok || body?.success === false || !Array.isArray(body?.properties)) {
        throw new Error(body?.error || 'Unable to load properties.');
      }
      const rows = body.properties
        .filter((property: any) => property?.id != null)
        .map((property: any) => ({ ...property, id: String(property.id) })) as PropertyOption[];
      setProperties((current) => refresh ? rows : [...current, ...rows]);
      propertyOffset.current = offset + body.properties.length;
      setPropertiesHaveMore(typeof body.totalCount === 'number' ? propertyOffset.current < body.totalCount : body.properties.length === PROPERTY_PAGE_SIZE);
    } catch (propertyLoadError) {
      console.error('[lead-activity] property options request failed', propertyLoadError);
      setPropertyError(propertyLoadError instanceof Error ? propertyLoadError.message : 'Unable to load properties.');
      try {
        await logica.logger().type('estate.lead.activity.properties').error({ request, error: propertyLoadError });
      } catch (loggingError) {
        console.warn('[lead-activity] unable to send property failure to logica.logger', loggingError);
      }
    } finally {
      setLoadingProperties(false);
      propertyRequestActive.current = false;
    }
  }, [propertiesHaveMore]);

  const createActivity = async () => {
    const trimmedRemarks = remarks.trim();
    if (!trimmedRemarks) {
      Alert.alert('Add a note', 'Enter remarks before saving this activity.');
      return;
    }
    const activityOn = activityTimestamp(activityDate, activityTime);
    if (!activityOn) {
      Alert.alert('Check the date and time', 'Enter a valid date as YYYY-MM-DD and time as HH:MM.');
      return;
    }
    const requestBody: EstateLeadActivityInput = {
      activityType,
      activityOn,
      remarks: trimmedRemarks,
      ...(activityType === 'follow_up' ? { followUpMethod } : {}),
      ...(selectedProperty ? { propertyId: selectedProperty.id } : {}),
    };
    const request = { leadId, body: requestBody };
    setSaving(true);
    setError(null);
    console.log('[lead-activity] creating', { endpoint: 'estate.lead.activity.post', ...request });
    let failureLogged = false;
    try {
      const response = await logica.estate.lead.activity.post(leadId, requestBody);
      console.log('[lead-activity] create response', { status: response.status, ok: response.ok, body: response.body });
      const body = response.body as any;
      if (!response.ok || body?.success === false) {
        await logActivityFailure('post', request, { status: response.status, body });
        failureLogged = true;
        throw new Error(body?.error || 'Unable to save this activity.');
      }
      setRemarks('');
      setSelectedProperty(null);
      setPropertySearch('');
      setPropertyPickerOpen(false);
      const now = new Date();
      setActivityDate(localDateValue(now));
      setActivityTime(localTimeValue(now));
      setShowForm(false);
      await loadActivities();
    } catch (createError) {
      console.error('[lead-activity] create request failed', createError);
      setError(createError instanceof Error ? createError.message : 'Unable to save this activity.');
      if (!failureLogged) await logActivityFailure('post', request, undefined, createError);
    } finally {
      setSaving(false);
    }
  };

  return <View style={styles.activitySection}>
    <View style={styles.activityHeader}>
      <Text name="title3" style={styles.sectionTitle}>Activities</Text>
      {scope === 'shared' ? <Button variant="solid" size="sm" onPress={() => { setError(null); setShowForm(true); }}><Text name="caption" style={styles.actionText}>Create activity</Text></Button> : null}
    </View>
    {loading ? <ActivityIndicator color="#173d35" style={styles.activityLoader} /> : activities.length === 0 ? <Text name="regular" style={styles.activityEmpty}>No activities yet.</Text> : activities.map((activity, index) => {
      const details = activity.data ?? activity;
      return <View key={String(activity.id ?? index)} style={styles.activityCard}>
        <View style={styles.activityCardHeader}><Text name="title3" style={styles.activityType}>{formatActivityType(details.activityType)}</Text><Text name="caption" style={styles.activityDate}>{formatDateWithAge(activity.activityOn) ?? ''}</Text></View>
        {details.followUpMethod ? <Text name="caption" style={styles.activityMeta}>{formatActivityType(details.followUpMethod)}</Text> : null}
        {details.propertyTitle ? <Text name="caption" style={styles.activityMeta}>{details.propertyTitle}</Text> : null}
        {activity.lead ? <Text name="caption" style={styles.activityMeta}>From {formatActivityType(activity.lead.type)} lead · {activity.lead.id}</Text> : null}
        {details.remarks ? <Text name="regular" style={styles.activityRemarks}>{details.remarks}</Text> : null}
        {activity.activityBy ? <Text name="caption" style={styles.activityMeta}>By {activity.activityBy}</Text> : null}
      </View>;
    })}
    {error ? <Text name="caption" style={styles.activityError}>{error}</Text> : null}
    <Modal visible={showForm && scope === 'shared'} transparent animationType="slide" onRequestClose={() => setShowForm(false)}>
      <View style={styles.modalBackdrop}>
        <View style={styles.modalCard}>
          <ScrollView keyboardShouldPersistTaps="handled">
            <Text name="title2" style={styles.modalTitle}>Create activity</Text>
            <Text name="caption" style={styles.formLabel}>Activity type</Text>
            <View style={styles.choiceRow}>{ACTIVITY_TYPES.map((type) => <Button key={type} size="sm" variant={activityType === type ? 'tinted' : 'outlined'} onPress={() => setActivityType(type)}><Text name="caption" style={styles.choiceText}>{formatActivityType(type)}</Text></Button>)}</View>
            {activityType === 'follow_up' ? <>
              <Text name="caption" style={styles.formLabel}>Follow-up method</Text>
              <View style={styles.choiceRow}>{FOLLOW_UP_METHODS.map((method) => <Button key={method} size="sm" variant={followUpMethod === method ? 'tinted' : 'outlined'} onPress={() => setFollowUpMethod(method)}><Text name="caption" style={styles.choiceText}>{formatActivityType(method)}</Text></Button>)}</View>
            </> : null}
            <Text name="caption" style={styles.formLabel}>When did this activity happen?</Text>
            <View style={styles.dateTimeRow}>
              <Input value={activityDate} onChangeText={setActivityDate} placeholder="YYYY-MM-DD" keyboardType="numbers-and-punctuation" autoCapitalize="none" style={styles.dateInput} />
              <Input value={activityTime} onChangeText={setActivityTime} placeholder="HH:MM" keyboardType="numbers-and-punctuation" autoCapitalize="none" style={styles.timeInput} />
            </View>
            <Text name="caption" style={styles.formLabel}>Select a property (optional)</Text>
            <Button variant="outlined" alignment="left" style={styles.propertySelectButton} onPress={() => {
              const opening = !propertyPickerOpen;
              setPropertyPickerOpen(opening);
              if (opening && properties.length === 0) void loadProperties(true);
            }}>
              <Text name="regular" style={styles.propertySelectText}>{selectedProperty ? propertyTitle(selectedProperty) : 'Choose a property'}</Text>
            </Button>
            {selectedProperty && propertyLocation(selectedProperty) ? <Text name="caption" style={styles.propertyLocation}>{propertyLocation(selectedProperty)}</Text> : null}
            {propertyPickerOpen ? <View style={styles.propertyPicker}>
              <Input value={propertySearch} onChangeText={setPropertySearch} placeholder="Search properties" style={styles.propertySearch} />
              <Button variant="text" alignment="left" size="sm" onPress={() => { setSelectedProperty(null); setPropertyPickerOpen(false); }}><Text name="caption" style={styles.clearProperty}>No property</Text></Button>
              {propertyError ? <Text name="caption" style={styles.activityError}>{propertyError}</Text> : null}
              {loadingProperties && properties.length === 0 ? <ActivityIndicator color="#173d35" style={styles.activityLoader} /> : null}
              {properties.filter((property) => `${propertyTitle(property)} ${propertyLocation(property) ?? ''}`.toLocaleLowerCase().includes(propertySearch.trim().toLocaleLowerCase())).map((property) => <Button key={property.id} variant={selectedProperty?.id === property.id ? 'tinted' : 'plain'} alignment="left" style={styles.propertyOption} onPress={() => { setSelectedProperty(property); setPropertyPickerOpen(false); }}>
                <View><Text name="regular" style={styles.propertySelectText}>{propertyTitle(property)}</Text>{propertyLocation(property) ? <Text name="caption" style={styles.propertyLocation}>{propertyLocation(property)}</Text> : null}</View>
              </Button>)}
              {loadingProperties && properties.length > 0 ? <ActivityIndicator color="#173d35" style={styles.activityLoader} /> : null}
              {!loadingProperties && propertiesHaveMore ? <Button variant="text" size="sm" onPress={() => void loadProperties()}><Text name="caption" style={styles.clearProperty}>Load more properties</Text></Button> : null}
              {!loadingProperties && properties.length === 0 && !propertyError ? <Text name="caption" style={styles.activityEmpty}>No properties available.</Text> : null}
            </View> : null}
            <Text name="caption" style={styles.formLabel}>Remarks</Text>
            <Input value={remarks} onChangeText={setRemarks} placeholder="Add activity notes" multiline textAlignVertical="top" style={styles.remarksInput} />
            <View style={styles.modalActions}>
              <Button variant="outlined" style={styles.modalButton} disabled={saving} onPress={() => setShowForm(false)}><Text name="caption" style={styles.choiceText}>Cancel</Text></Button>
              <Button variant="solid" style={styles.modalButton} loading={saving} onPress={() => void createActivity()}><Text name="caption" style={styles.actionText}>{saving ? 'Saving…' : 'Save activity'}</Text></Button>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  </View>;
}

function leadName(lead: ProfileLeadRecord) {
  return displayValue(fieldValue(
    personName(lead.client),
    personName(lead),
    lead.name,
    lead.personName,
    lead.customerName,
    lead.contactName,
    lead.client?.name,
    lead.user?.name,
    lead.account?.displayName,
  )) ?? 'Lead details';
}

function detailRows(lead: ProfileLeadRecord) {
  return [
    ['Lead type', fieldValue(lead.role, lead.leadType, lead.personType, lead.customerType, lead.contactType, lead.userType, lead.type, lead.purpose, lead.requirement?.purpose)],
    ['Priority', fieldValue(lead.priority, lead.leadPriority, lead.qualification?.priority)],
    ['Status', lead.followUpRequired || lead.followupRequired ? 'Follow-up required' : fieldValue(lead.status, lead.leadStatus, lead.followUpStatus, lead.followupStatus, lead.nextAction)],
    ['Phone', fieldValue(lead.phone, lead.phoneNumber, lead.contact?.phone, lead.client?.contact?.phone)],
    ['Email', fieldValue(lead.email, lead.contact?.email, lead.client?.contact?.email)],
    ['Property', fieldValue(lead.property?.title, lead.propertyTitle, lead.propertyName, lead.propertyId)],
    ['Location', fieldValue(lead.location, lead.property?.location, lead.requirement?.location)],
    ['Requirement', fieldValue(lead.requirement?.description, lead.requirement?.summary, lead.requirementText, lead.message, lead.notes)],
    ['Budget', fieldValue(lead.budget, lead.requirement?.budget, lead.minBudget || lead.maxBudget ? `${lead.minBudget ?? ''}${lead.minBudget != null && lead.maxBudget != null ? ' – ' : ''}${lead.maxBudget ?? ''}` : undefined)],
    ['Assigned to', fieldValue(lead.assignedTo?.name, lead.assignee?.name, lead.agent?.name, lead.assignedTo, lead.assignee)],
    ['Follow-up date', fieldValue(lead.followUpAt, lead.followUpDate, lead.followupAt)],
    ['Source', fieldValue(lead.source, lead.leadSource)],
    ['Created', formatDateWithAge(fieldValue(lead.createdAt, lead.createdOn))],
    ['Updated', formatDateWithAge(fieldValue(lead.updatedAt, lead.updatedOn))],
  ] as const;
}

export function ProfileLeadDetail({ scope, id }: { scope: LeadScope; id: string }) {
  const router = useRouter();
  const user = useUserInfo();
  const { loading: authLoading } = useAuthSession();
  const [lead, setLead] = useState<ProfileLeadRecord | undefined>(() => getRememberedProfileLead(scope, id));
  const [loading, setLoading] = useState(!lead);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (lead || authLoading) return;
    if (!user.isAuthenticated) {
      setError('Sign in to view lead details.');
      setLoading(false);
      return;
    }

    let active = true;
    const options = { limit: 100, offset: 0 };
    console.log(`[${scope}-leads] requesting detail fallback`, { endpoint: `estate.lead.${scope}.list`, leadId: id, ...options });
    const request = scope === 'shared'
      ? logica.estate.lead.shared.list(options)
      : logica.estate.lead.base.list(options);
    void request.then((response) => {
      console.log(`[${scope}-leads] detail fallback response`, { status: response.status, ok: response.ok, body: response.body });
      const body = response.body as any;
      const record = response.ok && body?.success !== false
        ? rowsFrom(body).find((item) => String(item.id ?? item.leadId ?? item._id) === id)
        : undefined;
      if (active && record) setLead(record);
      else if (active) setError(body?.error || 'Could not find this lead in the available records.');
    }).catch((requestError) => {
      console.error(`[${scope}-leads] detail request failed`, requestError);
      if (active) setError(requestError instanceof Error ? requestError.message : 'Unable to load lead details.');
    }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [authLoading, id, lead, scope, user.isAuthenticated]);

  const rows = lead ? detailRows(lead).map(([label, value]) => [label, displayValue(value)] as const).filter(([, value]) => Boolean(value)) : [];

  return <View style={styles.page}>
    <PageHeader onBack={() => router.back()} />
    <ScrollView contentContainerStyle={styles.content}>
      {loading ? <ActivityIndicator color="#173d35" style={styles.center} /> : error || !lead ? <Text name="regular" style={styles.message}>{error ?? 'Lead not found.'}</Text> : <>
        <Text name="title" style={styles.title}>{leadName(lead)}</Text>
        <Text name="regular" style={styles.subtitle}>Lead details</Text>
        <View style={styles.card}>
          {rows.map(([label, value]) => <View key={label} style={styles.row}><Text name="caption" style={styles.label}>{label}</Text><Text name="regular" style={styles.value}>{value}</Text></View>)}
        </View>
        <LeadActivities leadId={String(lead.id ?? lead.leadId ?? lead._id ?? id)} scope={scope} />
      </>}
    </ScrollView>
  </View>;
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: '#fff' },
  content: { padding: theme.spacing.space20, paddingBottom: theme.spacing.space40 },
  center: { marginTop: theme.spacing.space40 },
  title: { color: '#173d35' },
  subtitle: { color: '#71817b', marginTop: theme.spacing.headingDescriptionGap },
  card: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#e0e8e3', borderRadius: 14, paddingHorizontal: theme.spacing.space16, marginTop: theme.spacing.space20 },
  row: { flexDirection: 'row', gap: theme.spacing.space12, paddingVertical: theme.spacing.space13, borderBottomWidth: 1, borderBottomColor: '#edf1ee' },
  label: { width: 100, color: '#8b9994' },
  value: { flex: 1, color: '#40534c' },
  message: { textAlign: 'center', color: '#71817b', marginTop: theme.spacing.space40 },
  activitySection: { marginTop: theme.spacing.space24 },
  activityHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: theme.spacing.space12 },
  sectionTitle: { color: '#173d35' },
  actionText: { color: '#d8f36a' },
  activityLoader: { padding: theme.spacing.space16 },
  activityEmpty: { color: '#71817b', paddingVertical: theme.spacing.space12 },
  activityCard: { borderWidth: 1, borderColor: '#e0e8e3', borderRadius: 12, padding: theme.spacing.space13, marginBottom: theme.spacing.space10 },
  activityCardHeader: { flexDirection: 'row', justifyContent: 'space-between', gap: theme.spacing.space10, alignItems: 'flex-start' },
  activityType: { color: '#173d35', textTransform: 'capitalize' },
  activityDate: { color: '#8b9994', flexShrink: 1, textAlign: 'right' },
  activityMeta: { color: '#71817b', marginTop: theme.spacing.space5, textTransform: 'capitalize' },
  activityRemarks: { color: '#40534c', marginTop: theme.spacing.space8 },
  activityError: { color: '#a3332a', marginTop: theme.spacing.space8 },
  modalBackdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.35)' },
  modalCard: { maxHeight: '90%', backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: theme.spacing.space20 },
  modalTitle: { color: '#173d35', marginBottom: theme.spacing.space16 },
  formLabel: { color: '#40534c', marginBottom: theme.spacing.space8, marginTop: theme.spacing.space10 },
  choiceRow: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.space8 },
  choiceText: { color: '#173d35', textTransform: 'capitalize' },
  formInput: { marginBottom: theme.spacing.space4 },
  dateTimeRow: { flexDirection: 'row', gap: theme.spacing.space8 },
  dateInput: { flex: 1.5 },
  timeInput: { flex: 1 },
  propertySelectButton: { justifyContent: 'flex-start' },
  propertySelectText: { color: '#173d35' },
  propertyLocation: { color: '#71817b', marginTop: theme.spacing.space4 },
  propertyPicker: { borderWidth: 1, borderColor: '#e0e8e3', borderRadius: 12, padding: theme.spacing.space10, marginTop: theme.spacing.space8 },
  propertySearch: { marginBottom: theme.spacing.space8 },
  propertyOption: { justifyContent: 'flex-start', marginBottom: theme.spacing.space4 },
  clearProperty: { color: '#557d54' },
  remarksInput: { minHeight: 96, alignItems: 'flex-start', paddingTop: theme.spacing.space10 },
  modalActions: { flexDirection: 'row', gap: theme.spacing.space10, marginTop: theme.spacing.space18 },
  modalButton: { flex: 1 },
});
