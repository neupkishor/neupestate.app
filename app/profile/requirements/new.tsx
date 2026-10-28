import { useState } from 'react';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { PageHeader } from '@/components/element/page-header';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { Input } from '@neup/components/ui/input';
import { Text } from '@neup/components/ui/text';
import { AppButton as Button } from '@/components/element/app-button';
import outfitFonts from '@base/fonts/outfitfonts';
import theme from '@base/theme.json';
import logica from '@neup/logica';
import { logRequirementApiFailure } from '@/components/element/log-requirement-api-failure';

const headingDescriptionGap = theme.spacing.headingDescriptionGap;
const purposes = ['Sale', 'Rent', 'Lease', 'Exchange'];
const propertyTypes = ['House', 'Bungalow', 'Villa', 'Multiplex', 'Land', 'Apartment', 'Penthouse', 'Commercial Space', 'Shop Space', 'Flat'];
const paymentMethods = ['Full Cash', 'Mortgage Support', 'Exchange'];
const timeframes = ['within a month', 'within 3 months', 'within 6 months', 'within a year', 'after a year'];

function OptionToken({ value, selected, onPress }: { value: string; selected: boolean; onPress: () => void }) {
  return <Button variant={selected ? 'tinted' : 'outlined'} accessibilityState={{ selected }} style={selected ? [s.token, s.tokenActive] : s.token} onPress={onPress}><Text name="caption" style={selected ? s.tokenActiveText : s.tokenText}>{value}</Text></Button>;
}

export default function NewRequirement() {
  const router = useRouter();
  const [purpose, setPurpose] = useState('Rent');
  const [location, setLocation] = useState('');
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [selectedPayments, setSelectedPayments] = useState<string[]>([]);
  const [requiredTime, setRequiredTime] = useState<string>();
  const [urgency, setUrgency] = useState<string>();
  const [loan, setLoan] = useState<boolean>();
  const [minBudget, setMinBudget] = useState('');
  const [maxBudget, setMaxBudget] = useState('');
  const [saving, setSaving] = useState(false);

  function toggleValue(value: string, selected: string[], setSelected: (values: string[]) => void) {
    setSelected(selected.includes(value) ? selected.filter((item) => item !== value) : [...selected, value]);
  }

  async function saveRequirement() {
    setSaving(true);
    let receivedResponse = false;
    let request: Record<string, unknown> | undefined;
    try {
      const payload = {
        purpose,
        ...(selectedTypes.length ? { propertyType: selectedTypes } : {}),
        ...(location.trim() ? { location: location.trim() } : {}),
        ...(minBudget.trim() ? { minBudget: Number(minBudget) } : {}),
        ...(maxBudget.trim() ? { maxBudget: Number(maxBudget) } : {}),
        ...(selectedPayments.length ? { paymentMethod: selectedPayments } : {}),
        ...(requiredTime ? { requiredTime } : {}),
        ...(urgency ? { urgency } : {}),
        ...(loan !== undefined ? { loan } : {}),
      };
      request = payload;
      console.log('[requirements] requesting create', request);
      const response = await logica.estate.requirement.create(payload);
      receivedResponse = true;
      console.log('[requirements] create response', { status: response.status, ok: response.ok, body: response.body });
      const body = response.body as any;
      if (!response.ok || body?.success === false) {
        void logRequirementApiFailure('create', request, { response });
        throw new Error('The requirement could not be saved. Please try again.');
      }
      router.replace({ pathname: '/profile/requirements', params: { refresh: String(Date.now()) } });
    } catch (error) {
      console.error('[requirements] create request failed', error);
      if (!receivedResponse) void logRequirementApiFailure('create', request, { error });
      Alert.alert('Could not save requirement', error instanceof Error ? error.message : 'Please try again.');
    } finally {
      setSaving(false);
    }
  }

  return <SafeAreaView style={s.page} edges={['top']}>
    <StatusBar style="dark" />
    <KeyboardAvoidingView style={s.keyboard} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">
        <PageHeader onBack={() => router.back()} backLabel="Back" />
        <View style={s.formContent}>
        <Text name="title" style={s.title}>Tell us what you need.</Text>
        <Text name="regular" style={s.intro}>The more we know, the better we can match you with the right properties.</Text>
        <View style={s.card}>
          <Text name="title3" style={s.label}>Purpose</Text>
          <View style={s.tokens}>{purposes.map((value) => <OptionToken key={value} value={value} selected={purpose === value} onPress={() => setPurpose(value)} />)}</View>
          <Text name="title3" style={s.label}>Preferred location</Text>
          <Input value={location} onChangeText={setLocation} style={s.input} placeholder="City or neighborhood" placeholderTextColor="#9aa6a2" />
          <Text name="title3" style={s.label}>Property type</Text>
          <View style={s.tokens}>{propertyTypes.map((value) => <OptionToken key={value} value={value} selected={selectedTypes.includes(value)} onPress={() => toggleValue(value, selectedTypes, setSelectedTypes)} />)}</View>
          <Text name="title3" style={s.label}>Minimum budget</Text>
          <Input value={minBudget} onChangeText={setMinBudget} style={s.input} placeholder="Enter amount" placeholderTextColor="#9aa6a2" keyboardType="numeric" />
          <Text name="title3" style={s.label}>Maximum budget</Text>
          <Input value={maxBudget} onChangeText={setMaxBudget} style={s.input} placeholder="Enter amount" placeholderTextColor="#9aa6a2" keyboardType="numeric" />
          <Text name="title3" style={s.label}>Payment method</Text>
          <View style={s.tokens}>{paymentMethods.map((value) => <OptionToken key={value} value={value} selected={selectedPayments.includes(value)} onPress={() => toggleValue(value, selectedPayments, setSelectedPayments)} />)}</View>
          <Text name="title3" style={s.label}>When do you need it?</Text>
          <View style={s.tokens}>{timeframes.map((value) => <OptionToken key={value} value={value} selected={requiredTime === value} onPress={() => setRequiredTime(requiredTime === value ? undefined : value)} />)}</View>
          <Text name="title3" style={s.label}>Urgency</Text>
          <View style={s.tokens}>{timeframes.map((value) => <OptionToken key={value} value={value} selected={urgency === value} onPress={() => setUrgency(urgency === value ? undefined : value)} />)}</View>
          <Text name="title3" style={s.label}>Mortgage support needed?</Text>
          <View style={s.tokens}>{(['Yes', 'No'] as const).map((value) => <OptionToken key={value} value={value} selected={loan === (value === 'Yes')} onPress={() => setLoan(loan === (value === 'Yes') ? undefined : value === 'Yes')} />)}</View>
          <Button variant="solid" style={s.button} disabled={saving} onPress={() => void saveRequirement()}>{saving ? <ActivityIndicator color="#d8f36a" /> : <Text name="title3" style={s.buttonText}>Save requirement</Text>}</Button>
        </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  </SafeAreaView>;
}

const s = StyleSheet.create({
  page: { flex: 1, backgroundColor: '#ffffff' },
  keyboard: { flex: 1 },
  content: { paddingBottom: theme.spacing.space48 },
  formContent: { paddingHorizontal: theme.spacing.space20, paddingTop: theme.spacing.space20 },
  title: { marginTop: theme.spacing.space8 },
  intro: { marginTop: headingDescriptionGap },
  card: { backgroundColor: '#fff', borderRadius: 14, padding: theme.spacing.space16, marginTop: theme.spacing.space24 },
  label: { color: '#173d35', marginBottom: theme.spacing.space9, marginTop: theme.spacing.space4 },
  tokens: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.space8, marginBottom: theme.spacing.space20 },
  token: { borderWidth: 1, borderColor: '#d7e1dc', borderRadius: 999, paddingHorizontal: theme.spacing.space13, paddingVertical: theme.spacing.space10 },
  tokenActive: { backgroundColor: '#eaf2e3', borderColor: '#a9c59d' },
  tokenText: { color: '#71817b' },
  tokenActiveText: { color: '#42604b' },
  input: { height: 48, borderWidth: 1, borderColor: '#d7e1dc', borderRadius: 10, paddingHorizontal: theme.spacing.space13, color: '#173d35', fontFamily: outfitFonts.regular, fontSize: 15, lineHeight: 21, marginBottom: theme.spacing.space20 },
  button: { backgroundColor: '#173d35', borderRadius: 12, paddingVertical: theme.spacing.space15, alignItems: 'center' },
  buttonText: { color: '#d8f36a' },
});
