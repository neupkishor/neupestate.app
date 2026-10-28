import { StyleSheet, View } from 'react-native';
import { AppPressable as TouchableOpacity } from '@/components/element/touch-feedback';
import { Text } from '@neup/components/ui/text';
import { BaseIcon } from '@/components/element/base-icon';
import { useAppTheme } from '@/components/theme/AppThemeProvider';
import theme from '@base/theme.json';

export function PageHeader({ onBack, backLabel = 'Back', compact = false }: { title?: string; onBack?: () => void; description?: string; backLabel?: string; compact?: boolean }) {
  const { colors } = useAppTheme();
  return (
    <View style={[s.heading, compact && s.compactHeading]}>
      {onBack && <TouchableOpacity accessibilityRole="button" accessibilityLabel="Go back" onPress={onBack} style={s.backButton}>
        <BaseIcon name="arrow-left" size={18} color={colors.text} />
        <Text name="regular" style={[s.back, { color: colors.text }]}>{backLabel}</Text>
      </TouchableOpacity>}
    </View>
  );
}

const s = StyleSheet.create({
  heading: { paddingHorizontal: theme.spacing.space20, paddingTop: theme.spacing.space72, paddingBottom: theme.spacing.space8 },
  compactHeading: { paddingTop: theme.spacing.space12 },
  backButton: { alignSelf: 'flex-start', minHeight: 44, justifyContent: 'center', flexDirection: 'row', alignItems: 'center', gap: theme.spacing.space6 },
  back: {},
});
