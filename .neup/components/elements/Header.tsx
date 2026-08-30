import { View, type ViewProps } from 'react-native';

export function Header({ style, ...props }: ViewProps) {
  return (
    <View
      {...props}
      style={[
        {
          boxShadow: '0px 8px 18px -3px rgba(23, 61, 53, 0.38)',
          elevation: 8,
          shadowColor: '#173d35',
          shadowOffset: { width: 0, height: 5 },
          shadowOpacity: 0.24,
          shadowRadius: 10,
        },
        style,
      ]}
    />
  );
}
