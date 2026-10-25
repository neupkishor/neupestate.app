import { AppPressable as TouchableOpacity } from '@/components/element/touch-feedback';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { PageHeader } from '@/components/element/page-header';
import { SafeAreaView } from 'react-native-safe-area-context';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { Text } from '@neup/components/ui/text';
import { Button } from '@neup/components/ui/button';
import theme from '@base/theme.json';
const headingDescriptionGap = theme.spacing.headingDescriptionGap;

const propertyTypes = ['House', 'Apartment', 'Land', 'Shop space'];

function Choice({ value, selected, onPress }: { value: string; selected: boolean; onPress: () => void }) {
  return <Button variant={selected ? 'tinted' : 'outlined'} accessibilityState={{ selected }} style={[styles.choice, selected && styles.choiceActive]} onPress={onPress}><Text style={selected ? styles.choiceActiveText : styles.choiceText}>{value}</Text></Button>;
}

export default function NewProperty() {
  const router = useRouter();
  const [purpose, setPurpose] = useState('Sell');
  const [types, setTypes] = useState(['House']);

  const toggleType = (value: string) => setTypes((current) => current.includes(value) ? current.filter((item) => item !== value) : [...current, value]);

  return <SafeAreaView style={styles.page} edges={['top']}><StatusBar style="dark" /><PageHeader onBack={() => router.back()} backLabel="Back" /><KeyboardAvoidingView style={styles.keyboard} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}><ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}><View style={styles.stepRow}><Text style={styles.stepText}>STEP 1 OF 5</Text><Text style={styles.stepHint}>Property basics</Text></View><View style={styles.progressTrack}><View style={styles.progressFill} /></View><Text name="pageTitle" style={styles.title}>What are you posting?</Text><Text name="requirementsCardSubtitle" style={styles.intro}>Start with the basics so we can build the right listing for you.</Text><View style={styles.card}><Text style={styles.label}>I want to</Text><View style={styles.row}>{['Sell', 'Rent'].map((value) => <Choice key={value} value={value} selected={purpose === value} onPress={() => setPurpose(value)} />)}</View><View style={styles.typeLabelRow}><Text style={styles.label}>Property type</Text><Text style={styles.multiHint}>Select all that apply</Text></View><View style={styles.choices}>{propertyTypes.map((value) => <Choice key={value} value={value} selected={types.includes(value)} onPress={() => toggleType(value)} />)}</View><Button variant="solid" style={styles.button} onPress={() => {}}><Text style={styles.buttonText}>Continue</Text><Text style={styles.buttonArrow}>→</Text></Button></View></ScrollView></KeyboardAvoidingView></SafeAreaView>;
}

const styles = StyleSheet.create({ page: { flex: 1, backgroundColor: '#ffffff' }, keyboard: { flex: 1 }, header: { paddingHorizontal: theme.spacing.space20, paddingTop: theme.spacing.space20, paddingBottom: theme.spacing.space16, flexDirection: 'row', alignItems: 'center', gap: theme.spacing.space14 }, headerBack: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.space8 }, back: { color: '#173d35', fontSize: 35, lineHeight: 35, marginTop: theme.spacing.spaceNeg3 }, spacer: { width: 24 }, content: { padding: theme.spacing.space20, paddingTop: theme.spacing.space72, paddingBottom: theme.spacing.space50 }, stepRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: theme.spacing.space7 }, stepText: { color: '#658b4f', fontSize: 11, letterSpacing: 1.5, fontWeight: '800' }, stepHint: { color: '#9aa6a2', fontSize: 11 }, progressTrack: { height: 5, backgroundColor: '#e1e9e4', borderRadius: 3, marginTop: theme.spacing.space10, marginBottom: theme.spacing.space28 }, progressFill: { width: '20%', height: 5, backgroundColor: '#87a873', borderRadius: 3 }, title: { marginTop: theme.spacing.space8 }, intro: { marginTop: headingDescriptionGap }, card: { backgroundColor: '#fff', borderRadius: 16, padding: theme.spacing.space16, marginTop: theme.spacing.space24 }, label: { color: '#173d35', fontSize: 13, fontWeight: '800', marginBottom: theme.spacing.space9 }, typeLabelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }, multiHint: { color: '#9aa6a2', fontSize: 11, marginBottom: theme.spacing.space9 }, row: { flexDirection: 'row', gap: theme.spacing.space10, marginBottom: theme.spacing.space20 }, choices: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.space8, marginBottom: theme.spacing.space20 }, choice: { borderWidth: 1, borderColor: '#d7e1dc', borderRadius: 999, paddingHorizontal: theme.spacing.space13, paddingVertical: theme.spacing.space10 }, choiceActive: { backgroundColor: '#eaf2e3', borderColor: '#a9c59d' }, choiceText: { color: '#71817b', fontSize: 12, fontWeight: '700' }, choiceActiveText: { color: '#42604b', fontSize: 12, fontWeight: '800' }, button: { backgroundColor: '#173d35', borderRadius: 12, paddingVertical: theme.spacing.space15, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: theme.spacing.space8 }, buttonText: { color: '#d8f36a', fontSize: 14, fontWeight: '800' }, buttonArrow: { color: '#d8f36a', fontSize: 18, marginTop: theme.spacing.spaceNeg2 } });
