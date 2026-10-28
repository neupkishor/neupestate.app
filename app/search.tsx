import { AppPressable as TouchableOpacity } from '@/components/element/touch-feedback';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Image, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { Input } from '@neup/components/ui/input';
import { Text } from '@neup/components/ui/text';
import { useRouter } from 'expo-router';
import logica from '@neup/logica';
import { recordActivity } from '@neup/core/database/estate';
import { PageHeader } from '@/components/element/page-header';
import { PROPERTY_REPRESENTATIVES_INCLUDE } from '@/components/element/property-list-includes';
import theme from '@base/theme.json';
const headingDescriptionGap = theme.spacing.headingDescriptionGap;

function imageUri(value: unknown): string {
  if (typeof value === 'string') return value;
  if (!value || typeof value !== 'object') return '';
  const image = value as { uri?: unknown; url?: unknown; src?: unknown };
  return imageUri(image.uri ?? image.url ?? image.src);
}

function propertyImage(item: any) {
  return imageUri(Array.isArray(item.images) ? item.images[0] : item.image);
}

export default function Search() {
  const router = useRouter();
  const [term, setTerm] = useState('');
  const [submitted, setSubmitted] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const query = submitted.trim();
    if (!query) { setResults([]); return; }
    recordActivity('search.make', query);
    setLoading(true);
    void logica.estate.property.search({ search: query, limit: 15, include: PROPERTY_REPRESENTATIVES_INCLUDE })
      .then((response) => setResults(response.ok && Array.isArray(response.body?.properties) ? response.body.properties : []))
      .catch(() => setResults([]))
      .finally(() => setLoading(false));
  }, [submitted]);

  return <View style={styles.page}>
    <PageHeader onBack={() => router.back()} backLabel="Back" />
    <Text name="title" style={{ marginHorizontal: theme.spacing.space20 }}>Search properties</Text>
    <Text name="regular" style={{ marginHorizontal: theme.spacing.space20, marginTop: headingDescriptionGap, color: '#71817b' }}>Find a home that fits what you need.</Text>
    <Input autoFocus value={term} onChangeText={setTerm} onSubmitEditing={() => setSubmitted(term)} placeholder="City, neighborhood, or ZIP" placeholderTextColor="#9aa6a2" style={styles.search} returnKeyType="search" postIcon={<Text name="title3" style={styles.searchIcon}>⌕</Text>} postAction={() => setSubmitted(term)} />
    {loading && <ActivityIndicator color="#557d54" style={styles.status} />}
    {!loading && submitted && <Text name="caption" style={styles.resultLabel}>{results.length} result{results.length === 1 ? '' : 's'} for “{submitted}”</Text>}
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}><ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">{results.map((item) => <TouchableOpacity key={String(item.id)} style={styles.card} onPress={() => router.push(`/property/${item.id}`)}>{propertyImage(item) ? <Image source={{ uri: propertyImage(item) }} style={styles.image} /> : <View style={[styles.image, styles.placeholder]} />}<View style={styles.info}><Text name="title2">{item.pricing?.raw || (item.price != null ? `NPR ${item.price}` : 'Price on request')}</Text><Text name="title2" color="#27413a" style={styles.name}>{item.title || item.description || 'Property listing'}</Text></View></TouchableOpacity>)}</ScrollView></KeyboardAvoidingView>
  </View>;
}

const styles = StyleSheet.create({ page: { flex: 1, backgroundColor: '#ffffff' }, search: { marginHorizontal: theme.spacing.space20, marginTop: theme.spacing.space20, marginBottom: theme.spacing.space20, height: 52, borderRadius: 14 }, searchIcon: { color: '#557d54', fontSize: 25 }, resultLabel: { color: '#71817b', marginHorizontal: theme.spacing.space20, marginBottom: theme.spacing.space4 }, status: { marginTop: theme.spacing.space10 }, content: { padding: theme.spacing.space20, paddingTop: theme.spacing.space72, paddingBottom: theme.spacing.space35 }, card: { backgroundColor: '#fff', borderRadius: 16, overflow: 'hidden', marginBottom: theme.spacing.space14, flexDirection: 'row', padding: theme.spacing.space10 }, image: { width: 110, height: 110, borderRadius: 11 }, placeholder: { backgroundColor: '#dfe7e3' }, info: { flex: 1, padding: theme.spacing.space12 }, name: { marginTop: theme.spacing.space7 } });
