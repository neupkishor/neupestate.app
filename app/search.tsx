import { useEffect, useState } from 'react';
import { ActivityIndicator, Image, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { listEstateProperties } from '#/logica/estate/property/list';

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
    setLoading(true);
    void listEstateProperties({ query, limit: 50 })
      .then((response) => setResults(response.ok && Array.isArray(response.body?.properties) ? response.body.properties : []))
      .catch(() => setResults([]))
      .finally(() => setLoading(false));
  }, [submitted]);

  return <View style={styles.page}>
    <View style={styles.header}><TouchableOpacity onPress={() => router.back()}><Text style={styles.back}>‹</Text></TouchableOpacity><Text style={styles.title}>Search properties</Text></View>
    <View style={styles.search}><TextInput autoFocus value={term} onChangeText={setTerm} onSubmitEditing={() => setSubmitted(term)} placeholder="City, neighborhood, or ZIP" placeholderTextColor="#9aa6a2" style={styles.input} returnKeyType="search" /><TouchableOpacity onPress={() => setSubmitted(term)}><Text style={styles.button}>Search</Text></TouchableOpacity></View>
    {loading && <ActivityIndicator color="#557d54" style={styles.status} />}
    {!loading && submitted && <Text style={styles.resultLabel}>{results.length} result{results.length === 1 ? '' : 's'} for “{submitted}”</Text>}
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}><ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">{results.map((item) => <TouchableOpacity key={String(item.id)} style={styles.card} onPress={() => router.push(`/property/${item.id}`)}>{propertyImage(item) ? <Image source={{ uri: propertyImage(item) }} style={styles.image} /> : <View style={[styles.image, styles.placeholder]} />}<View style={styles.info}><Text style={styles.price}>{item.pricing?.raw || (item.price != null ? `NPR ${item.price}` : 'Price on request')}</Text><Text style={styles.name}>{item.title || item.description || 'Property listing'}</Text></View></TouchableOpacity>)}</ScrollView></KeyboardAvoidingView>
  </View>;
}

const styles = StyleSheet.create({ page: { flex: 1, backgroundColor: '#f6f7f9' }, header: { height: 100, paddingTop: 42, paddingHorizontal: 20, backgroundColor: '#fff', flexDirection: 'row', alignItems: 'center', gap: 14, elevation: 12, shadowColor: '#173d35', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.24, shadowRadius: 12, zIndex: 10 }, back: { color: '#173d35', fontSize: 35 }, title: { color: '#173d35', fontSize: 19, fontWeight: '800' }, search: { margin: 20, height: 52, borderRadius: 14, backgroundColor: '#fff', flexDirection: 'row', alignItems: 'center', paddingLeft: 15, paddingRight: 10 }, input: { flex: 1, color: '#173d35', fontSize: 14 }, button: { color: '#557d54', fontWeight: '800', padding: 10 }, resultLabel: { color: '#71817b', fontSize: 13, marginHorizontal: 20, marginBottom: 4 }, status: { marginTop: 10 }, content: { padding: 20, paddingTop: 4, paddingBottom: 35 }, card: { backgroundColor: '#fff', borderRadius: 16, overflow: 'hidden', marginBottom: 14, flexDirection: 'row', padding: 10 }, image: { width: 110, height: 110, borderRadius: 11 }, placeholder: { backgroundColor: '#dfe7e3' }, info: { flex: 1, padding: 12 }, price: { color: '#173d35', fontSize: 16, fontWeight: '800' }, name: { color: '#27413a', fontSize: 13, lineHeight: 19, marginTop: 7 } });
