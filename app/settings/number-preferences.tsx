import { PageHeader } from '@/components/element/page-header';
import { useAppTheme } from '@/components/theme/AppThemeProvider';
import { formatNumber as formatGroupedNumber, type NumberingSystem } from '@neup/numbering-system';
import theme from '@base/theme.json';
import { Text } from '@neup/components/ui/text';
import { useRouter } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { AppPressable as TouchableOpacity } from '@/components/element/touch-feedback';
import { useNumberingSystem } from '@/components/numbering/NumberingSystemProvider';

const numberingSystems: NumberingSystem[] = [
  'Indian', 'Nepali',
  'Indian.readable', 'Nepali.readable',
  'Indian.readable2', 'Nepali.readable2',
  'Indian.readable.devanagari', 'Nepali.readable.devanagari',
  'Chinese', 'Japanese', 'Korean', 'France', 'Germany', 'Switzerland', 'International',
];
const sampleNumber = 123456789;

/** Selects a sample that makes each readable style easy to compare. */
function sampleForSystem(system: NumberingSystem): number {
  if (system.endsWith('.readable.devanagari')) return 1510250;
  if (system.endsWith('.readable2')) return 1020240;
  if (system.endsWith('.readable')) return 1520321;
  return sampleNumber;
}

/** Lets the user choose and save their preferred number grouping style. */
export default function NumberPreferences() {
  const router = useRouter();
  const { colors } = useAppTheme();
  const { numberingSystem: selectedSystem, setNumberingSystem } = useNumberingSystem();

  /** Saves the selected numbering system for future app sessions. */
  const selectSystem = (system: NumberingSystem) => {
    setNumberingSystem(system);
  };

  return (
    <View style={[styles.page, { backgroundColor: colors.background }]}>
      <StatusBar style={colors.background === '#101815' ? 'light' : 'dark'} />
      <ScrollView contentContainerStyle={styles.content}>
        <PageHeader onBack={() => router.back()} />
        <Text name="title" style={[styles.title, { color: colors.text }]}>Number preferences</Text>
        <Text name="regular" style={[styles.description, { color: colors.muted }]}>Choose a numbering system for displaying numbers.</Text>
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text name="title3" style={[styles.sectionTitle, { color: colors.text }]}>Number formatting</Text>
          <View style={styles.options}>
            {numberingSystems.map((system) => (
              <TouchableOpacity
                key={system}
                style={[styles.option, { backgroundColor: colors.background, borderColor: colors.border }, selectedSystem === system && { backgroundColor: colors.subtle, borderColor: colors.accent }]}
                activeOpacity={0.75}
                onPress={() => selectSystem(system)}
                accessibilityRole="radio"
                accessibilityState={{ selected: selectedSystem === system }}
              >
                <View style={styles.optionCopy}>
                  <Text name="regular" style={{ color: selectedSystem === system ? colors.text : colors.muted }}>{system}</Text>
                  <Text name="caption" style={{ color: colors.muted }}>{formatNumber(sampleForSystem(system), system)}</Text>
                </View>
                <Text style={{ color: selectedSystem === system ? colors.accent : colors.muted }}>{selectedSystem === system ? '●' : '○'}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

/** Formats a number preview using the selected grouping convention. */
function formatNumber(value: number, system: NumberingSystem): string {
  return formatGroupedNumber(value, system);
}

const styles = StyleSheet.create({
  page: { flex: 1 },
  content: { paddingBottom: theme.spacing.space35 },
  title: { marginHorizontal: theme.spacing.space20 },
  description: { marginHorizontal: theme.spacing.space20, marginTop: theme.spacing.headingDescriptionGap },
  card: { marginHorizontal: theme.spacing.space20, marginTop: theme.spacing.space20, padding: theme.spacing.space16, borderRadius: 16, borderWidth: 1 },
  sectionTitle: { marginBottom: theme.spacing.space14 },
  options: { gap: theme.spacing.space8 },
  option: { minHeight: 52, paddingHorizontal: theme.spacing.space12, paddingVertical: theme.spacing.space8, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderRadius: 11 },
  optionCopy: { gap: theme.spacing.space2 },
});
