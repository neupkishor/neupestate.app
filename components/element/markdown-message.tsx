import type { ReactNode } from 'react';
import { Linking, StyleSheet, View } from 'react-native';
import { Text } from '@neup/components/ui/text';

type MarkdownMessageProps = {
  content: string;
  fromUser: boolean;
};

type MarkdownBlock =
  | { kind: 'paragraph' | 'quote' | 'code' | 'heading'; text: string; level?: number }
  | { kind: 'list'; items: string[]; ordered: boolean };

const inlinePattern = /(\*\*[^*]+\*\*|__[^_]+__|\*[^*]+\*|_[^_]+_|`[^`]+`|\[[^\]]+\]\([^)]+\))/g;

/* Parses inline emphasis, code, and links into native nested text nodes. */
function renderInlineMarkdown(content: string, fromUser: boolean): ReactNode[] {
  return content.split(inlinePattern).filter(Boolean).map((part, index) => {
    const link = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
    if (link) {
      return <Text key={index} style={styles.link} onPress={() => void Linking.openURL(link[2])}>{link[1]}</Text>;
    }
    if ((part.startsWith('**') && part.endsWith('**')) || (part.startsWith('__') && part.endsWith('__'))) {
      return <Text key={index} style={styles.strong}>{part.slice(2, -2)}</Text>;
    }
    if ((part.startsWith('*') && part.endsWith('*')) || (part.startsWith('_') && part.endsWith('_'))) {
      return <Text key={index} style={styles.italic}>{part.slice(1, -1)}</Text>;
    }
    if (part.startsWith('`') && part.endsWith('`')) {
      return <Text key={index} style={[styles.inlineCode, fromUser && styles.userInlineCode]}>{part.slice(1, -1)}</Text>;
    }
    return part;
  });
}

/* Groups Markdown source lines into displayable block elements. */
function parseMarkdownBlocks(content: string): MarkdownBlock[] {
  const lines = content.replace(/\r\n?/g, '\n').split('\n');
  const blocks: MarkdownBlock[] = [];
  let index = 0;

  while (index < lines.length) {
    const line = lines[index].trim();
    if (!line) { index += 1; continue; }

    if (line.startsWith('```') || line.startsWith('~~~')) {
      const fence = line.slice(0, 3);
      const codeLines: string[] = [];
      index += 1;
      while (index < lines.length && !lines[index].trim().startsWith(fence)) codeLines.push(lines[index++]);
      if (index < lines.length) index += 1;
      blocks.push({ kind: 'code', text: codeLines.join('\n') });
      continue;
    }

    const heading = line.match(/^(#{1,6})\s+(.+)$/);
    if (heading) {
      blocks.push({ kind: 'heading', text: heading[2], level: heading[1].length });
      index += 1;
      continue;
    }

    if (/^>\s?/.test(line)) {
      const quoteLines: string[] = [];
      while (index < lines.length && /^\s*>/.test(lines[index])) quoteLines.push(lines[index++].replace(/^\s*>\s?/, ''));
      blocks.push({ kind: 'quote', text: quoteLines.join('\n') });
      continue;
    }

    const listItem = line.match(/^([-*+]\s+|\d+[.)]\s+)(.+)$/);
    if (listItem) {
      const ordered = /^\d/.test(listItem[1]);
      const items: string[] = [];
      while (index < lines.length) {
        const next = lines[index].trim().match(/^([-*+]\s+|\d+[.)]\s+)(.+)$/);
        if (!next || /^\d/.test(next[1]) !== ordered) break;
        items.push(next[2]);
        index += 1;
      }
      blocks.push({ kind: 'list', items, ordered });
      continue;
    }

    const paragraphLines = [line];
    index += 1;
    while (index < lines.length && lines[index].trim() && !/^(#{1,6}\s|```|~~~|>\s?|[-*+]\s+|\d+[.)]\s+)/.test(lines[index].trim())) {
      paragraphLines.push(lines[index].trim());
      index += 1;
    }
    blocks.push({ kind: 'paragraph', text: paragraphLines.join('\n') });
  }
  return blocks;
}

/* Renders Markdown text using React Native text and view components. */
export function MarkdownMessage({ content, fromUser }: MarkdownMessageProps) {
  const blocks = parseMarkdownBlocks(content);
  return (
    <View style={styles.container}>
      {blocks.map((block, index) => {
        if (block.kind === 'list') {
          return <View key={index} style={styles.list}>
            {block.items.map((item, itemIndex) => <Text key={itemIndex} name="regular" style={[styles.text, fromUser && styles.userText]}>
              <Text style={[styles.listMarker, fromUser && styles.userText]}>{block.ordered ? `${itemIndex + 1}. ` : '• '}</Text>
              {renderInlineMarkdown(item, fromUser)}
            </Text>)}
          </View>;
        }

        const style = block.kind === 'code'
          ? [styles.codeBlock, fromUser && styles.userCodeBlock]
          : block.kind === 'quote'
            ? [styles.quote, fromUser && styles.userQuote]
            : block.kind === 'heading'
              ? [styles.heading, block.level === 1 && styles.headingOne, fromUser && styles.userText]
              : [styles.text, fromUser && styles.userText];

        return <Text key={index} name="regular" style={style}>
          {block.kind === 'code' ? block.text : renderInlineMarkdown(block.text, fromUser)}
        </Text>;
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 8 },
  text: { color: '#173d35', lineHeight: 22 },
  userText: { color: '#fff' },
  strong: { fontWeight: '700' },
  italic: { fontStyle: 'italic' },
  link: { color: '#3478c5', textDecorationLine: 'underline' },
  inlineCode: { fontFamily: 'monospace', backgroundColor: '#e8eeea', color: '#173d35' },
  userInlineCode: { color: '#173d35' },
  heading: { color: '#173d35', fontWeight: '700', fontSize: 17, lineHeight: 23 },
  headingOne: { fontSize: 20, lineHeight: 27 },
  list: { gap: 5, paddingLeft: 2 },
  listMarker: { fontWeight: '700' },
  quote: { color: '#52665e', borderLeftWidth: 3, borderLeftColor: '#93a99a', paddingLeft: 10, fontStyle: 'italic' },
  userQuote: { color: '#e4eee7', borderLeftColor: '#c7d8cc' },
  codeBlock: { fontFamily: 'monospace', fontSize: 13, lineHeight: 19, color: '#173d35', backgroundColor: '#edf1ee', borderRadius: 8, padding: 10 },
  userCodeBlock: { color: '#173d35', backgroundColor: '#dce5df' },
});
