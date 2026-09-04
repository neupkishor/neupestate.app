import { StatusBar } from 'expo-status-bar';
import { Image, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';

import { Text } from '#/components/ui/text';
import { useAuthSession } from '#/core/auth-session';

function PostCard({ icon, title, description, accent = false, first = false, last = false, onPress }: { icon: string; title: string; description?: string; accent?: boolean; first?: boolean; last?: boolean; onPress?: () => void }) {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.86} style={[styles.card, first && styles.firstCard, last && styles.lastCard, accent && styles.royaltyCard]}>
      <View style={[styles.iconWrap, accent && styles.royaltyIconWrap]}><Text name="postIcon" style={styles.icon}>{icon}</Text></View>
      <View style={styles.cardCopy}><View style={styles.titleRow}><Text name="postCardTitle" style={styles.cardTitle}>{title}</Text><Text name="postArrow" style={styles.arrow}>›</Text></View>{description ? <Text name="postDescription" style={styles.cardDescription}>{description}{accent ? <Text name="postSecured" style={styles.secured}> Secured by Neup.Protect.</Text> : null}</Text> : null}</View>
    </TouchableOpacity>
  );
}

export default function Post() {
  const router = useRouter();
  const { profile } = useAuthSession();

  return <View style={styles.page}><StatusBar style="dark" />
    <View style={styles.header}>
      <View style={styles.brand}>
        <Text name="appTitle">Neup.Estate</Text>
      </View>

      <TouchableOpacity
        style={styles.avatar}
        activeOpacity={0.8}
        onPress={() => router.push('/profile')}
      >
        {profile?.accountPhoto ? <Image source={{ uri: profile.accountPhoto }} style={styles.avatarImage} /> : <Text>{(profile?.displayName || 'KM').split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase()}</Text>}
      </TouchableOpacity>
    </View>

    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
    <View style={styles.header}><Text name="postEyebrow" style={styles.eyebrow}>NEUP.ESTATE</Text><Text name="postHeading" style={styles.heading}>What would you like to post?</Text><Text name="postSubtitle" style={styles.subtitle}>Share a property, tell us what you’re looking for, or earn from a lead.</Text></View>
    <View style={styles.cards}><PostCard icon="⌂" title="Post Property" description="List a home, land, or commercial property for sale or rent." first /><PostCard icon="⌕" title="Post Requirement" description="Tell us what you’re looking for and find the right property." /><PostCard icon="✦" title="Post a Lead" description="Earn royalties from your leads that sell or buy." accent last onPress={() => router.push('/referrals/create')} /></View>
  </ScrollView></View>;
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: '#f4f7fb' },
  header: { height: 88, paddingTop: 38, paddingHorizontal: 20, backgroundColor: '#fff', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', elevation: 12, shadowColor: '#173d35', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.24, shadowRadius: 12, zIndex: 10 },
  content: { paddingHorizontal: 20, paddingTop: 24, paddingBottom: 40 },
  eyebrow: { color: '#5c84b5', fontSize: 11, fontWeight: '800', letterSpacing: 1.8, marginBottom: 12 }, heading: { color: '#163a63', fontSize: 29, fontWeight: '800', lineHeight: 35, maxWidth: 320 },
  subtitle: { color: '#82908a', fontSize: 14, lineHeight: 21, marginTop: 10, maxWidth: 330 }, cards: { borderRadius: 22, borderWidth: 1, borderColor: '#e3ebe6', overflow: 'hidden' },
  card: { minHeight: 116, borderRadius: 0, backgroundColor: '#fff', padding: 20, flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#edf1f5' }, firstCard: { borderTopLeftRadius: 22, borderTopRightRadius: 22 }, lastCard: { borderBottomLeftRadius: 22, borderBottomRightRadius: 22, borderBottomWidth: 0 }, royaltyCard: { backgroundColor: '#fff', minHeight: 154 },
  iconWrap: { width: 54, height: 54, borderRadius: 18, backgroundColor: '#eaf2fc', alignItems: 'center', justifyContent: 'center', marginRight: 16 }, royaltyIconWrap: { backgroundColor: '#c6dcf4' }, icon: {}, cardCopy: { flex: 1 }, titleRow: { flexDirection: 'row', alignItems: 'center' }, cardTitle: {}, cardDescription: { marginTop: 8 }, secured: {}, arrow: { marginLeft: 5 },
  brand: { flexDirection: 'row', alignItems: 'center' },
  avatar: { width: 34, height: 34, borderRadius: 17, backgroundColor: '#e5eddf', alignItems: 'center', justifyContent: 'center' },
  avatarImage: { width: '100%', height: '100%', borderRadius: 17 },
});
