import { useEffect, useState, type ReactNode } from 'react';
import { Image, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { PageHeader } from '@/components/element/page-header';
import { ProfilePropertyCard } from '@/components/element/profile-property-card';
import logica from '@neup/logica';
import { Text } from '@neup/components/ui/text';
import theme from '@base/theme.json';

type ProfileRecord = Record<string, any>;
type ProfileProperty = Record<string, any> & { id: string };

function firstText(...values: unknown[]): string | undefined {
  return values.find((value): value is string => typeof value === 'string' && value.trim().length > 0)?.trim();
}

function imageUri(value: unknown): string | undefined {
  if (typeof value === 'string') return value;
  if (!value || typeof value !== 'object') return undefined;
  const image = value as { uri?: unknown; url?: unknown; src?: unknown };
  return imageUri(image.uri ?? image.url ?? image.src);
}

function bioRuns(text: string, onMention: (neupid: string) => void): ReactNode[] {
  const mentionPattern = /@[A-Za-z0-9][A-Za-z0-9_-]*/g;
  const runs: ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = mentionPattern.exec(text)) !== null) {
    if (match.index > lastIndex) runs.push(text.slice(lastIndex, match.index));
    const mention = match[0];
    runs.push(
      <Text
        key={`mention-${match.index}`}
        accessibilityRole="link"
        onPress={() => onMention(mention.slice(1))}
        style={styles.mention}
      >
        {mention}
      </Text>,
    );
    lastIndex = match.index + mention.length;
  }

  if (lastIndex < text.length) runs.push(text.slice(lastIndex));
  return runs;
}

export default function ProfilePage() {
  const router = useRouter();
  const { id, type, name: initialName, image: initialImage } = useLocalSearchParams<{
    id: string;
    type?: string;
    name?: string;
    image?: string;
  }>();
  const [profile, setProfile] = useState<ProfileRecord>(() => ({ id, name: initialName, image: initialImage }));
  const [properties, setProperties] = useState<ProfileProperty[]>([]);
  const [hasMoreProperties, setHasMoreProperties] = useState(false);
  const [loadingMoreProperties, setLoadingMoreProperties] = useState(false);
  const [resolvedProfileId, setResolvedProfileId] = useState<string | null>(null);
  const [propertyCount, setPropertyCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notFoundNeupid, setNotFoundNeupid] = useState<string | null>(null);

  async function openMentionedProfile(neupid: string) {
    router.push({ pathname: '/profile/[id]', params: { id: `@${neupid}`, type: 'neupid' } });
  }

  useEffect(() => {
    if (!id) {
      setLoading(false);
      setError('Profile information is unavailable.');
      return;
    }

    let active = true;
    const profileId = String(id);
    const requestedType = String(type ?? '').toLowerCase();
    setLoading(true);
    setError(null);
    setNotFoundNeupid(null);
    setPropertyCount(null);
    setProperties([]);
    setHasMoreProperties(false);
    setResolvedProfileId(null);

    void (async () => {
      try {
        let resolvedId = profileId;
        if (requestedType === 'neupid') {
          const neupid = profileId.replace(/^@/, '').trim();
          const request = { neupid };
          console.log('[profile-mention] requesting', { endpoint: 'GET /bridge/api.v1/accounts', query: request });
          let listResponse;
          try {
            listResponse = await logica.estate.profile.list(request);
          } catch (lookupError) {
            console.log('[profile-mention] response', {
              status: (lookupError as any)?.status,
              ok: false,
              body: (lookupError as any)?.body,
              error: lookupError instanceof Error ? lookupError.message : lookupError,
            });
            throw lookupError;
          }
          console.log('[profile-mention] response', { status: listResponse.status, ok: listResponse.ok, body: listResponse.body });
          const body = listResponse.body as any;
          if (!listResponse.ok || body?.success !== true) {
            console.log('[profile-mention] unsuccessful response', { status: listResponse.status, ok: listResponse.ok, body: listResponse.body });
            const isNotFound = listResponse.status === 404 || /not found|does not exist|no profile/i.test(String(body?.error ?? ''));
            if (isNotFound) {
              if (active) setNotFoundNeupid(neupid);
              return;
            }
            throw new Error(body?.error || 'Unable to find this profile.');
          }
          const match = body.accounts?.find((account: any) => typeof account?.neupid === 'string' && account.neupid.replace(/^@/, '').trim().toLowerCase() === neupid.toLowerCase()) ?? body.account ?? body.profile;
          if (!match?.id) {
            console.log('[profile-mention] not found response', { status: listResponse.status, ok: listResponse.ok, body: listResponse.body });
            if (active) setNotFoundNeupid(neupid);
            return;
          }
          resolvedId = String(match.id);
          if (active) setProfile(match);
        }

        console.log('[profile] requesting', { endpoint: `GET /bridge/api.v1/accounts/${encodeURIComponent(resolvedId)}` });
        const response = await logica.estate.profile(resolvedId).get();
        console.log('[profile] response', { status: response.status, ok: response.ok, body: response.body });
        const body = response.body as any;
        if (!response.ok || body?.success !== true) {
          throw new Error(body?.error || 'Unable to load profile information.');
        }

        const profileRecord = body.profile ?? body.data?.profile;
        const propertyTotal = body.properties?.count ?? body.data?.properties?.count;
        const count = typeof propertyTotal === 'number' && Number.isFinite(propertyTotal) ? propertyTotal : null;
        if (active) {
          if (profileRecord && typeof profileRecord === 'object') setProfile((current) => ({ ...current, ...profileRecord }));
          setPropertyCount(count);
          setResolvedProfileId(resolvedId);
        }

        const accountType = String(profileRecord?.type ?? type ?? '').toLowerCase();
        const propertyRequest = {
          ...(accountType === 'agency' ? { agencyId: resolvedId } : { accountId: resolvedId }),
          status: ['active'],
          fields: ['id', 'title', 'description', 'images', 'image', 'location', 'pricing', 'price'],
          limit: 10,
          offset: 0,
        };
        console.log('[profile-properties] requesting', { endpoint: 'GET /bridge/api.v1/properties', query: propertyRequest });
        const propertyResponse = await logica.estate.property.list(propertyRequest);
        console.log('[profile-properties] response', { status: propertyResponse.status, ok: propertyResponse.ok, body: propertyResponse.body });
        if (!propertyResponse.ok || propertyResponse.body?.success === false) {
          console.warn('[profile-properties] unable to load profile properties', propertyResponse.body?.error);
        } else if (active) {
          const rows = Array.isArray(propertyResponse.body?.properties) ? propertyResponse.body.properties : [];
          const normalized = rows.filter((item: any) => item?.id != null).slice(0, 10).map((item: any) => ({ ...item, id: String(item.id) }));
          setProperties(normalized);
          setHasMoreProperties(typeof propertyResponse.body?.totalCount === 'number'
            ? propertyResponse.body.totalCount > normalized.length
            : normalized.length === 10);
        }
      } catch (requestError) {
        console.error('[profile] request failed', requestError);
        if (active) setError(requestError instanceof Error ? requestError.message : 'Unable to load profile.');
      } finally {
        if (active) setLoading(false);
      }
    })();

    return () => { active = false; };
  }, [id, type]);

  const isAgency = String(profile.type ?? type ?? '').toLowerCase() === 'agency';
  const profileName = firstText(profile.name, profile.displayName, profile.title, [profile.firstName, profile.lastName].filter(Boolean).join(' '), initialName) ?? (isAgency ? 'Agency' : 'Agent');
  const photo = imageUri(profile.image ?? profile.logo ?? profile.displayImage ?? initialImage);
  const description = firstText(profile.description, profile.bio, profile.about);
  const neupid = firstText(profile.neupid, profile.neupId);
  const cover = imageUri(profile.cover ?? profile.coverImage ?? profile.banner);
  const count = propertyCount ?? profile.propertiesCount ?? profile.propertyCount ?? profile.totalProperties;
  const countLabel = typeof count === 'number' || typeof count === 'string' ? String(count) : '—';

  async function loadMoreProperties() {
    if (!resolvedProfileId || loadingMoreProperties || !hasMoreProperties) return;
    setLoadingMoreProperties(true);
    const accountType = String(profile.type ?? type ?? '').toLowerCase();
    const request = {
      ...(accountType === 'agency' ? { agencyId: resolvedProfileId } : { accountId: resolvedProfileId }),
      status: ['active'],
      fields: ['id', 'title', 'description', 'images', 'image', 'location', 'pricing', 'price'],
      limit: 10,
      offset: properties.length,
    };
    console.log('[profile-properties] requesting', { endpoint: 'GET /bridge/api.v1/properties', query: request });
    try {
      const response = await logica.estate.property.list(request);
      console.log('[profile-properties] response', { status: response.status, ok: response.ok, body: response.body });
      if (!response.ok || response.body?.success === false) throw new Error(response.body?.error || 'Unable to load more properties.');
      const rows = Array.isArray(response.body?.properties) ? response.body.properties : [];
      const normalized = rows.filter((item: any) => item?.id != null).map((item: any) => ({ ...item, id: String(item.id) }));
      setProperties((current) => [...current, ...normalized]);
      setHasMoreProperties(typeof response.body?.totalCount === 'number'
        ? properties.length + normalized.length < response.body.totalCount
        : normalized.length === 10);
    } catch (loadError) {
      console.error('[profile-properties] load more failed', loadError);
    } finally {
      setLoadingMoreProperties(false);
    }
  }

  return <View style={styles.page}>
    <StatusBar style="dark" />
    <ScrollView contentContainerStyle={styles.content}>
      <PageHeader onBack={() => router.back()} backLabel="Back" compact />
      <View style={styles.body}>
      {loading ? <ProfileSkeleton /> : notFoundNeupid ? <View style={styles.notFound}>
          <Text name="title" style={styles.notFoundHandle}>@{notFoundNeupid}</Text>
          <Text name="regular" style={styles.notFoundMessage}>User not Found.</Text>
          <TouchableOpacity accessibilityRole="button" activeOpacity={0.8} style={styles.actionButton} onPress={() => router.replace('/home')}>
            <Text name="title3" style={styles.actionButtonText}>Back to Homepage</Text>
          </TouchableOpacity>
          <TouchableOpacity accessibilityRole="button" activeOpacity={0.8} style={styles.signupButton} onPress={() => router.push({ pathname: '/auth', params: { step: 'signup', neupid: notFoundNeupid } })}>
            <Text name="title3" style={styles.signupButtonText}>Create your account with this @NeupID</Text>
          </TouchableOpacity>
        </View> : <View style={styles.profile}>
          {cover ? <Image source={{ uri: cover }} style={styles.cover} resizeMode="cover" /> : null}
          {photo
            ? <Image source={{ uri: photo }} style={styles.avatar} />
            : <View style={[styles.avatar, styles.avatarFallback]}><Text name="title" style={styles.initial}>{profileName.charAt(0).toUpperCase()}</Text></View>}
          <Text name="title" style={styles.name}>{profileName}</Text>
          {neupid ? <Text name="regular" style={styles.handle}>@{neupid.replace(/^@/, '')}</Text> : null}
          {description ? <Text name="regular" style={styles.description}>{bioRuns(description, (neupid) => void openMentionedProfile(neupid))}</Text> : null}
          <View style={styles.propertySection}>
            <View style={styles.propertyHeadingRow}><Text name="title2" style={styles.propertyHeading}>Properties</Text><Text name="caption" style={styles.propertyCount}>{countLabel}</Text></View>
            {properties.length ? properties.map((property) => (
              <ProfilePropertyCard key={property.id} property={property} onPress={() => router.push(`/property/${property.id}`)} />
            )) : <Text name="regular" style={styles.propertyEmpty}>No active properties to show.</Text>}
            {hasMoreProperties ? <TouchableOpacity accessibilityRole="button" activeOpacity={0.8} style={styles.showMoreButton} onPress={() => void loadMoreProperties()}>
              <Text name="title3" style={styles.showMoreText}>{loadingMoreProperties ? 'Loading…' : 'Show more properties'}</Text>
            </TouchableOpacity> : null}
          </View>
        </View>}
      {error ? <Text name="regular" style={styles.error}>{error}</Text> : null}
      </View>
    </ScrollView>
  </View>;
}

function ProfileSkeleton() {
  return <View style={styles.profile} accessibilityLabel="Loading profile">
    <View style={[styles.cover, styles.skeletonBlock]} />
    <View style={[styles.avatar, styles.skeletonBlock]} />
    <View style={[styles.skeletonLine, styles.skeletonName]} />
    <View style={[styles.skeletonLine, styles.skeletonHandle]} />
    <View style={[styles.skeletonLine, styles.skeletonDescriptionFirst]} />
    <View style={[styles.skeletonLine, styles.skeletonDescriptionSecond]} />
    <View style={[styles.skeletonLine, styles.skeletonDescriptionThird]} />
    <View style={[styles.skeletonLine, styles.skeletonPropertiesHeading]} />
    <View style={[styles.skeletonLine, styles.skeletonPropertyCard]} />
    <View style={[styles.skeletonLine, styles.skeletonPropertyCard]} />
  </View>;
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: '#fff' },
  content: { paddingTop: theme.spacing.space16, paddingBottom: theme.spacing.space40 },
  body: { paddingHorizontal: theme.spacing.space24 },
  profile: { alignItems: 'flex-start' },
  cover: { alignSelf: 'stretch', height: 150, borderRadius: 16, backgroundColor: '#e7e7e7' },
  notFound: { alignItems: 'flex-start', paddingTop: theme.spacing.space40 },
  notFoundHandle: { color: '#101010' },
  notFoundMessage: { color: '#6d6d6d', marginTop: theme.spacing.space10 },
  actionButton: { alignSelf: 'stretch', alignItems: 'center', backgroundColor: '#173d35', borderRadius: 12, paddingVertical: theme.spacing.space15, paddingHorizontal: theme.spacing.space16, marginTop: theme.spacing.space28 },
  actionButtonText: { color: '#fff', textAlign: 'center' },
  signupButton: { alignSelf: 'stretch', alignItems: 'center', borderWidth: 1, borderColor: '#173d35', borderRadius: 12, paddingVertical: theme.spacing.space15, paddingHorizontal: theme.spacing.space16, marginTop: theme.spacing.space12 },
  signupButtonText: { color: '#173d35', textAlign: 'center' },
  avatar: { width: 88, height: 88, borderRadius: 44, backgroundColor: '#e7e7e7', borderWidth: 1, borderColor: '#e4e9e6' },
  avatarFallback: { alignItems: 'center', justifyContent: 'center' },
  initial: { color: '#173d35' },
  name: { color: '#101010', fontSize: 21, lineHeight: 26, marginTop: theme.spacing.space12 },
  description: { color: '#6d6d6d', fontSize: 16, lineHeight: 22, letterSpacing: -0.2, marginTop: theme.spacing.space10 },
  mention: { color: '#173d35', fontSize: 16, lineHeight: 22, letterSpacing: -0.2 },
  handle: { color: '#71817b', marginTop: 0 },
  propertySection: { alignSelf: 'stretch', marginTop: theme.spacing.space32 },
  propertyHeadingRow: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.space8, marginBottom: theme.spacing.space14 },
  propertyHeading: { color: '#101010' },
  propertyCount: { color: '#71817b' },
  propertyEmpty: { color: '#87958f' },
  showMoreButton: { alignItems: 'center', borderWidth: 1, borderColor: '#173d35', borderRadius: 12, paddingVertical: theme.spacing.space14, paddingHorizontal: theme.spacing.space16, marginTop: theme.spacing.space4 },
  showMoreText: { color: '#173d35' },
  skeletonBlock: { backgroundColor: '#e8edeb' },
  skeletonLine: { height: 14, borderRadius: 7, backgroundColor: '#e8edeb' },
  skeletonName: { width: 190, height: 26, marginTop: theme.spacing.space20 },
  skeletonHandle: { width: 110, marginTop: theme.spacing.space8 },
  skeletonDescriptionFirst: { width: '92%', marginTop: theme.spacing.space15 },
  skeletonDescriptionSecond: { width: '82%', marginTop: theme.spacing.space8 },
  skeletonDescriptionThird: { width: '64%', marginTop: theme.spacing.space8 },
  skeletonPropertiesHeading: { width: 120, height: 22, marginTop: theme.spacing.space24 },
  skeletonPropertyCard: { alignSelf: 'stretch', height: 108, marginTop: theme.spacing.space12, borderRadius: 14 },
  error: { color: '#a3332a', marginTop: theme.spacing.space20 },
});
