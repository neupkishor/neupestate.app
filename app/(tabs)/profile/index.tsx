import { AppPressable as TouchableOpacity } from '@/components/element/touch-feedback';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, Image, Linking, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthSession } from '@neup/auth/AuthSessionProvider';
import { useUserInfo } from '@neup/auth/auth';
import { getProfile, getInitials } from '@neup/auth/user-info';
import { useRef, useState } from 'react';
import { useRouter } from 'expo-router';
import { Text } from '@neup/components/ui/text';

export default function Profile() {
  const user = useUserInfo();
  const { loading, error, retry } = useAuthSession();
  const profile = getProfile(user);
  const authenticated = user.isAuthenticated;
  const [failedImage, setFailedImage] = useState<string | null>(null);
  const lastProfile = useRef(profile);
  const lastAuthenticated = useRef(authenticated);
  const router = useRouter();
  if (!loading) {
    lastProfile.current = profile;
    lastAuthenticated.current = authenticated;
  }
  const displayedProfile = loading && lastAuthenticated.current ? lastProfile.current : profile;
  const displayedAuthenticated = loading && lastAuthenticated.current ? true : authenticated;
  const initials = displayedProfile.name || displayedProfile.neupid
    ? (displayedProfile.name || displayedProfile.neupid || '?').split(/\s+/).map((part) => Array.from(part)[0]).slice(0, 2).join('').toUpperCase()
    : getInitials(user) || '?';
  const displayName = displayedProfile.name || displayedProfile.neupid || (displayedAuthenticated ? 'Your account' : error ? 'Account unavailable' : 'Guest User');
  return <SafeAreaView style={s.safe} edges={[]}><StatusBar style="dark" /><View style={s.topBar}><Text name="appTitle">Profile</Text></View><ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false} refreshControl={<RefreshControl refreshing={loading} onRefresh={() => void retry()} />}>
    <View style={s.cover}><View style={s.coverCircle} /><Text style={s.coverWord}>FIND YOUR{`\n`}NEXT PLACE</Text></View>
    <View style={s.identityRow}>
      <View style={s.avatar}>{displayedProfile.image && failedImage !== displayedProfile.image ? <Image source={{ uri: displayedProfile.image }} style={s.avatarImage} onError={() => setFailedImage(displayedProfile.image)} /> : <Text style={s.avatarText}>{initials}</Text>}</View>
    </View>
    <View style={s.details}>
      <View style={s.nameRow}><Text name="title">{displayName}</Text>{loading && <ActivityIndicator size="small" color="#658b4f" />}</View>
      {displayedProfile.neupid && <Text name="caption" style={s.handle}>@{displayedProfile.neupid.replace(/^@/, '')}</Text>}
      {error && <TouchableOpacity onPress={() => void retry()}><Text name="propertyError">{error} Tap to retry.</Text></TouchableOpacity>}
    </View>
    {!loading && !displayedAuthenticated && <TouchableOpacity style={s.authCard} activeOpacity={0.8} onPress={() => router.push('/auth')}><View style={s.authCopy}><Text name="title3" style={s.authTitle}>Sign In / Sign Up for Better Experience.</Text><Text name="regular" style={s.authSubtitle}>With Sign In, You can request visits and make inquiries.</Text></View><Text name="title3" style={s.authChevron}>›</Text></TouchableOpacity>}
    <Text name="title2" style={s.sectionHeading}>Properties</Text><View style={s.leads}>{[['Listed Properties', 'Properties listed by you.'], ['My Properties', 'Properties owned by me.'], ['Saved Properties', 'Properties you saved for later.']].map(([title, subtitle], index) => <TouchableOpacity key={title} style={[s.leadCard, s.compactLeadCard, index === 0 && s.firstLeadCard, index === 2 && s.lastLeadCard, index < 2 && s.leadSeparator]} activeOpacity={0.8} onPress={() => title === 'Listed Properties' ? router.push('/profile/properties/listed') : title === 'My Properties' ? router.push('/profile/properties/mine') : router.push('/profile/properties/saved')}><View style={s.leadIcon}><Text style={s.leadIconText}>⌂</Text></View><View style={s.leadCopy}><Text name="title3">{title}</Text><Text name="regular" style={s.leadSubtitle}>{subtitle}</Text></View><Text style={s.leadChevron}>›</Text></TouchableOpacity>)}</View>
    <Text name="title2" style={s.sectionHeading}>Referrals</Text><View style={s.leads}>{[['My Referral Profile', 'Manage your referral details and rewards.', '/referrals/profile'], ['Leads referred by Me', 'View the leads you have referred.', '/referrals'], ['Post a new referral', 'Refer someone who is ready to move.', '/referrals/create']].map(([title, subtitle, route], index) => <TouchableOpacity key={title} style={[s.leadCard, s.compactLeadCard, index === 0 && s.firstLeadCard, index === 2 && s.lastLeadCard, index < 2 && s.leadSeparator]} activeOpacity={0.8} onPress={() => router.push(route as '/referrals' | '/referrals/profile' | '/referrals/create')}><View style={s.leadIcon}><Text style={s.leadIconText}>✦</Text></View><View style={s.leadCopy}><Text name="title3">{title}</Text><Text name="regular" style={s.leadSubtitle}>{subtitle}</Text></View><Text style={s.leadChevron}>›</Text></TouchableOpacity>)}</View>
    <Text name="title2" style={s.sectionHeading}>Leads and Activities</Text><View style={s.leads}>{[['My Leads', 'See all the leads shared with you.'], ['Team Leads', 'See all the leads your team is working on.'], ['Base Leads', "See the base leads you've access to."]].map(([title, subtitle], index) => <TouchableOpacity key={title} style={[s.leadCard, s.compactLeadCard, index === 0 && s.firstLeadCard, index === 2 && s.lastLeadCard, index < 2 && s.leadSeparator]} activeOpacity={0.8}><View style={s.leadIcon}><Text style={s.leadIconText}>⌂</Text></View><View style={s.leadCopy}><Text name="title3">{title}</Text><Text name="regular" style={s.leadSubtitle}>{subtitle}</Text></View><Text style={s.leadChevron}>›</Text></TouchableOpacity>)}</View>
    {displayedAuthenticated && <>
      <Text name="title2" style={s.sectionHeading}>Account</Text><View style={s.leads}><TouchableOpacity style={[s.leadCard, s.compactLeadCard, s.firstLeadCard, s.leadSeparator]} activeOpacity={0.8} onPress={() => router.push('/profile/notofications')}><View style={s.leadIcon}><Text style={s.leadIconText}>♧</Text></View><View style={s.leadCopy}><Text name="title3">Notifications</Text><Text name="regular" style={s.leadSubtitle}>Manage your notification preferences.</Text></View><Text style={s.leadChevron}>›</Text></TouchableOpacity><TouchableOpacity style={[s.leadCard, s.compactLeadCard, s.leadSeparator]} activeOpacity={0.8} onPress={() => Linking.openURL('https://neupgroup.com/account/security')}><View style={s.leadIcon}><Text style={s.leadIconText}>⌁</Text></View><View style={s.leadCopy}><Text name="title3">Security</Text><Text name="regular" style={s.leadSubtitle}>Manage your account security.</Text></View><Text style={s.leadChevron}>↗</Text></TouchableOpacity><TouchableOpacity style={[s.leadCard, s.compactLeadCard, s.lastLeadCard]} activeOpacity={0.8} onPress={() => router.push({ pathname: '/auth', params: { step: 'signout' } })}><View style={s.leadIcon}><Text style={s.leadIconText}>↪</Text></View><View style={s.leadCopy}><Text name="title3">Signout</Text><Text name="regular" style={s.leadSubtitle}>Sign out of your NeupID account.</Text></View><Text style={s.leadChevron}>›</Text></TouchableOpacity></View>
    </>}
  </ScrollView></SafeAreaView>;
}

const s = StyleSheet.create({
  safe:{flex:1,backgroundColor:'#fff'},content:{paddingBottom:28},topBar:{height:88,paddingTop:38,paddingHorizontal:20,backgroundColor:'#fff',flexDirection:'row',alignItems:'center',elevation:12,shadowColor:'#173d35',shadowOffset:{width:0,height:6},shadowOpacity:0.24,shadowRadius:12,zIndex:10},cover:{height:154,backgroundColor:'#a9c8b4',overflow:'hidden',justifyContent:'center',paddingLeft:24},coverCircle:{position:'absolute',width:260,height:260,borderRadius:140,backgroundColor:'#6d9e88',right:-35,top:-115},coverWord:{color:'#fff',fontSize:25,fontWeight:'900',letterSpacing:2,lineHeight:29},identityRow:{height:74,paddingHorizontal:20,flexDirection:'row',justifyContent:'space-between',alignItems:'center'},avatar:{width:88,height:88,borderRadius:44,backgroundColor:'#173d35',borderWidth:5,borderColor:'#fff',alignItems:'center',justifyContent:'center',marginTop:-38},avatarImage:{width:'100%',height:'100%',borderRadius:44},avatarText:{color:'#d6e3ca',fontWeight:'900',fontSize:25},details:{paddingHorizontal:20},nameRow:{flexDirection:'row',alignItems:'center',gap:8},verified:{color:'#4c9b75'},handle:{marginTop:2},bio:{color:'#29443d',fontSize:15,lineHeight:22,marginTop:17},metaRow:{flexDirection:'row',gap:18,marginTop:14,flexWrap:'wrap'},meta:{color:'#5f756d',fontSize:13},stats:{flexDirection:'row',gap:22,marginTop:17},stat:{color:'#70817c',fontSize:14},statStrong:{color:'#173d35',fontWeight:'900'},sectionHeading:{marginHorizontal:20,marginTop:25,marginBottom:-4},authCard:{marginHorizontal:20,marginTop:20,padding:18,borderRadius:16,backgroundColor:'#eaf2e3',borderWidth:1,borderColor:'#d7e5d2',flexDirection:'row',alignItems:'center'},authCopy:{flex:1},authTitle:{color:'#173d35'},authSubtitle:{color:'#557064',marginTop:6},authChevron:{color:'#4c9b75',marginLeft:12},leads:{marginTop:12},leadCard:{marginHorizontal:20,padding:15,backgroundColor:'#fff',borderWidth:1,borderColor:'#e3ebe6',flexDirection:'row',alignItems:'flex-start'},firstLeadCard:{borderTopLeftRadius:16,borderTopRightRadius:16},lastLeadCard:{borderBottomLeftRadius:16,borderBottomRightRadius:16},leadSeparator:{borderBottomWidth:1,borderBottomColor:'#e3ebe6'},leadIcon:{width:42,height:42,borderRadius:13,backgroundColor:'#eaf2e3',alignItems:'center',justifyContent:'center',marginTop:0},leadIconText:{color:'#4c9b75',fontSize:21,fontWeight:'800'},leadCopy:{flex:1,marginLeft:12,alignItems:'flex-start'},leadSubtitle:{marginTop:1},leadChevron:{color:'#9aa8a2',fontSize:25,marginLeft:10},
  compactLeadCard:{padding:11}, compactLeadIcon:{width:38,height:38,borderRadius:11}, compactLeadIconText:{fontSize:19}, compactLeadCopy:{marginLeft:11}, compactLeadTitle:{fontSize:14}, compactLeadSubtitle:{marginTop:3}, compactLeadChevron:{fontSize:23,marginLeft:8}
});
