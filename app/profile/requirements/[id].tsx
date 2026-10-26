import { AppPressable as TouchableOpacity } from '@/components/element/touch-feedback';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { PageHeader } from '@/components/element/page-header';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StyleSheet, View } from 'react-native';
import { ActivityIndicator } from 'react-native';
import { useEffect, useState } from 'react';
import { Text } from '@neup/components/ui/text';
import { Button } from '@neup/components/ui/button';
import theme from '@base/theme.json';
import logica from '@neup/logica';
import { logRequirementApiFailure } from './log-api-failure';
const headingDescriptionGap = theme.spacing.headingDescriptionGap;

export default function RequirementDetail() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [requirement, setRequirement] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let active = true;
    if (!id) return;
    console.log('[requirements] requesting detail', { endpoint: 'estate.requirement.get', requirementId: String(id) });
    void logica.estate.requirement(String(id)).get()
      .then((response) => {
        console.log('[requirements] detail response', { status: response.status, ok: response.ok, body: response.body });
        const body = response.body as any;
        const item = body?.requirement ?? body?.data?.requirement ?? body?.data ?? body;
        if (!response.ok || body?.success === false || !item || typeof item !== 'object') {
          void logRequirementApiFailure('get', { requirementId: String(id) }, { response });
          if (active) setError(true);
        } else if (active) setRequirement(item);
      })
      .catch((requestError) => {
        console.error('[requirements] detail request failed', requestError);
        void logRequirementApiFailure('get', { requirementId: String(id) }, { error: requestError });
        if (active) setError(true);
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [id]);

  const purpose = String(requirement?.purpose ?? 'Requirement');
  const location = typeof requirement?.location === 'string' ? requirement.location : requirement?.location?.name ?? 'Not specified';
  const propertyTypes = Array.isArray(requirement?.propertyType) ? requirement.propertyType.join(', ') : requirement?.propertyType ?? 'Not specified';
  const budget = [requirement?.minBudget, requirement?.maxBudget].filter((value) => value != null).map((value) => `NPR ${Number(value).toLocaleString()}`).join('–') || 'Not specified';

  return <SafeAreaView style={s.page} edges={['top']}><StatusBar style="dark" /><PageHeader onBack={() => router.back()} backLabel="Back" /><View style={s.content}>{loading ? <ActivityIndicator color="#557d54" /> : error || !requirement ? <Text name="regular" style={s.subtitle}>We couldn’t load this requirement.</Text> : <><View style={s.hero}><Text name="caption" style={s.eyebrow}>{purpose.toUpperCase()}</Text><Text name="title" style={s.title}>{location === 'Not specified' ? 'Property requirement' : `Property in ${location}`}</Text><Text name="regular" style={s.subtitle}>We’ll use these preferences to find the best matches for you.</Text></View><View style={s.card}><Detail label="Location" value={location} /><Detail label="Property type" value={propertyTypes} /><Detail label="Budget" value={budget} /></View><Button variant="solid" style={s.button} onPress={() => router.push('/profile/requirements/new')}><Text name="title3" style={s.buttonText}>Edit requirement</Text></Button></>}</View></SafeAreaView>;
}

function Detail({ label, value }: { label: string; value: string }) { return <View style={s.detail}><Text name="caption" style={s.label}>{label}</Text><Text name="title3" style={s.value}>{value}</Text></View>; }

const s = StyleSheet.create({page:{flex:1,backgroundColor:'#ffffff'},header:{ paddingHorizontal: theme.spacing.space20, paddingTop: theme.spacing.space20, paddingBottom: theme.spacing.space16, flexDirection: 'row', alignItems: 'center', gap: theme.spacing.space14 },back:{color:'#173d35',fontSize:35,lineHeight:35},spacer:{width:24},content:{padding: theme.spacing.space20,paddingTop: theme.spacing.space28},hero:{paddingTop: theme.spacing.space12},eyebrow:{color:'#658b4f'},title:{marginTop: theme.spacing.space8},subtitle:{color:'#71817b',marginTop: headingDescriptionGap},card:{backgroundColor:'#fff',borderRadius:14,padding: theme.spacing.space16,marginTop: theme.spacing.space24},detail:{paddingVertical: theme.spacing.space13,borderBottomWidth:1,borderBottomColor:'#edf1ee'},label:{color:'#8b9994'},value:{color:'#173d35',marginTop: theme.spacing.space4},button:{backgroundColor:'#173d35',borderRadius:12,paddingVertical: theme.spacing.space15,alignItems:'center',marginTop: theme.spacing.space24},buttonText:{color:'#d8f36a'}});
