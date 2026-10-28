import { AppPressable as TouchableOpacity } from '@/components/element/touch-feedback';
import { Image, ScrollView, StyleSheet, View } from 'react-native';
import { Text } from '@neup/components/ui/text';
import { useRouter } from 'expo-router';
import { PageHeader } from '@/components/element/page-header';
import { LocationIcon } from '@/components/element/location-icon';
import { BaseIcon } from '@/components/element/base-icon';
import theme from '@base/theme.json';
const headingDescriptionGap = theme.spacing.headingDescriptionGap;

const data = {
  recents: { title: 'Recently viewed', subtitle: 'Homes you’ve looked at lately', items: [['A quiet modern retreat in the heart of the city.', 'Austin, Texas', '$1,240,000', 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=700&q=85'], ['Sunlight, space, and room to make it yours.', 'Scottsdale, Arizona', '$895,000', 'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?w=700&q=85']] },
  saved: { title: 'Saved homes', subtitle: 'Your shortlist, all in one place', items: [['A warm, thoughtful home made for slow mornings.', 'Nashville, Tennessee', '$760,000', 'https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?w=700&q=85'], ['A quiet modern retreat in the heart of the city.', 'Austin, Texas', '$1,240,000', 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=700&q=85']] },
  visits: { title: 'Your visits', subtitle: 'Upcoming and past property tours', items: [['1801 Vista Lane', 'Tomorrow · 10:30 AM', 'Confirmed', 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=700&q=85'], ['Maple Street bungalow', 'Aug 24 · 2:00 PM', 'Completed', 'https://images.unsplash.com/photo-1494526585095-c41746248156?w=700&q=85']] },
};

export default function ProfileList({ type }: { type: keyof typeof data }) {
  const router = useRouter(); const page = data[type];
  return <View style={s.page}><ScrollView contentContainerStyle={s.content}><PageHeader onBack={() => router.back()} /><Text name="title" style={s.title}>{page.title}</Text><Text name="regular" style={s.subtitle}>{page.subtitle}</Text>{page.items.map((item) => <TouchableOpacity key={item[0]} style={s.card}><Image source={{ uri: item[3] }} style={s.image} /><View style={s.info}><Text name="title2" color="#27413a" style={s.itemTitle}>{item[0]}</Text><View style={s.locationRow}><LocationIcon /><Text name="caption" style={s.location}>{item[1]}</Text></View><Text name="title2" style={[s.value, type === 'visits' && s.confirmed]}>{item[2]}</Text></View><BaseIcon name="arrow-left" rotation={180} size={15} color="#9aa6a2" style={s.chevron} /></TouchableOpacity>)}{page.items.length === 0 && <Text name="regular" style={s.empty}>Nothing here yet.</Text>}</ScrollView></View>;
}

const s = StyleSheet.create({ page: { flex: 1, backgroundColor: '#ffffff' }, title: { marginHorizontal: theme.spacing.space20, color: '#173d35' }, subtitle: { marginHorizontal: theme.spacing.space20, color: '#71817b', marginTop: headingDescriptionGap }, content: { paddingBottom: theme.spacing.space35 }, card: { backgroundColor: '#fff', borderRadius: 16, marginHorizontal: theme.spacing.space20, marginTop: theme.spacing.space20, overflow: 'hidden', flexDirection: 'row', alignItems: 'center', padding: theme.spacing.space10 }, image: { width: 110, height: 110, borderRadius: 11 }, info: { flex: 1, padding: theme.spacing.space12 }, itemTitle: { color: '#27413a' }, locationRow: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.space4, marginTop: theme.spacing.space7 }, location: { color: '#87958f', flex: 1 }, value: { color: '#173d35', marginTop: theme.spacing.space9 }, confirmed: { color: '#557d54' }, chevron: { marginRight: theme.spacing.space3 }, empty: { color: '#87958f', textAlign: 'center', marginTop: theme.spacing.space60 } });
