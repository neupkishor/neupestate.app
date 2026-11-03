import { NativeTabs } from 'expo-router/native-tabs';
import { useAppTheme } from '@/components/theme/AppThemeProvider';

export default function TabLayout() {
  const { colors } = useAppTheme();
  return (
    <NativeTabs
      backgroundColor={colors.navigation}
      iconColor={{ default: '#52635d', selected: '#173d35' }}
      rippleColor="#173d3526"
      indicatorColor="#d8e6d1"
      labelVisibilityMode="labeled"
      labelStyle={{
        default: {
          color: '#70817c',
          fontFamily: 'outfit.medium.ttf',
          fontSize: 13,
        },
        selected: {
          color: '#173d35',
          fontFamily: 'outfit.medium.ttf',
          fontSize: 13,
        },
      }}
    >
      <NativeTabs.Trigger name="home">
        <NativeTabs.Trigger.Label>Home</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf={{ default: 'house', selected: 'house.fill' }} md="home" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="post">
        <NativeTabs.Trigger.Label>Post</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf={{ default: 'plus', selected: 'plus.circle.fill' }} md="add_circle" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="assist">
        <NativeTabs.Trigger.Label>Nia</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf={{ default: 'bubble.left.and.bubble.right', selected: 'bubble.left.and.bubble.right.fill' }} md="forum" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="explore">
        <NativeTabs.Trigger.Label>Explore</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="magnifyingglass" md="search" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="profile">
        <NativeTabs.Trigger.Label>Profile</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf={{ default: 'person.crop.circle', selected: 'person.crop.circle.fill' }} md="person" />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
