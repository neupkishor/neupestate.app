import { AppPressable as TouchableOpacity } from '@/components/element/touch-feedback';
import { StatusBar } from 'expo-status-bar';
import { Animated, Image, NativeScrollEvent, NativeSyntheticEvent, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import { Text } from '@neup/components/ui/text';
import theme from '@base/theme.json';
import { BaseIcon } from '@/components/element/base-icon';
import { HeaderFloating, HeaderSticky } from '@neup/components/ui/header';

const places = [{ name: 'Austin', count: '248 homes', image: 'https://images.unsplash.com/photo-1531218150217-54595bc2b934?w=800&q=85' }, { name: 'Scottsdale', count: '182 homes', image: 'https://images.unsplash.com/photo-1510798831971-661eb04b3739?w=800&q=85' }, { name: 'Nashville', count: '129 homes', image: 'https://images.unsplash.com/photo-1494526585095-c41746248156?w=800&q=85' }];
const betweenSectionsGap = theme.spacing.betweenSections;
export default function Explore() {
  const router = useRouter();
  const [headerHeight, setHeaderHeight] = useState(0);
  const scrollY = useRef(new Animated.Value(0)).current;

  // Keep the shared sticky header synchronized with Explore scrolling.
  function handleScroll(event: NativeSyntheticEvent<NativeScrollEvent>) {
    scrollY.setValue(Math.max(0, event.nativeEvent.contentOffset.y));
  }

  return <View style={s.page}>
    <StatusBar style="dark" />
    <HeaderFloating scrollY={scrollY} headerHeight={headerHeight}><Text name="title2" size={20} lineHeight={27}>Let's find a Place!</Text></HeaderFloating>
    <Animated.ScrollView contentContainerStyle={s.content} onScroll={handleScroll} scrollEventThrottle={16}>
      <HeaderSticky onHeightChange={setHeaderHeight} style={[s.exploreHeader, s.compactHeaderSpacing]}><Text name="title">Let's find a Place!</Text><Text name="exploreSubtitle" style={s.introSubtitle}>Find a neighbourhood that feels like you.</Text></HeaderSticky>
      <TouchableOpacity style={s.search} activeOpacity={0.8} onPress={() => router.push('/search')}><BaseIcon name="search" size={18} color="#173d35" style={s.searchIcon} /><Text name="explorePlaceholder">Search a city or neighborhood</Text></TouchableOpacity>
      <Text name="title2">Trending Destinations</Text><Text name="exploreSubtitle" style={s.trendingSubtitle}>Explore places worth calling home.</Text>
      {places.map(p => <TouchableOpacity style={s.card} key={p.name}><Image source={{ uri: p.image }} style={s.image} /><View style={s.overlay}><Text name="explorePlaceName">{p.name}</Text><View style={s.placeCount}><Text name="explorePlaceCount">{p.count}</Text><BaseIcon name="arrow-left" rotation={180} size={14} color="#fff" /></View></View></TouchableOpacity>)}
      <Text name="title2" style={s.browseHeading}>Browse by lifestyle</Text><View style={s.tags}>{['Quiet & calm', 'Walkable', 'Room to grow', 'Design lovers'].map(t => <TouchableOpacity style={s.tag} key={t}><Text name="exploreTag">{t}</Text></TouchableOpacity>)}</View>
    </Animated.ScrollView>
  </View>;
}
const s = StyleSheet.create({ page: { flex: 1, backgroundColor: '#ffffff' }, content: { paddingHorizontal: theme.spacing.space20, paddingBottom: theme.spacing.space100 }, exploreHeader: { marginHorizontal: -theme.spacing.space20 }, compactHeaderSpacing: { marginBottom: -theme.spacing.space10 }, introSubtitle: { marginTop: theme.spacing.headingDescriptionGap }, search: { height: 51, borderRadius: 14, borderWidth: 1, borderColor: '#cdd8d3', backgroundColor: '#fff', flexDirection: 'row', alignItems: 'center', paddingHorizontal: theme.spacing.space15, marginTop: 0, marginBottom: theme.spacing.space27 }, searchIcon: { marginRight: theme.spacing.space8 }, section: { marginBottom: theme.spacing.space14, marginTop: theme.spacing.space4 }, trendingSubtitle: { marginTop: theme.spacing.headingDescriptionGap, marginBottom: theme.spacing.space16 }, browseHeading: { marginTop: betweenSectionsGap }, card: { height: 145, borderRadius: 18, overflow: 'hidden', marginBottom: theme.spacing.space14 }, image: { width: '100%', height: '100%' }, overlay: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: theme.spacing.space16, backgroundColor: 'rgba(14,43,36,.62)' }, placeCount: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.space6 }, tags: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.space9 }, tag: { backgroundColor: '#fff', borderRadius: 20, paddingHorizontal: theme.spacing.space15, paddingVertical: theme.spacing.space11 } });
