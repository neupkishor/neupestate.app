import { AppPressable as TouchableOpacity } from '@/components/element/touch-feedback';
import { StatusBar } from 'expo-status-bar';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';

import { Text } from '@neup/components/ui/text';

function PostCard({ icon, title, description, accent = false, first = false, last = false, onPress }: { icon: string; title: string; description?: string; accent?: boolean; first?: boolean; last?: boolean; onPress?: () => void }) {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.86} style={[styles.card, first && styles.firstCard, last && styles.lastCard, accent && styles.royaltyCard]}>
      <View style={[styles.iconWrap, accent && styles.royaltyIconWrap]}><Text name="postIcon" style={styles.icon}>{icon}</Text></View>
      <View style={styles.cardCopy}><View style={styles.titleRow}><Text name="title3" style={styles.cardTitle}>{title}</Text><Text name="postArrow" style={styles.arrow}>›</Text></View>{description ? <Text name="regular" style={styles.cardDescription}>{description}{accent ? <Text name="regular" color="#42604b"> Secured by Neup.Protect.</Text> : null}</Text> : null}</View>
    </TouchableOpacity>
  );
}

export default function Post() {
  const router = useRouter();

  return <View style={styles.page}><StatusBar style="dark" />
    <View style={styles.header}>
      <View style={styles.brand}>
        <Text name="appTitle">Post with Us</Text>
      </View>
    </View>

    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
    <View style={styles.intro}>
      <Text name="postHeading" >What would you like to post?</Text>
      <Text name="postSubtitle">Share a property, tell us what you’re looking for, or earn from a lead.</Text>
    </View>
    <View style={styles.cards}><PostCard icon="⌂" title="Post Property" description="List a home, land, or commercial property for sale or rent." first onPress={() => router.push('/properties/new')} /><PostCard icon="⌕" title="Post Requirement" description="Tell us what you’re looking for and find the right property." /><PostCard icon="✦" title="Post a Lead" description="Earn royalties from your leads that sell or buy." accent last onPress={() => router.push('/referrals/create')} /></View>
  </ScrollView></View>;
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: '#f6f7f4' },
  header: { height: 88, paddingTop: 38, paddingHorizontal: 20, backgroundColor: '#fff', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', elevation: 12, shadowColor: '#173d35', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.12, shadowRadius: 12, zIndex: 10 },
  content: { paddingHorizontal: 20, paddingTop: 24, paddingBottom: 40 },
  intro: { marginBottom: 30 },
  eyebrow: { color: '#78908a', fontSize: 11, fontWeight: '800', letterSpacing: 1.8, marginBottom: 12 }, heading: { color: '#173d35', fontSize: 29, fontWeight: '800', lineHeight: 35, maxWidth: 320 },
  subtitle: { color: '#70817c', fontSize: 14, lineHeight: 21, marginTop: 10, maxWidth: 330 }, cards: { borderRadius: 22, borderWidth: 1, borderColor: '#e5e9e2', overflow: 'hidden' },
  card: { minHeight: 116, borderRadius: 0, backgroundColor: '#fff', padding: 20, flexDirection: 'row', alignItems: 'flex-start', borderBottomWidth: 1, borderBottomColor: '#edf0eb' }, firstCard: { borderTopLeftRadius: 22, borderTopRightRadius: 22 }, lastCard: { borderBottomLeftRadius: 22, borderBottomRightRadius: 22, borderBottomWidth: 0 }, royaltyCard: { backgroundColor: '#fff', minHeight: 154 },
  iconWrap: { width: 54, height: 54, borderRadius: 18, backgroundColor: '#f0f4e9', alignItems: 'center', justifyContent: 'center', marginRight: 16 }, royaltyIconWrap: { backgroundColor: '#e7efcf' }, icon: {}, cardCopy: { flex: 1, alignItems: 'flex-start' }, titleRow: { flexDirection: 'row', alignItems: 'flex-start' }, cardTitle: {}, cardDescription: { marginTop: 1 }, secured: {}, arrow: { marginLeft: 5 },
  brand: { flexDirection: 'row', alignItems: 'center' },
});
