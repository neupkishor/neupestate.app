import { StyleSheet, View } from 'react-native';
import { AppPressable as TouchableOpacity } from '@/components/element/touch-feedback';
import { Text } from '@neup/components/ui/text';
import { useAppTheme } from '@/components/theme/AppThemeProvider';
import theme from '@base/theme.json';

export function PageHeader({ onBack, backLabel = 'Back' }: { title?: string; onBack?: () => void; description?: string; backLabel?: string }) {
  const { colors } = useAppTheme();
  return (
    <View style={s.heading}>
      {onBack && <TouchableOpacity accessibilityRole="button" accessibilityLabel="Go back" onPress={onBack} style={s.backButton}>
        <Text name="regular" style={[s.back, { color: colors.text }]}>‹ {backLabel}</Text>
      </TouchableOpacity>}
    </View>
  );
}

const s = StyleSheet.create({
  heading: { paddingHorizontal: theme.spacing.space20, paddingTop: theme.spacing.space72, paddingBottom: theme.spacing.space8 },
  backButton: { alignSelf: 'flex-start', minHeight: 44, justifyContent: 'center' },
  back: {},
});
