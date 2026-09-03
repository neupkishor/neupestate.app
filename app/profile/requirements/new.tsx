import { useState } from 'react';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import { Text } from '#/components/ui/text';

const types = ['House', 'Land', 'Apartment', 'Shop space'];
const units = ['Flat price', 'Per aana', 'Per ropani'];

function OptionToken({ value, selected, onPress }: { value: string; selected: boolean; onPress: () => void }) {
  return <TouchableOpacity style={selected ? [s.token, s.tokenActive] : s.token} onPress={onPress}><Text style={selected ? s.tokenActiveText : s.tokenText}>{value}</Text></TouchableOpacity>;
}

export default function NewRequirement() {
  const router = useRouter();
  const [intent, setIntent] = useState('Buy');
  const [location, setLocation] = useState('');
  const [type, setType] = useState('House');
  const [unit, setUnit] = useState('Flat price');
  const rental = type === 'Apartment';
  return <SafeAreaView style={s.page} edges={['top']}><StatusBar style="dark" /><View style={s.header}><TouchableOpacity onPress={() => router.back()}><Text style={s.back}>‹</Text></TouchableOpacity><Text name="sectionTitle">New requirement</Text><View style={s.spacer} /></View><KeyboardAvoidingView style={s.keyboard} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}><ScrollView contentContainerStyle={s.content} keyboardShouldPersistTaps="handled"><Text name="pageTitle" style={s.title}>Tell us what you need.</Text><Text name="requirementsCardSubtitle" style={s.intro}>The more we know, the better we can match you with the right properties.</Text><View style={s.card}><Text style={s.label}>I want to</Text><View style={s.row}>{['Buy', 'Sell'].map((value) => <OptionToken key={value} value={value} selected={intent === value} onPress={() => setIntent(value)} />)}</View><Text style={s.label}>Preferred location</Text><TextInput value={location} onChangeText={setLocation} style={s.input} placeholder="City or neighborhood" placeholderTextColor="#9aa6a2" />{location.trim() !== '' && <><Text style={s.label}>How much radius?</Text><TextInput style={s.input} placeholder="Radius in km" placeholderTextColor="#9aa6a2" keyboardType="numeric" /></>}<Text style={s.label}>Property type</Text><View style={s.tokens}>{types.map((value) => <OptionToken key={value} value={value} selected={type === value} onPress={() => setType(value)} />)}</View><Text style={s.label}>What is your starting budget?</Text><TextInput style={s.input} placeholder="Enter amount" placeholderTextColor="#9aa6a2" keyboardType="numeric" /><Text style={s.label}>What is your maximum budget?</Text><TextInput style={s.input} placeholder="Enter amount" placeholderTextColor="#9aa6a2" keyboardType="numeric" /><Text style={s.label}>Budget unit</Text><View style={s.tokens}>{units.map((value) => <OptionToken key={value} value={value} selected={unit === value} onPress={() => setUnit(value)} />)}{rental && <OptionToken value="Per month" selected={unit === 'Per month'} onPress={() => setUnit('Per month')} />}{rental && <OptionToken value="Per m²/month" selected={unit === 'Per m²/month'} onPress={() => setUnit('Per m²/month')} />}</View><TouchableOpacity style={s.button} onPress={() => router.back()}><Text style={s.buttonText}>Save requirement</Text></TouchableOpacity></View></ScrollView></KeyboardAvoidingView></SafeAreaView>;
}

const s = StyleSheet.create({page:{flex:1,backgroundColor:'#f6f7f9'},keyboard:{flex:1},header:{height:70,paddingHorizontal:20,backgroundColor:'#fff',flexDirection:'row',alignItems:'center',justifyContent:'space-between'},back:{color:'#173d35',fontSize:35,lineHeight:35},spacer:{width:24},content:{padding:20,paddingBottom:48},title:{marginTop:8},intro:{marginTop:6},card:{backgroundColor:'#fff',borderRadius:14,padding:16,marginTop:24},label:{color:'#173d35',fontSize:13,fontWeight:'800',marginBottom:9,marginTop:4},row:{flexDirection:'row',gap:10,marginBottom:20},token:{borderWidth:1,borderColor:'#d7e1dc',borderRadius:999,paddingHorizontal:13,paddingVertical:10},tokenActive:{backgroundColor:'#eaf2e3',borderColor:'#a9c59d'},tokenText:{color:'#71817b',fontSize:12,fontWeight:'700'},tokenActiveText:{color:'#42604b',fontSize:12,fontWeight:'800'},tokens:{flexDirection:'row',flexWrap:'wrap',gap:8,marginBottom:20},input:{height:48,borderWidth:1,borderColor:'#d7e1dc',borderRadius:10,paddingHorizontal:13,color:'#173d35',fontSize:13,marginBottom:20},button:{backgroundColor:'#173d35',borderRadius:12,paddingVertical:15,alignItems:'center'},buttonText:{color:'#d8f36a',fontSize:14,fontWeight:'800'}});
