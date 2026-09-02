import { StatusBar } from 'expo-status-bar';
import { ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';

import { Text } from '#/components/ui/text';
import outfitFonts from '$/fonts/outfitfonts';

function PostCard({ icon, title, description, accent = false, first = false, last = false, onPress }: { icon: string; title: string; description?: string; accent?: boolean; first?: boolean; last?: boolean; onPress?: () => void }) {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.86} style={[styles.card, first && styles.firstCard, last && styles.lastCard, accent && styles.royaltyCard]}>
      <View style={[styles.iconWrap, accent && styles.royaltyIconWrap]}><Text style={styles.icon}>{icon}</Text></View>
      <View style={styles.cardCopy}><View style={styles.titleRow}><Text style={styles.cardTitle}>{title}</Text><Text style={styles.arrow}>›</Text></View>{description ? <Text style={styles.cardDescription}>{description}{accent ? <Text style={styles.secured}> Secured by Neup.Protect.</Text> : null}</Text> : null}</View>
    </TouchableOpacity>
  );
}

export default function Post() {
  const router = useRouter();
  return <View style={styles.page}><StatusBar style="dark" /><ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
    <View style={styles.header}><Text style={styles.eyebrow}>NEUP.ESTATE</Text><Text style={styles.heading}>What would you like to post?</Text><Text style={styles.subtitle}>Share a property, tell us what you’re looking for, or earn from a lead.</Text></View>
    <View style={styles.cards}><PostCard icon="⌂" title="Post Property" description="List a home, land, or commercial property for sale or rent." first /><PostCard icon="⌕" title="Post Requirement" description="Tell us what you’re looking for and find the right property." /><PostCard icon="✦" title="Post a Lead" description="Earn royalties from your leads that sell or buy." accent last onPress={() => router.push('/post/refer')} /></View>
  </ScrollView></View>;
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: '#f4f7fb' }, content: { paddingHorizontal: 20, paddingTop: 76, paddingBottom: 40 }, header: { marginBottom: 30 },
  eyebrow: { color: '#5c84b5', fontSize: 11, fontWeight: '800', letterSpacing: 1.8, marginBottom: 12 }, heading: { color: '#163a63', fontSize: 29, fontWeight: '800', lineHeight: 35, maxWidth: 320 },
  subtitle: { color: '#82908a', fontSize: 14, lineHeight: 21, marginTop: 10, maxWidth: 330 }, cards: { borderRadius: 22, borderWidth: 1, borderColor: '#e3ebe6', overflow: 'hidden' },
  card: { minHeight: 116, borderRadius: 0, backgroundColor: '#fff', padding: 20, flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#edf1f5' }, firstCard: { borderTopLeftRadius: 22, borderTopRightRadius: 22 }, lastCard: { borderBottomLeftRadius: 22, borderBottomRightRadius: 22, borderBottomWidth: 0 }, royaltyCard: { backgroundColor: '#fff', minHeight: 154 },
  iconWrap: { width: 54, height: 54, borderRadius: 18, backgroundColor: '#eaf2fc', alignItems: 'center', justifyContent: 'center', marginRight: 16 }, royaltyIconWrap: { backgroundColor: '#c6dcf4' }, icon: { color: '#3975b5', fontSize: 28, lineHeight: 31 }, cardCopy: { flex: 1 }, titleRow: { flexDirection: 'row', alignItems: 'center' }, cardTitle: { color: '#163a63', fontSize: 17, fontWeight: '800' }, cardDescription: { color: '#65809b', fontSize: 12, lineHeight: 18, marginTop: 8 }, secured: { color: '#315d8e', fontFamily: outfitFonts.bold, fontWeight: '800' }, arrow: { color: '#3975b5', fontSize: 24, fontWeight: '300', marginLeft: 5, lineHeight: 24 },
});
