import { StatusBar } from 'expo-status-bar';
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Header } from '#/components/elements/Header';

const stories = [
  { name: 'Maya Chen', role: 'Top agent', image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&q=80' },
  { name: 'James Wilson', role: 'New listing', image: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=200&q=80' },
  { name: 'Ava Morgan', role: 'Open house', image: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=200&q=80' },
  { name: 'Noah Patel', role: 'Market tips', image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&q=80' },
];

const properties = [
  { agent: 'Maya Chen', time: '2h', title: 'A quiet modern retreat in the heart of the city.', location: 'Austin, Texas', price: '$1,240,000', image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200&q=85', avatar: stories[0].image, likes: '248' },
  { agent: 'James Wilson', time: '5h', title: 'Sunlight, space, and room to make it yours.', location: 'Scottsdale, Arizona', price: '$895,000', image: 'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?w=1200&q=85', avatar: stories[1].image, likes: '182' },
];

export default function App() {
  return <View style={styles.container}>
    <StatusBar style="dark" />
    <Header style={styles.header}>
      <View style={styles.brand}><View style={styles.logoMark}><Text style={styles.logoText}>N</Text></View><Text style={styles.brandName}>Neup.Estate</Text></View>
      <TouchableOpacity style={styles.profileButton}><Text style={styles.profileIcon}>◉</Text></TouchableOpacity>
    </Header>
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
      <View style={styles.welcome}><Text style={styles.eyebrow}>GOOD MORNING</Text><Text style={styles.heading}>Find your next place</Text><Text style={styles.subheading}>Discover homes shared by people who know them best.</Text></View>
      <View style={styles.search}><Text style={styles.searchIcon}>⌕</Text><Text style={styles.searchText}>Search city, neighborhood, or ZIP</Text><Text style={styles.filter}>☷</Text></View>
      <Text style={styles.sectionTitle}>Agent stories <Text style={styles.seeAll}>See all</Text></Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.stories}>
        {stories.map((story) => <View style={styles.story} key={story.name}><View style={styles.storyRing}><Image source={{ uri: story.image }} style={styles.storyImage} /></View><Text style={styles.storyName} numberOfLines={1}>{story.name}</Text><Text style={styles.storyRole}>{story.role}</Text></View>)}
      </ScrollView>
      <View style={styles.feedHeader}><Text style={styles.sectionTitle}>Latest from your network</Text><Text style={styles.sort}>For you ˅</Text></View>
      {properties.map((property) => <View style={styles.card} key={property.title}>
        <View style={styles.postHeader}><Image source={{ uri: property.avatar }} style={styles.avatar} /><View style={styles.agentInfo}><Text style={styles.agentName}>{property.agent}</Text><Text style={styles.postTime}>{property.time} · Austin Realty</Text></View><Text style={styles.more}>•••</Text></View>
        <Text style={styles.postTitle}>{property.title}</Text><Text style={styles.location}>⌖  {property.location}</Text><Image source={{ uri: property.image }} style={styles.propertyImage} />
        <View style={styles.cardBottom}><Text style={styles.price}>{property.price}</Text><TouchableOpacity><Text style={styles.save}>♡</Text></TouchableOpacity></View><View style={styles.actions}><Text style={styles.action}>♡  {property.likes}</Text><Text style={styles.action}>◯  24 comments</Text><Text style={styles.action}>↗  Share</Text></View>
      </View>)}
    </ScrollView>
  </View>;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f6f7f9' },
  header: { height: 86, paddingTop: 38, paddingHorizontal: 20, backgroundColor: '#fff', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 9 }, logoMark: { width: 31, height: 31, borderRadius: 10, backgroundColor: '#173d35', alignItems: 'center', justifyContent: 'center' }, logoText: { color: '#d8f36a', fontWeight: '800', fontSize: 19 }, brandName: { color: '#173d35', fontSize: 19, fontWeight: '700', letterSpacing: -0.5 }, profileButton: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#eef1ef', alignItems: 'center', justifyContent: 'center' }, profileIcon: { color: '#173d35', fontSize: 20 },
  content: { padding: 20, paddingBottom: 50 }, welcome: { marginTop: 12, marginBottom: 18 }, eyebrow: { color: '#78908a', fontSize: 11, fontWeight: '700', letterSpacing: 1.5, marginBottom: 7 }, heading: { color: '#173d35', fontSize: 29, fontWeight: '800', letterSpacing: -1 }, subheading: { color: '#70817c', fontSize: 14, marginTop: 7, lineHeight: 20 }, search: { height: 50, borderRadius: 14, backgroundColor: '#fff', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 15, marginBottom: 25 }, searchIcon: { fontSize: 25, color: '#173d35', marginRight: 9 }, searchText: { flex: 1, color: '#9aa6a2', fontSize: 13 }, filter: { color: '#173d35', fontSize: 20 }, sectionTitle: { color: '#173d35', fontSize: 17, fontWeight: '800' }, seeAll: { color: '#82958e', fontSize: 12, fontWeight: '600', marginLeft: 10 }, stories: { gap: 17, paddingVertical: 15, paddingRight: 10 }, story: { width: 67, alignItems: 'center' }, storyRing: { width: 66, height: 66, borderRadius: 33, borderWidth: 2, borderColor: '#cbe568', padding: 3 }, storyImage: { width: '100%', height: '100%', borderRadius: 30 }, storyName: { color: '#263c36', fontSize: 11, fontWeight: '700', marginTop: 7 }, storyRole: { color: '#91a09c', fontSize: 10, marginTop: 2 }, feedHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 15, marginBottom: 14 }, sort: { color: '#81918b', fontSize: 12 }, card: { backgroundColor: '#fff', borderRadius: 18, marginBottom: 18, overflow: 'hidden', paddingTop: 16 }, postHeader: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16 }, avatar: { width: 39, height: 39, borderRadius: 20 }, agentInfo: { marginLeft: 10, flex: 1 }, agentName: { color: '#243b35', fontSize: 13, fontWeight: '800' }, postTime: { color: '#9aa6a2', fontSize: 11, marginTop: 3 }, more: { color: '#82918d', letterSpacing: 2 }, postTitle: { color: '#203a33', fontSize: 15, fontWeight: '600', lineHeight: 21, paddingHorizontal: 16, marginTop: 13 }, location: { color: '#82958e', fontSize: 12, paddingHorizontal: 16, marginTop: 6, marginBottom: 13 }, propertyImage: { width: '100%', height: 215 }, cardBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 15, paddingBottom: 9 }, price: { color: '#173d35', fontSize: 18, fontWeight: '800' }, save: { fontSize: 25, color: '#173d35' }, actions: { borderTopWidth: 1, borderTopColor: '#f0f2f1', flexDirection: 'row', justifyContent: 'space-between', padding: 13, paddingHorizontal: 16 }, action: { color: '#87958f', fontSize: 11, fontWeight: '600' },
});
