import { NativeTabs } from 'expo-router/unstable-native-tabs';
import { useAppTheme } from '@/components/theme/AppThemeProvider';
import { BaseIcon } from '@/components/element/base-icon';

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
        <NativeTabs.Trigger.Icon src={{ default: <BaseIcon name="home" size={24} color="#52635d" />, selected: <BaseIcon name="home" size={24} color="#173d35" /> }} />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="post">
        <NativeTabs.Trigger.Label>Post</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon src={{ default: <BaseIcon name="add" size={24} color="#52635d" />, selected: <BaseIcon name="add" size={24} color="#173d35" /> }} />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="assist">
        <NativeTabs.Trigger.Label>Nia</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon src={{ default: <BaseIcon name="comments" size={24} color="#52635d" />, selected: <BaseIcon name="comments" size={24} color="#173d35" /> }} />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="explore">
        <NativeTabs.Trigger.Label>Explore</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon src={{ default: <BaseIcon name="search" size={24} color="#52635d" />, selected: <BaseIcon name="search" size={24} color="#173d35" /> }} />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="profile">
        <NativeTabs.Trigger.Label>Profile</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon src={{ default: <BaseIcon name="user" size={24} color="#52635d" />, selected: <BaseIcon name="user" size={24} color="#173d35" /> }} />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
