import { AppPressable as TouchableOpacity } from '@/components/element/touch-feedback';
import { useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { Text } from '@neup/components/ui/text';
import { BaseIcon } from '@/components/element/base-icon';
import theme from '@base/theme.json';

type SignInPromptCardProps = {
  title: string;
  description: string;
};

// Offer sign-in from pages whose account content requires an authenticated user.
export function SignInPromptCard({ title, description }: SignInPromptCardProps) {
  const router = useRouter();

  return <TouchableOpacity style={styles.card} activeOpacity={0.82} onPress={() => router.push('/auth')}>
    <View style={styles.icon}><BaseIcon name="secured" size={20} color="#35644d" /></View>
    <View style={styles.copy}>
      <Text name="title3" style={styles.title}>{title}</Text>
      <Text name="regular" style={styles.description}>{description}</Text>
    </View>
    <BaseIcon name="arrow-left" rotation={180} size={15} color="#82918a" />
  </TouchableOpacity>;
}

const styles = StyleSheet.create({
  card: { width: '100%', flexDirection: 'row', alignItems: 'center', gap: theme.spacing.space12, marginTop: theme.spacing.space12, padding: theme.spacing.space10, borderRadius: 18, borderWidth: 1, borderColor: '#d7e5d2', backgroundColor: '#f5f9f2' },
  icon: { width: 42, height: 42, alignItems: 'center', justifyContent: 'center', borderRadius: 14, backgroundColor: '#e4efdf' },
  copy: { flex: 1 },
  title: { color: '#173d35' },
  description: { color: '#62766d', fontSize: 13, lineHeight: 18, marginTop: theme.spacing.space3 },
});
