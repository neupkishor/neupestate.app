import { StatusBar } from 'expo-status-bar';
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

const images = [
  'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1400&q=90',
  'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?w=900&q=85',
  'https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?w=900&q=85',
];

export default function PropertyDetails() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <View style={styles.hero}>
          <Image source={{ uri: images[0] }} style={styles.heroImage} />
          <View style={styles.heroShade} />
          <View style={styles.topBar}>
            <TouchableOpacity style={styles.circleButton} onPress={() => router.back()}><Text style={styles.back}>‹</Text></TouchableOpacity>
            <View style={styles.topActions}>
              <TouchableOpacity style={styles.circleButton}><Text style={styles.icon}>↗</Text></TouchableOpacity>
              <TouchableOpacity style={styles.circleButton}><Text style={styles.icon}>♡</Text></TouchableOpacity>
            </View>
          </View>
          <View style={styles.photoCount}><Text style={styles.photoText}>▧  1 / 12</Text></View>
        </View>

        <View style={styles.body}>
          <View style={styles.eyebrowRow}><Text style={styles.eyebrow}>FOR SALE</Text><Text style={styles.updated}>Updated 2h ago</Text></View>
          <Text style={styles.title}>A quiet modern retreat in the heart of the city.</Text>
          <Text style={styles.location}>⌖  1801 Vista Lane, Austin, Texas</Text>
          <Text style={styles.price}>$1,240,000</Text>

          <View style={styles.stats}>
            <Stat value="3" label="Beds" />
            <Stat value="2.5" label="Baths" />
            <Stat value="2,146" label="Sq ft" />
            <Stat value="2021" label="Built" />
          </View>

          <Text style={styles.sectionTitle}>About this home</Text>
          <Text style={styles.description}>Warm natural light, honest materials, and a floor plan made for easy living. This beautifully considered home pairs clean modern lines with the comfort of a quiet neighborhood, just minutes from everything Austin has to offer.</Text>
          <TouchableOpacity><Text style={styles.readMore}>Read full description  →</Text></TouchableOpacity>

          <Text style={[styles.sectionTitle, styles.spaceTop]}>Take a closer look</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.thumbs}>
            {images.slice(1).map((image, index) => <Image key={image} source={{ uri: image }} style={styles.thumb} />)}
            <View style={styles.morePhotos}><Text style={styles.morePhotosText}>+ 9{`\n`}photos</Text></View>
          </ScrollView>

          <View style={styles.agentCard}>
            <Image source={{ uri: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&q=80' }} style={styles.agentAvatar} />
            <View style={styles.agentDetails}><Text style={styles.agentLabel}>LISTED BY</Text><Text style={styles.agentName}>Maya Chen</Text><Text style={styles.agentCompany}>Austin Realty · Top agent</Text></View>
            <TouchableOpacity style={styles.agentArrow}><Text style={styles.arrow}>→</Text></TouchableOpacity>
          </View>
        </View>
      </ScrollView>
      <View style={styles.bottomBar}><TouchableOpacity style={styles.messageButton}><Text style={styles.messageText}>Message agent</Text></TouchableOpacity><TouchableOpacity style={styles.tourButton}><Text style={styles.tourText}>Request a tour</Text></TouchableOpacity></View>
    </View>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return <View style={styles.stat}><Text style={styles.statValue}>{value}</Text><Text style={styles.statLabel}>{label}</Text></View>;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f6f7f9' }, content: { paddingBottom: 105 }, hero: { height: 330, position: 'relative' }, heroImage: { width: '100%', height: '100%' }, heroShade: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(15,35,30,0.18)' }, topBar: { position: 'absolute', top: 52, left: 20, right: 20, flexDirection: 'row', justifyContent: 'space-between' }, topActions: { flexDirection: 'row', gap: 10 }, circleButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.9)', alignItems: 'center', justifyContent: 'center' }, back: { color: '#173d35', fontSize: 34, lineHeight: 32, marginTop: -3 }, icon: { color: '#173d35', fontSize: 20 }, photoCount: { position: 'absolute', bottom: 20, right: 20, backgroundColor: 'rgba(23,61,53,0.88)', borderRadius: 18, paddingVertical: 8, paddingHorizontal: 13 }, photoText: { color: '#fff', fontSize: 12, fontWeight: '700' }, body: { padding: 22, backgroundColor: '#f6f7f9' }, eyebrowRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }, eyebrow: { color: '#658b4f', fontSize: 11, letterSpacing: 1.5, fontWeight: '800' }, updated: { color: '#9aa6a2', fontSize: 11 }, title: { color: '#173d35', fontSize: 27, fontWeight: '800', lineHeight: 33, letterSpacing: -0.7, marginTop: 10 }, location: { color: '#71847d', fontSize: 13, marginTop: 9 }, price: { color: '#173d35', fontSize: 25, fontWeight: '800', marginTop: 18 }, stats: { flexDirection: 'row', backgroundColor: '#fff', borderRadius: 16, paddingVertical: 16, marginTop: 20, justifyContent: 'space-around' }, stat: { alignItems: 'center', minWidth: 55 }, statValue: { color: '#173d35', fontSize: 17, fontWeight: '800' }, statLabel: { color: '#8a9893', fontSize: 11, marginTop: 4 }, sectionTitle: { color: '#173d35', fontSize: 18, fontWeight: '800', marginTop: 25 }, description: { color: '#71817b', fontSize: 13, lineHeight: 21, marginTop: 9 }, readMore: { color: '#557d54', fontSize: 12, fontWeight: '800', marginTop: 9 }, spaceTop: { marginTop: 27 }, thumbs: { gap: 10, paddingVertical: 13 }, thumb: { width: 112, height: 86, borderRadius: 12 }, morePhotos: { width: 88, height: 86, borderRadius: 12, backgroundColor: '#dce6d3', alignItems: 'center', justifyContent: 'center' }, morePhotosText: { color: '#42604b', fontWeight: '800', fontSize: 13, textAlign: 'center', lineHeight: 18 }, agentCard: { backgroundColor: '#fff', borderRadius: 17, padding: 13, flexDirection: 'row', alignItems: 'center', marginTop: 18 }, agentAvatar: { width: 48, height: 48, borderRadius: 24 }, agentDetails: { flex: 1, marginLeft: 11 }, agentLabel: { color: '#9aa6a2', fontSize: 9, letterSpacing: 1.2, fontWeight: '800' }, agentName: { color: '#173d35', fontWeight: '800', fontSize: 14, marginTop: 3 }, agentCompany: { color: '#87958f', fontSize: 11, marginTop: 3 }, agentArrow: { width: 34, height: 34, borderRadius: 17, backgroundColor: '#eef5e7', alignItems: 'center', justifyContent: 'center' }, arrow: { color: '#557d54', fontSize: 18 }, bottomBar: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#edf0ee', paddingHorizontal: 20, paddingVertical: 13, flexDirection: 'row', gap: 10 }, messageButton: { flex: 1, height: 48, borderRadius: 14, borderWidth: 1, borderColor: '#cdd8d3', alignItems: 'center', justifyContent: 'center' }, messageText: { color: '#173d35', fontWeight: '800', fontSize: 13 }, tourButton: { flex: 1.25, height: 48, borderRadius: 14, backgroundColor: '#173d35', alignItems: 'center', justifyContent: 'center' }, tourText: { color: '#d8f36a', fontWeight: '800', fontSize: 13 },
});
