import { StyleSheet, View } from 'react-native';
import theme from '@base/theme.json';

export function PropertyCardSkeleton() {
  return (
    <View style={styles.card} accessibilityLabel="Loading property">
      <View style={styles.imageContainer}>
        <View style={styles.image} />
        <View style={styles.saveButtonSkeleton} />
      </View>
      <View style={styles.content}>
        <View style={[styles.line, styles.title]} />
        <View style={[styles.line, styles.titleShort]} />
        <View style={[styles.line, styles.summary]} />
        <View style={[styles.line, styles.price]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: theme.spacing.space32,
  },
  imageContainer: {
    position: 'relative',
    borderRadius: 16,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: 190,
    backgroundColor: '#e8eee9',
  },
  saveButtonSkeleton: {
    position: 'absolute',
    top: theme.spacing.space10,
    right: theme.spacing.space10,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.94)',
  },
  content: {
    marginTop: theme.spacing.space12,
  },
  line: {
    borderRadius: 5,
    backgroundColor: '#e8edeb',
  },
  title: {
    width: '94%',
    height: 14,
    marginBottom: theme.spacing.space8,
  },
  titleShort: {
    width: '72%',
    height: 14,
    marginBottom: theme.spacing.space8,
  },
  summary: {
    width: '80%',
    height: 12,
    marginBottom: theme.spacing.space8,
  },
  price: {
    width: '38%',
    height: 18,
    marginTop: theme.spacing.space2,
  },
});

