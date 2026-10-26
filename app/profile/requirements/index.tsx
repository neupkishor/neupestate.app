import { AppPressable as TouchableOpacity } from '@/components/element/touch-feedback';
import { StatusBar } from 'expo-status-bar';
import { useFocusEffect, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScrollView, StyleSheet, View } from 'react-native';
import { ActivityIndicator } from 'react-native';
import { useCallback, useState } from 'react';
import logica from '@neup/logica';
import { logRequirementApiFailure } from './log-api-failure';

import { Text } from '@neup/components/ui/text';
import { PageHeader } from '@/components/element/page-header';
import theme from '@base/theme.json';
const headingDescriptionGap = theme.spacing.headingDescriptionGap;

export default function Requirements() {
  const router = useRouter();
  const [requirements, setRequirements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useFocusEffect(useCallback(() => {
    let active = true;
    setLoading(true);
    setError('');
    console.log('[requirements] requesting', { endpoint: 'estate.requirement.my.list', limit: 50, offset: 0 });
    void logica.estate.requirement.my.list({ limit: 50, offset: 0 })
      .then((response) => {
        console.log('[requirements] response', { status: response.status, ok: response.ok, body: response.body });
        if (!active) return;
        const body = response.body as any;
        const items = Array.isArray(body) ? body : body?.requirements ?? body?.data?.requirements ?? body?.data;
        const failed = !response.ok || body?.success === false;
        setRequirements(!failed && Array.isArray(items) ? items : []);
        if (failed) {
          void logRequirementApiFailure('list', { limit: 50, offset: 0 }, { response });
          setError('We couldn’t load your requirements. Please try again.');
        }
      })
      .catch((requestError) => {
        console.error('[requirements] request failed', requestError);
        void logRequirementApiFailure('list', { limit: 50, offset: 0 }, { error: requestError });
        if (active) setError('We couldn’t load your requirements. Please try again.');
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []));

  return (
    <SafeAreaView style={styles.page} edges={['top']}>
      <StatusBar style="dark" />
      <PageHeader onBack={() => router.back()} backLabel="Back" />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text name="title2">Your Requirements</Text>
        <Text name="regular" style={styles.intro}>
          Tell us what you need and we’ll find the best deals for you.
        </Text>

        <TouchableOpacity style={styles.addCard} onPress={() => router.push('/profile/requirements/new')}>
          <View style={styles.addIcon}><Text style={styles.addIconText}>+</Text></View>
          <View style={styles.cardCopy}>
            <Text name="title3" style={styles.cardTitle}>Add a requirement</Text>
            <Text name="regular" style={styles.cardSubtitle}>Tell us what kind of property you need.</Text>
          </View>
        </TouchableOpacity>

        {loading && <ActivityIndicator color="#557d54" style={styles.status} />}
        {!!error && <Text name="regular" style={styles.message}>{error}</Text>}
        {!loading && !error && requirements.length === 0 && <Text name="regular" style={styles.message}>You haven’t added any requirements yet.</Text>}
        {requirements.map((item) => {
          const id = item.id ?? item.requirementId ?? item._id;
          const purpose = String(item.purpose ?? 'Requirement');
          const location = typeof item.location === 'string' ? item.location : item.location?.name;
          const propertyTypes = Array.isArray(item.propertyType) ? item.propertyType.join(', ') : item.propertyType;
          const budget = [item.minBudget, item.maxBudget].filter((value) => value != null).map((value) => `NPR ${Number(value).toLocaleString()}`).join('–');
          const details = [propertyTypes, budget].filter(Boolean).join(' · ');
          return <TouchableOpacity key={String(id)} style={styles.requirementCard} onPress={() => router.push(`/profile/requirements/${id}`)}>
            <Text name="caption" style={styles.cardEyebrow}>{purpose.toUpperCase()}</Text>
            <Text name="title3" style={styles.cardTitle}>{location ? `Property in ${location}` : 'Property requirement'}</Text>
            {!!details && <Text name="regular" style={styles.cardSubtitle}>{details}</Text>}
          </TouchableOpacity>;
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: '#ffffff' },
  header: { paddingHorizontal: theme.spacing.space20, paddingTop: theme.spacing.space20, paddingBottom: theme.spacing.space16, flexDirection: 'row', alignItems: 'center', gap: theme.spacing.space14 },
  backButton: { width: 36, height: 36, justifyContent: 'center' },
  back: { color: '#173d35', fontSize: 35, lineHeight: 35 },
  brand: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.space9 },
  logo: { width: 36, height: 36, borderRadius: 9 },
  headerSpace: { width: 36 },
  content: { padding: theme.spacing.space20, paddingTop: theme.spacing.space76, paddingBottom: theme.spacing.space40 },
  intro: { marginTop: headingDescriptionGap },
  addCard: { backgroundColor: '#eaf2e3', borderWidth: 1, borderColor: '#cbdcc5', borderRadius: 14, padding: theme.spacing.space12, marginTop: theme.spacing.space24, flexDirection: 'row', alignItems: 'center' },
  addIcon: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#173d35', alignItems: 'center', justifyContent: 'center' },
  addIconText: { color: '#d8f36a', fontSize: 28, lineHeight: 30 },
  cardCopy: { marginLeft: theme.spacing.space12 },
  requirementCard: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#e0e8e3', borderRadius: 14, padding: theme.spacing.space16, marginTop: theme.spacing.space12 },
  cardEyebrow: { color: '#658b4f' },
  cardTitle: { color: '#173d35', marginTop: theme.spacing.space5 },
  cardSubtitle: { color: '#71817b', marginTop: theme.spacing.space5 },
  status: { marginTop: theme.spacing.space24 },
  message: { color: '#71817b', marginTop: theme.spacing.space20 },
});
