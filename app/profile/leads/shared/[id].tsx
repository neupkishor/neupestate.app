import { useLocalSearchParams } from 'expo-router';
import { ProfileLeadDetail } from '@/components/element/profile-lead-detail';

export default function SharedLeadDetailPage() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <ProfileLeadDetail scope="shared" id={String(id ?? '')} />;
}
