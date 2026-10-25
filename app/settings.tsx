import { AppPressable as TouchableOpacity } from '@/components/element/touch-feedback';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Text } from '@neup/components/ui/text';
import * as SecureStore from 'expo-secure-store';
import { useAppTheme, ThemePreference } from '@/components/theme/AppThemeProvider';
import { PageHeader } from '@/components/element/page-header';
import theme from '@base/theme.json';
const headingDescriptionGap = theme.spacing.headingDescriptionGap;

const themeOptions = ['Dark', 'Light', 'System'] as const;
const unitOptions = ['Aana system', 'Meter system', 'Feet system', 'Kattha system'] as const;

export default function Settings() {
  const router = useRouter();
  const { preference: theme, setPreference: setAppTheme, colors } = useAppTheme();
  const [unitPreference, setUnitPreference] = useState<(typeof unitOptions)[number]>('Aana system');

  useEffect(() => {
    void Promise.all([
      SecureStore.getItemAsync('settings.unitPreference'),
    ]).then(([savedUnit]) => {
      if (unitOptions.includes(savedUnit as (typeof unitOptions)[number])) setUnitPreference(savedUnit as (typeof unitOptions)[number]);
    }).catch((error) => console.warn('Unable to load settings:', error));
  }, []);

  const selectTheme = (value: (typeof themeOptions)[number]) => {
    setAppTheme(value as ThemePreference);
  };

  const selectUnit = (value: (typeof unitOptions)[number]) => {
    setUnitPreference(value);
    void SecureStore.setItemAsync('settings.unitPreference', value).catch((error) => console.warn('Unable to save unit preference:', error));
  };

  return (
    <View style={[styles.safe, { backgroundColor: colors.background }]}>
      <StatusBar style={theme === 'Dark' || (theme === 'System' && useAppThemeDark(colors)) ? 'light' : 'dark'} />
      <ScrollView contentContainerStyle={styles.content}>
        <PageHeader onBack={() => router.back()} />
        <Text name="title" color={colors.text} style={styles.title}>Settings</Text>
        <Text name="regular" style={[styles.description, { color: colors.muted }]}>Manage your account and app preferences.</Text>
        <View style={styles.preferences}>
        <View style={[styles.preferenceCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.preferenceHeader}>
            <Text name="title3" style={[styles.preferenceTitle, { color: colors.text }]}>Theme</Text>
            <Text name="caption" style={[styles.currentValue, { color: colors.muted }]}>{theme}</Text>
          </View>
          <View style={styles.options}>
            {themeOptions.map((option) => <PreferenceOption key={option} label={option} selected={theme === option} colors={colors} onPress={() => selectTheme(option)} />)}
          </View>
        </View>
        <View style={[styles.preferenceCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.preferenceHeader}>
            <Text name="title3" style={[styles.preferenceTitle, { color: colors.text }]}>Unit preferences</Text>
            <Text name="caption" style={[styles.currentValue, { color: colors.muted }]}>{unitPreference}</Text>
          </View>
          <View style={styles.options}>
            {unitOptions.map((option) => <PreferenceOption key={option} label={option} selected={unitPreference === option} colors={colors} onPress={() => selectUnit(option)} />)}
          </View>
        </View>
        </View>
      </ScrollView>
    </View>
  );
}

function PreferenceOption({ label, selected, colors, onPress }: { label: string; selected: boolean; colors: ReturnType<typeof useAppTheme>['colors']; onPress: () => void }) {
  return (
    <TouchableOpacity
      style={[styles.option, { backgroundColor: colors.background, borderColor: colors.border }, selected && { backgroundColor: colors.subtle, borderColor: colors.accent }]}
      activeOpacity={0.75}
      onPress={onPress}
      accessibilityRole="radio"
      accessibilityState={{ selected }}
    >
      <Text style={[styles.radio, { color: selected ? colors.accent : colors.muted }]}>{selected ? '●' : '○'}</Text>
      <Text name="regular" style={[styles.optionText, { color: selected ? colors.text : colors.muted }, selected && styles.selectedOptionText]}>{label}</Text>
    </TouchableOpacity>
  );
}

function useAppThemeDark(colors: ReturnType<typeof useAppTheme>['colors']) {
  return colors.background === '#101815';
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: { paddingBottom: theme.spacing.space35 },
  title: { marginHorizontal: theme.spacing.space20 },
  description: { color: '#71817b', marginHorizontal: theme.spacing.space20, marginTop: headingDescriptionGap },
  preferences: { marginHorizontal: theme.spacing.space20 },
  preferenceCard: { marginTop: theme.spacing.space20, padding: theme.spacing.space16, backgroundColor: '#fff', borderRadius: 16, borderWidth: 1, borderColor: '#e3ebe6' },
  preferenceHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: theme.spacing.space14 },
  preferenceTitle: { color: '#173d35' },
  currentValue: { color: '#71817b', textTransform: 'capitalize' },
  options: { gap: theme.spacing.space8 },
  option: { minHeight: 44, paddingHorizontal: theme.spacing.space12, flexDirection: 'row', alignItems: 'center', gap: theme.spacing.space10, borderWidth: 1, borderRadius: 11 },
  radio: { fontSize: 17 },
  optionText: {},
  selectedOptionText: { fontWeight: '700' },
});
