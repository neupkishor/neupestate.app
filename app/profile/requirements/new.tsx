import { AppPressable as TouchableOpacity } from '@/components/element/touch-feedback';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { PageHeader } from '@/components/element/page-header';
import { SafeAreaView } from 'react-native-safe-area-context';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { Input } from '@neup/components/ui/input';
import { Text } from '@neup/components/ui/text';
import { Button } from '@neup/components/ui/button';
import outfitFonts from '@base/fonts/outfitfonts';
import theme from '@base/theme.json';
const headingDescriptionGap = theme.spacing.headingDescriptionGap;

const types = ['House', 'Land', 'Apartment', 'Shop space'];
const units = ['Flat price', 'Per aana', 'Per ropani'];

function OptionToken({ value, selected, onPress }: { value: string; selected: boolean; onPress: () => void }) {
  return <Button variant={selected ? 'tinted' : 'outlined'} accessibilityState={{ selected }} style={selected ? [s.token, s.tokenActive] : s.token} onPress={onPress}><Text name="caption" style={selected ? s.tokenActiveText : s.tokenText}>{value}</Text></Button>;
}

export default function NewRequirement() {
  const router = useRouter();
  const [intent, setIntent] = useState('Buy');
  const [location, setLocation] = useState('');
  const [type, setType] = useState('House');
  const [unit, setUnit] = useState('Flat price');
  const rental = type === 'Apartment';
  return <SafeAreaView style={s.page} edges={['top']}><StatusBar style="dark" /><PageHeader onBack={() => router.back()} backLabel="Back" /><KeyboardAvoidingView style={s.keyboard} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}><ScrollView contentContainerStyle={s.content} keyboardShouldPersistTaps="handled"><Text name="title" style={s.title}>Tell us what you need.</Text><Text name="regular" style={s.intro}>The more we know, the better we can match you with the right properties.</Text><View style={s.card}><Text name="title3" style={s.label}>I want to</Text><View style={s.row}>{['Buy', 'Sell'].map((value) => <OptionToken key={value} value={value} selected={intent === value} onPress={() => setIntent(value)} />)}</View><Text name="title3" style={s.label}>Preferred location</Text><Input value={location} onChangeText={setLocation} style={s.input} placeholder="City or neighborhood" placeholderTextColor="#9aa6a2" />{location.trim() !== '' && <><Text name="title3" style={s.label}>How much radius?</Text><Input style={s.input} placeholder="Radius in km" placeholderTextColor="#9aa6a2" keyboardType="numeric" /></>}<Text name="title3" style={s.label}>Property type</Text><View style={s.tokens}>{types.map((value) => <OptionToken key={value} value={value} selected={type === value} onPress={() => setType(value)} />)}</View><Text name="title3" style={s.label}>What is your starting budget?</Text><Input style={s.input} placeholder="Enter amount" placeholderTextColor="#9aa6a2" keyboardType="numeric" /><Text name="title3" style={s.label}>What is your maximum budget?</Text><Input style={s.input} placeholder="Enter amount" placeholderTextColor="#9aa6a2" keyboardType="numeric" /><Text name="title3" style={s.label}>Budget unit</Text><View style={s.tokens}>{units.map((value) => <OptionToken key={value} value={value} selected={unit === value} onPress={() => setUnit(value)} />)}{rental && <OptionToken value="Per month" selected={unit === 'Per month'} onPress={() => setUnit('Per month')} />}{rental && <OptionToken value="Per m²/month" selected={unit === 'Per m²/month'} onPress={() => setUnit('Per m²/month')} />}</View><Button variant="solid" style={s.button} onPress={() => router.back()}><Text name="title3" style={s.buttonText}>Save requirement</Text></Button></View></ScrollView></KeyboardAvoidingView></SafeAreaView>;
}

const s = StyleSheet.create({page:{flex:1,backgroundColor:'#ffffff'},keyboard:{flex:1},header:{ paddingHorizontal: theme.spacing.space20, paddingTop: theme.spacing.space20, paddingBottom: theme.spacing.space16, flexDirection: 'row', alignItems: 'center', gap: theme.spacing.space14 },back:{color:'#173d35',fontSize:35,lineHeight:35},spacer:{width:24},content:{padding: theme.spacing.space20,paddingTop: theme.spacing.space28,paddingBottom: theme.spacing.space48},title:{marginTop: theme.spacing.space8},intro:{marginTop: headingDescriptionGap},card:{backgroundColor:'#fff',borderRadius:14,padding: theme.spacing.space16,marginTop: theme.spacing.space24},label:{color:'#173d35',marginBottom: theme.spacing.space9,marginTop: theme.spacing.space4},row:{flexDirection:'row',gap: theme.spacing.space10,marginBottom: theme.spacing.space20},token:{borderWidth:1,borderColor:'#d7e1dc',borderRadius:999,paddingHorizontal: theme.spacing.space13,paddingVertical: theme.spacing.space10},tokenActive:{backgroundColor:'#eaf2e3',borderColor:'#a9c59d'},tokenText:{color:'#71817b'},tokenActiveText:{color:'#42604b'},tokens:{flexDirection:'row',flexWrap:'wrap',gap: theme.spacing.space8,marginBottom: theme.spacing.space20},input:{height:48,borderWidth:1,borderColor:'#d7e1dc',borderRadius:10,paddingHorizontal: theme.spacing.space13,color:'#173d35',fontFamily:outfitFonts.regular,fontSize:15,lineHeight:21,marginBottom: theme.spacing.space20},button:{backgroundColor:'#173d35',borderRadius:12,paddingVertical: theme.spacing.space15,alignItems:'center'},buttonText:{color:'#d8f36a'}});
