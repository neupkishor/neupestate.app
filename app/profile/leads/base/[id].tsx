import { useLocalSearchParams } from 'expo-router';
import { ProfileLeadDetail } from '@/components/element/profile-lead-detail';

export default function BaseLeadDetailPage() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <ProfileLeadDetail scope="base" id={String(id ?? '')} />;
}
