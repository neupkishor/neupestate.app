import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Text } from '#/components/ui/text';
import { useAuthSession } from '#/core/auth-session';

export default function SignOut() {
  const router = useRouter();
  const { setToken } = useAuthSession();
  const signOut = async () => { await setToken(null); router.replace('/auth'); };
  return <SafeAreaView style={s.page}><StatusBar style="dark" /><View style={s.content}><TouchableOpacity onPress={() => router.back()}><Text style={s.back}>‹</Text></TouchableOpacity><Text style={s.title}>Sign Out of your NeupID</Text><Text style={s.description}>Signing out of the account from this app will signout from all apps in this device.</Text><TouchableOpacity style={s.outlineButton} onPress={() => void signOut()}><Text style={s.outlineText}>Sign Out</Text></TouchableOpacity><TouchableOpacity style={s.continueButton} onPress={() => router.back()}><Text style={s.continueText}>Continue using this App</Text></TouchableOpacity></View></SafeAreaView>;
}

const s = StyleSheet.create({ page: { flex: 1, backgroundColor: '#fff' }, content: { padding: 20 }, back: { color: '#173d35', fontSize: 35, lineHeight: 34, marginBottom: 38 }, title: { color: '#173d35', fontSize: 28, fontWeight: '900', lineHeight: 35 }, description: { color: '#71817b', fontSize: 15, lineHeight: 23, marginTop: 14 }, outlineButton: { height: 50, borderWidth: 1.5, borderColor: '#cbd6d1', borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginTop: 38 }, outlineText: { color: '#173d35', fontSize: 15, fontWeight: '800' }, continueButton: { alignItems: 'center', paddingVertical: 18 }, continueText: { color: '#4c9b75', fontSize: 15, fontWeight: '800' } });
