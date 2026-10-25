import { StyleSheet, View } from 'react-native';
import theme from '@base/theme.json';

export function PropertyCardSkeleton() {
  return (
    <View style={styles.card} accessibilityLabel="Loading property">
      <View style={styles.image} />
      <View style={styles.content}>
        <View style={[styles.line, styles.price]} />
        <View style={[styles.line, styles.title]} />
        <View style={[styles.line, styles.titleShort]} />
        <View style={[styles.line, styles.location]} />
        <View style={[styles.line, styles.meta]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 18,
    overflow: 'hidden',
    marginBottom: theme.spacing.space18,
  },
  image: {
    width: '100%',
    height: 190,
    backgroundColor: '#e8edeb',
  },
  content: {
    padding: theme.spacing.space15,
  },
  line: {
    borderRadius: 5,
    backgroundColor: '#e8edeb',
  },
  price: {
    width: '34%',
    height: 20,
    marginBottom: theme.spacing.space12,
  },
  title: {
    width: '92%',
    height: 15,
    marginBottom: theme.spacing.space8,
  },
  titleShort: {
    width: '68%',
    height: 15,
    marginBottom: theme.spacing.space13,
  },
  location: {
    width: '48%',
    height: 12,
    marginBottom: theme.spacing.space10,
  },
  meta: {
    width: '62%',
    height: 11,
  },
});

