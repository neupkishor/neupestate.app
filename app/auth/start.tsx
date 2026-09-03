import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { Text } from '#/components/ui/text';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function AuthStart() {
  const router = useRouter();
  return <SafeAreaView style={s.page}><StatusBar style="light" /><View style={s.hero}><View style={s.circle} /><Text style={s.logo}>N</Text><Text style={s.title}>A better place{`\n`}starts here.</Text><Text style={s.subtitle}>Save homes, manage your listings, and keep every visit in one place.</Text></View><View style={s.actions}><TouchableOpacity style={s.primary} onPress={() => router.push('/auth/signup')}><Text style={s.primaryText}>Create an account</Text></TouchableOpacity><TouchableOpacity style={s.secondary} onPress={() => router.push('/auth/signin')}><Text style={s.secondaryText}>Sign in</Text></TouchableOpacity><Text style={s.foot}>By continuing, you agree to our Terms and Privacy Policy.</Text></View></SafeAreaView>;
}

const s = StyleSheet.create({ page:{flex:1,backgroundColor:'#f6f7f9'},hero:{flex:1,backgroundColor:'#173d35',padding:28,justifyContent:'center',overflow:'hidden'},circle:{position:'absolute',width:320,height:320,borderRadius:180,backgroundColor:'#4c9b75',right:-100,top:-65,opacity:.8},logo:{width:48,height:48,borderRadius:15,backgroundColor:'#d8f36a',color:'#173d35',fontSize:28,fontWeight:'900',textAlign:'center',paddingTop:5},title:{color:'#fff',fontSize:39,lineHeight:43,fontWeight:'900',marginTop:42,letterSpacing:-1},subtitle:{color:'#c7d9d0',fontSize:16,lineHeight:24,marginTop:18,maxWidth:330},actions:{padding:24,paddingTop:26},primary:{backgroundColor:'#173d35',borderRadius:15,paddingVertical:16,alignItems:'center'},primaryText:{color:'#d8f36a',fontSize:15,fontWeight:'800'},secondary:{borderWidth:1.5,borderColor:'#cbd8d2',borderRadius:15,paddingVertical:15,alignItems:'center',marginTop:11},secondaryText:{color:'#173d35',fontSize:15,fontWeight:'800'},foot:{color:'#8b9994',fontSize:11,lineHeight:16,textAlign:'center',marginTop:19}
});
