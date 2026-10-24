import { NativeTabs } from 'expo-router/unstable-native-tabs';

export default function TabLayout() {
  return (
    <NativeTabs
      backgroundColor="#ffffff"
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
        <NativeTabs.Trigger.Icon
          sf={{ default: 'house', selected: 'house.fill' }}
          md={{ default: 'home', selected: 'home' }}
        />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="post">
        <NativeTabs.Trigger.Label>Post</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          sf={{ default: 'plus.circle', selected: 'plus.circle.fill' }}
          md={{ default: 'add_circle_outline', selected: 'add_circle' }}
        />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="assist">
        <NativeTabs.Trigger.Label>Nia</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          sf={{ default: 'questionmark.circle', selected: 'questionmark.circle.fill' }}
          md={{ default: 'support_agent', selected: 'support_agent' }}
        />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="explore">
        <NativeTabs.Trigger.Label>Explore</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          sf={{ default: 'magnifyingglass', selected: 'magnifyingglass.circle.fill' }}
          md={{ default: 'search', selected: 'search' }}
        />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="profile">
        <NativeTabs.Trigger.Label>Profile</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          sf={{ default: 'person', selected: 'person.fill' }}
          md={{ default: 'person_outline', selected: 'person' }}
        />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
