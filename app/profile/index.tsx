import { StatusBar } from 'expo-status-bar';
import { Linking, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useEffect } from 'react';
import { AUTH_CALLBACK_URL, AUTH_START_URL, useAuthSession } from '#/core/auth-session';

export default function Profile() {
  const { authenticated, loading } = useAuthSession();
  useEffect(() => {
    if (!loading && !authenticated) void Linking.openURL(`${AUTH_START_URL}?redirectsTo=${encodeURIComponent(AUTH_CALLBACK_URL)}`);
  }, [loading, authenticated]);
  if (loading) return <View style={s.center}><StatusBar style="dark" /><Text style={s.message}>Checking your account…</Text></View>;
  if (!authenticated) return <View style={s.center}><StatusBar style="dark" /><Text style={s.eyebrow}>YOUR ACCOUNT</Text><Text style={s.title}>Sign in to continue</Text><Text style={s.subtitle}>Sign in to view your profile, save homes, and keep track of your activity.</Text><TouchableOpacity style={s.signIn} onPress={() => void Linking.openURL(`${AUTH_START_URL}?redirectsTo=${encodeURIComponent(AUTH_CALLBACK_URL)}`)}><Text style={s.signInText}>Sign in</Text></TouchableOpacity></View>;
  return <View style={s.center}><StatusBar style="dark" /><Text style={s.title}>Profile</Text><Text style={s.subtitle}>Your profile details will appear here.</Text></View>;
}

const s = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#f6f7f9', padding: 28 },
  eyebrow: { color: '#78908a', fontSize: 11, fontWeight: '700', letterSpacing: 1.5, marginBottom: 9 },
  title: { color: '#173d35', fontSize: 27, fontWeight: '800', textAlign: 'center' },
  subtitle: { color: '#70817c', fontSize: 14, lineHeight: 21, marginTop: 10, maxWidth: 300, textAlign: 'center' },
  message: { color: '#70817c', fontSize: 14 },
  signIn: { backgroundColor: '#173d35', borderRadius: 22, marginTop: 24, paddingHorizontal: 32, paddingVertical: 12 },
  signInText: { color: '#d8f36a', fontSize: 14, fontWeight: '800' },
});
