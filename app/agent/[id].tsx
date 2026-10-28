import { useEffect, useState } from 'react';
import { ActivityIndicator, Image, ScrollView, StyleSheet, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { PageHeader } from '@/components/element/page-header';
import logica from '@neup/logica';
import { Text } from '@neup/components/ui/text';
import theme from '@base/theme.json';

type AgentRecord = Record<string, any>;

function firstText(...values: unknown[]): string | undefined {
  return values.find((value): value is string => typeof value === 'string' && value.trim().length > 0)?.trim();
}

function imageUri(value: unknown): string | undefined {
  if (typeof value === 'string') return value;
  if (!value || typeof value !== 'object') return undefined;
  const image = value as { uri?: unknown; url?: unknown; src?: unknown };
  return imageUri(image.uri ?? image.url ?? image.src);
}

function agentFromResponse(body: any): AgentRecord | undefined {
  const candidate = body?.agent ?? body?.data?.agent ?? body?.data ?? body?.user;
  return candidate && typeof candidate === 'object' && !Array.isArray(candidate) ? candidate : undefined;
}

export default function AgentProfile() {
  const router = useRouter();
  const { id, name: initialName, image: initialImage, agency: initialAgency } = useLocalSearchParams<{
    id: string;
    name?: string;
    image?: string;
    agency?: string;
  }>();
  const [agent, setAgent] = useState<AgentRecord>(() => ({
    id,
    name: initialName,
    image: initialImage,
    agency: initialAgency ? { name: initialAgency } : undefined,
  }));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      setLoading(false);
      setError('Agent information is unavailable.');
      return;
    }
    let active = true;
    const request = { endpoint: 'estate.agent.get', agentId: String(id) };
    console.log('[agent-profile] requesting', request);
    void logica.estate.agent(String(id)).get()
      .then((response) => {
        console.log('[agent-profile] response', { status: response.status, ok: response.ok, body: response.body });
        const body = response.body as any;
        const record = response.ok && body?.success !== false ? agentFromResponse(body) : undefined;
        if (active && record) {
          setAgent((current) => ({ ...current, ...record }));
          setError(null);
        } else if (active && !initialName) {
          setError(body?.error || 'Unable to load agent information.');
        }
      })
      .catch((requestError) => {
        console.error('[agent-profile] request failed', requestError);
        if (active && !initialName) setError(requestError instanceof Error ? requestError.message : 'Unable to load agent information.');
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [id, initialName]);

  const agentName = firstText(agent.name, agent.displayName, [agent.firstName, agent.lastName].filter(Boolean).join(' '), initialName) ?? 'Agent';
  const photo = imageUri(agent.image ?? agent.displayImage ?? initialImage);
  const agencyName = firstText(agent.agency?.name, agent.agencyName, initialAgency);
  const email = firstText(agent.email, agent.contact?.email);
  const phone = firstText(agent.phone, agent.contact?.phone);
  const bio = firstText(agent.bio, agent.description, agent.about);

  return <View style={styles.page}>
    <PageHeader onBack={() => router.back()} backLabel="Back" />
    <ScrollView contentContainerStyle={styles.content}>
      <View style={styles.profileCard}>
        {photo ? <Image source={{ uri: photo }} style={styles.avatar} /> : <View style={[styles.avatar, styles.avatarFallback]}><Text name="title" style={styles.initial}>{agentName.charAt(0).toUpperCase()}</Text></View>}
        <Text name="title" style={styles.name}>{agentName}</Text>
        {agencyName ? <Text name="regular" style={styles.agency}>{agencyName}</Text> : null}
      </View>
      {loading ? <ActivityIndicator color="#173d35" style={styles.loader} /> : null}
      {error && !initialName ? <Text name="regular" style={styles.error}>{error}</Text> : null}
      {bio ? <View style={styles.infoCard}><Text name="title3" style={styles.sectionTitle}>About</Text><Text name="regular" style={styles.info}>{bio}</Text></View> : null}
      {email || phone ? <View style={styles.infoCard}>
        <Text name="title3" style={styles.sectionTitle}>Contact</Text>
        {phone ? <Text name="regular" style={styles.info}>{phone}</Text> : null}
        {email ? <Text name="regular" style={styles.info}>{email}</Text> : null}
      </View> : null}
    </ScrollView>
  </View>;
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: '#fff' },
  content: { padding: theme.spacing.space20, paddingBottom: theme.spacing.space40 },
  profileCard: { alignItems: 'center', paddingVertical: theme.spacing.space24 },
  avatar: { width: 96, height: 96, borderRadius: 48 },
  avatarFallback: { backgroundColor: '#eaf2e3', alignItems: 'center', justifyContent: 'center' },
  initial: { color: '#173d35' },
  name: { color: '#173d35', marginTop: theme.spacing.space14, textAlign: 'center' },
  agency: { color: '#71817b', marginTop: theme.spacing.space5 },
  loader: { marginVertical: theme.spacing.space12 },
  error: { color: '#a3332a', textAlign: 'center' },
  infoCard: { borderWidth: 1, borderColor: '#e0e8e3', borderRadius: 14, padding: theme.spacing.space16, marginTop: theme.spacing.space12 },
  sectionTitle: { color: '#173d35', marginBottom: theme.spacing.space8 },
  info: { color: '#40534c', marginTop: theme.spacing.space4 },
});
