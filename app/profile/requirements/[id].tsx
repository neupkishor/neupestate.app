import { AppPressable as TouchableOpacity } from '@/components/element/touch-feedback';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { PageHeader } from '@/components/element/page-header';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StyleSheet, View } from 'react-native';
import { Text } from '@neup/components/ui/text';
import { Button } from '@neup/components/ui/button';
import theme from '@base/theme.json';
const headingDescriptionGap = theme.spacing.headingDescriptionGap;

export default function RequirementDetail() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const isRent = id === '2';
  return <SafeAreaView style={s.page} edges={['top']}><StatusBar style="dark" /><PageHeader onBack={() => router.back()} backLabel="Back" /><View style={s.content}><View style={s.hero}><Text name="caption" style={s.eyebrow}>{isRent ? 'TO RENT' : 'TO BUY'}</Text><Text name="title" style={s.title}>{isRent ? 'An apartment in Lalitpur' : 'A home in Kathmandu'}</Text><Text name="regular" style={s.subtitle}>We’ll use these preferences to find the best matches for you.</Text></View><View style={s.card}><Detail label="Location" value={isRent ? 'Lalitpur' : 'Kathmandu'} /><Detail label="Property type" value={isRent ? 'Apartment' : 'House'} /><Detail label="Budget" value={isRent ? 'NPR 35K–55K / month' : 'NPR 15M–25M'} /><Detail label="Bedrooms" value={isRent ? '1–2 bedrooms' : '2–3 bedrooms'} /></View><Button variant="solid" style={s.button} onPress={() => router.push('/profile/requirements/new')}><Text name="title3" style={s.buttonText}>Edit requirement</Text></Button></View></SafeAreaView>;
}

function Detail({ label, value }: { label: string; value: string }) { return <View style={s.detail}><Text name="caption" style={s.label}>{label}</Text><Text name="title3" style={s.value}>{value}</Text></View>; }

const s = StyleSheet.create({page:{flex:1,backgroundColor:'#ffffff'},header:{ paddingHorizontal: theme.spacing.space20, paddingTop: theme.spacing.space20, paddingBottom: theme.spacing.space16, flexDirection: 'row', alignItems: 'center', gap: theme.spacing.space14 },back:{color:'#173d35',fontSize:35,lineHeight:35},spacer:{width:24},content:{padding: theme.spacing.space20,paddingTop: theme.spacing.space28},hero:{paddingTop: theme.spacing.space12},eyebrow:{color:'#658b4f'},title:{marginTop: theme.spacing.space8},subtitle:{color:'#71817b',marginTop: headingDescriptionGap},card:{backgroundColor:'#fff',borderRadius:14,padding: theme.spacing.space16,marginTop: theme.spacing.space24},detail:{paddingVertical: theme.spacing.space13,borderBottomWidth:1,borderBottomColor:'#edf1ee'},label:{color:'#8b9994'},value:{color:'#173d35',marginTop: theme.spacing.space4},button:{backgroundColor:'#173d35',borderRadius:12,paddingVertical: theme.spacing.space15,alignItems:'center',marginTop: theme.spacing.space24},buttonText:{color:'#d8f36a'}});
