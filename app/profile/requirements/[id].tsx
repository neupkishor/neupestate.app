import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { Text } from '#/components/ui/text';

export default function RequirementDetail() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const isRent = id === '2';
  return <SafeAreaView style={s.page} edges={['top']}><StatusBar style="dark" /><View style={s.header}><TouchableOpacity onPress={() => router.back()}><Text style={s.back}>‹</Text></TouchableOpacity><Text name="sectionTitle">Requirement details</Text><View style={s.spacer} /></View><View style={s.content}><View style={s.hero}><Text style={s.eyebrow}>{isRent ? 'TO RENT' : 'TO BUY'}</Text><Text name="pageTitle" style={s.title}>{isRent ? 'An apartment in Lalitpur' : 'A home in Kathmandu'}</Text><Text style={s.subtitle}>We’ll use these preferences to find the best matches for you.</Text></View><View style={s.card}><Detail label="Location" value={isRent ? 'Lalitpur' : 'Kathmandu'} /><Detail label="Property type" value={isRent ? 'Apartment' : 'House'} /><Detail label="Budget" value={isRent ? 'NPR 35K–55K / month' : 'NPR 15M–25M'} /><Detail label="Bedrooms" value={isRent ? '1–2 bedrooms' : '2–3 bedrooms'} /></View><TouchableOpacity style={s.button} onPress={() => router.push('/profile/requirements/new')}><Text style={s.buttonText}>Edit requirement</Text></TouchableOpacity></View></SafeAreaView>;
}

function Detail({ label, value }: { label: string; value: string }) { return <View style={s.detail}><Text style={s.label}>{label}</Text><Text style={s.value}>{value}</Text></View>; }

const s = StyleSheet.create({page:{flex:1,backgroundColor:'#f6f7f9'},header:{height:70,paddingHorizontal:20,backgroundColor:'#fff',flexDirection:'row',alignItems:'center',justifyContent:'space-between'},back:{color:'#173d35',fontSize:35,lineHeight:35},spacer:{width:24},content:{padding:20},hero:{paddingTop:12},eyebrow:{color:'#658b4f',fontSize:10,fontWeight:'800',letterSpacing:1.4},title:{marginTop:8},subtitle:{color:'#71817b',fontSize:13,lineHeight:20,marginTop:8},card:{backgroundColor:'#fff',borderRadius:14,padding:16,marginTop:24},detail:{paddingVertical:13,borderBottomWidth:1,borderBottomColor:'#edf1ee'},label:{color:'#8b9994',fontSize:11},value:{color:'#173d35',fontSize:15,fontWeight:'800',marginTop:4},button:{backgroundColor:'#173d35',borderRadius:12,paddingVertical:15,alignItems:'center',marginTop:24},buttonText:{color:'#d8f36a',fontSize:14,fontWeight:'800'}});
