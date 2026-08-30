import { StatusBar } from 'expo-status-bar';
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Link } from 'expo-router';
import { useEffect, useState } from 'react';
import { listEstateProperties } from '#/logica/estate/property/list';

const homes = [
  { title: 'Sunlight, space, and room to make it yours.', location: 'Scottsdale, Arizona', price: '$895,000', image: 'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?w=1000&q=85' },
  { title: 'A warm, thoughtful home made for slow mornings.', location: 'Nashville, Tennessee', price: '$760,000', image: 'https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?w=1000&q=85' },
];

export default function Home() {
  const [properties, setProperties] = useState<typeof homes>(homes);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void listEstateProperties({
      limit: 10,
      fields: ['id', 'title', 'price', 'location', 'images', 'description', 'property.spacing'],
    }).then((response) => {
      if (!response.ok || !Array.isArray(response.body.properties)) return;
      const liveHomes = response.body.properties.map((item: any, index) => {
        const image = Array.isArray(item.images) ? item.images[0] : item.image;
        return {
          title: item.title || item.description || 'Property listing',
          location: typeof item.location === 'string' ? item.location : item.location?.formatted || 'Location unavailable',
          price: item.price != null ? String(item.price) : 'Price on request',
          image: typeof image === 'string' ? image : image?.url || homes[index % homes.length].image,
        };
      });
      if (liveHomes.length) setProperties(liveHomes);
    }).finally(() => setLoading(false));
  }, []);

  return <View style={s.page}><StatusBar style="dark" /><View style={s.header}><View style={s.brand}><Text style={s.logo}>N</Text><Text style={s.brandText}>Neup.Estate</Text></View><Link href="/profile" asChild><TouchableOpacity style={s.avatar}><Text>KM</Text></TouchableOpacity></Link></View><ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}><Text style={s.kicker}>GOOD MORNING</Text><Text style={s.heading}>Find your next place</Text><Text style={s.sub}>Homes shared by people who know them best.</Text><View style={s.search}><Text style={s.searchIcon}>⌕</Text><Text style={s.placeholder}>Search city, neighborhood, or ZIP</Text><Text style={s.filter}>☷</Text></View><View style={s.row}><Text style={s.section}>Popular near you</Text><Link href="/explore" asChild><TouchableOpacity><Text style={s.link}>Explore all →</Text></TouchableOpacity></Link></View>{loading && <Text style={s.status}>Loading live properties…</Text>}{properties.map((h, i) => <Link key={`${h.title}-${i}`} href={{ pathname: '/property/[id]', params: { id: String(i + 1) } }} asChild><TouchableOpacity style={s.card}><Image source={{ uri: h.image }} style={s.image} /><View style={s.cardText}><Text style={s.price}>{h.price}</Text><Text style={s.title}>{h.title}</Text><Text style={s.location}>⌖  {h.location}</Text><Text style={s.meta}>Live listing from Neup Estate</Text></View></TouchableOpacity></Link>)}</ScrollView></View>;
}

export function Nav({ active }: { active: string }) { return <View style={s.nav}><Link href="/home" asChild><TouchableOpacity><Text style={[s.navIcon, active === 'home' && s.active]}>⌂</Text><Text style={[s.navText, active === 'home' && s.active]}>Home</Text></TouchableOpacity></Link><Link href="/explore" asChild><TouchableOpacity><Text style={[s.navIcon, active === 'explore' && s.active]}>⌕</Text><Text style={[s.navText, active === 'explore' && s.active]}>Explore</Text></TouchableOpacity></Link><Link href="/post" asChild><TouchableOpacity style={s.post}><Text style={s.plus}>＋</Text></TouchableOpacity></Link><Link href="/profile" asChild><TouchableOpacity><Text style={[s.navIcon, active === 'profile' && s.active]}>◉</Text><Text style={[s.navText, active === 'profile' && s.active]}>Profile</Text></TouchableOpacity></Link></View>; }

export const s = StyleSheet.create({ page: { flex: 1, backgroundColor: '#f6f7f9' }, header: { height: 88, paddingTop: 38, paddingHorizontal: 20, backgroundColor: '#fff', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, brand: { flexDirection: 'row', alignItems: 'center', gap: 9 }, logo: { backgroundColor: '#173d35', color: '#d8f36a', fontSize: 19, fontWeight: '800', padding: 5, borderRadius: 9 }, brandText: { color: '#173d35', fontSize: 19, fontWeight: '700' }, avatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#e5eddf', alignItems: 'center', justifyContent: 'center' }, content: { padding: 20, paddingBottom: 100 }, kicker: { color: '#78908a', fontSize: 11, fontWeight: '700', letterSpacing: 1.5, marginTop: 14 }, heading: { color: '#173d35', fontSize: 29, fontWeight: '800', marginTop: 7 }, sub: { color: '#70817c', fontSize: 14, marginTop: 7 }, search: { height: 51, borderRadius: 14, backgroundColor: '#fff', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 15, marginTop: 20, marginBottom: 27 }, searchIcon: { fontSize: 25, color: '#173d35', marginRight: 8 }, placeholder: { flex: 1, color: '#9aa6a2', fontSize: 13 }, filter: { color: '#173d35', fontSize: 20 }, row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }, section: { color: '#173d35', fontSize: 18, fontWeight: '800' }, link: { color: '#557d54', fontSize: 12, fontWeight: '700' }, status: { color: '#81918b', fontSize: 12, marginBottom: 12 }, card: { backgroundColor: '#fff', borderRadius: 18, overflow: 'hidden', marginBottom: 18 }, image: { width: '100%', height: 190 }, cardText: { padding: 15 }, price: { color: '#173d35', fontSize: 18, fontWeight: '800' }, title: { color: '#27413a', fontSize: 14, fontWeight: '700', lineHeight: 20, marginTop: 5 }, location: { color: '#81918b', fontSize: 12, marginTop: 7 }, meta: { color: '#9aa6a2', fontSize: 11, marginTop: 9 }, nav: { position: 'absolute', bottom: 0, height: 74, left: 0, right: 0, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#edf0ee', flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center' }, navIcon: { textAlign: 'center', color: '#9aa6a2', fontSize: 22 }, navText: { color: '#9aa6a2', fontSize: 10, marginTop: 2 }, active: { color: '#173d35', fontWeight: '800' }, post: { backgroundColor: '#173d35', borderRadius: 17, width: 48, height: 42, alignItems: 'center', justifyContent: 'center' }, plus: { color: '#d8f36a', fontSize: 25 } });
