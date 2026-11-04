import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { Text } from '@neup/components/ui/text';

type MarkdownMessageProps = {
  content: string;
  fromUser: boolean;
};

type MarkdownBlock =
  | { kind: 'paragraph' | 'quote' | 'code' | 'heading'; text: string; level?: number }
  | { kind: 'list'; items: string[]; ordered: boolean }
  | { kind: 'table'; headers: string[]; rows: string[][]; alignments: Array<'left' | 'center' | 'right'> };

const inlinePattern = /(\*\*[^*]+\*\*|__[^_]+__|\*[^*]+\*|_[^_]+_|`[^`]+`|\[[^\]]+\]\([^)]+\))/g;

/* Parses inline emphasis, code, and links into native nested text nodes. */
function renderInlineMarkdown(content: string, fromUser: boolean): ReactNode[] {
  return content.split(inlinePattern).filter(Boolean).map((part, index) => {
    const link = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
    if (link) {
      return <Text key={index} style={styles.link} onPress={() => void WebBrowser.openBrowserAsync(link[2])}>{link[1]}</Text>;
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

/* Splits a Markdown table row into cells while preserving escaped pipes. */
function parseTableRow(line: string): string[] {
  const normalized = line.trim().replace(/^\|/, '').replace(/\|$/, '');
  return normalized.split(/(?<!\\)\|/).map((cell) => cell.replace(/\\\|/g, '|').trim());
}

/* Identifies a Markdown table alignment separator and its column alignment. */
function parseTableAlignments(line: string): Array<'left' | 'center' | 'right'> | null {
  const cells = parseTableRow(line);
  if (!cells.length || !cells.every((cell) => /^:?-{3,}:?$/.test(cell))) return null;
  return cells.map((cell) => cell.startsWith(':') && cell.endsWith(':')
    ? 'center'
    : cell.endsWith(':')
      ? 'right'
      : 'left');
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

    if (index + 1 < lines.length && line.includes('|')) {
      const alignments = parseTableAlignments(lines[index + 1].trim());
      if (alignments) {
        const headers = parseTableRow(line);
        const rows: string[][] = [];
        index += 2;
        while (index < lines.length && lines[index].trim().includes('|')) {
          rows.push(parseTableRow(lines[index]));
          index += 1;
        }
        blocks.push({ kind: 'table', headers, rows, alignments });
        continue;
      }
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
        if (block.kind === 'table') {
          const columnCount = Math.max(block.headers.length, ...block.rows.map((row) => row.length));
          const columnWidth = Math.max(112, Math.floor(280 / Math.max(columnCount, 1)));
          const renderRow = (cells: string[], rowIndex: string, header = false) => (
            <View key={rowIndex} style={[styles.tableRow, header && styles.tableHeader]}>
              {Array.from({ length: columnCount }, (_, columnIndex) => <View key={columnIndex} style={[styles.tableCell, { width: columnWidth }, header && styles.tableHeaderCell]}>
                <Text name="regular" style={[styles.tableText, header && styles.tableHeaderText, fromUser && styles.userText, { textAlign: block.alignments[columnIndex] ?? 'left' }]}>
                  {renderInlineMarkdown(cells[columnIndex] ?? '', fromUser)}
                </Text>
              </View>)}
            </View>
          );
          return <ScrollView key={index} horizontal showsHorizontalScrollIndicator nestedScrollEnabled style={styles.tableScroll}>
            <View style={styles.table}>
              {renderRow(block.headers, 'header', true)}
              {block.rows.map((row, rowIndex) => renderRow(row, `row-${rowIndex}`))}
            </View>
          </ScrollView>;
        }

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
  tableScroll: { alignSelf: 'stretch' },
  table: { overflow: 'hidden', borderRadius: 8, borderWidth: StyleSheet.hairlineWidth, borderColor: '#d9e3dc' },
  tableRow: { flexDirection: 'row', borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#d9e3dc' },
  tableHeader: { backgroundColor: '#edf2ee' },
  tableCell: { justifyContent: 'center', minHeight: 40, paddingHorizontal: 9, paddingVertical: 7, borderRightWidth: StyleSheet.hairlineWidth, borderRightColor: '#d9e3dc' },
  tableHeaderCell: { backgroundColor: '#edf2ee' },
  tableText: { color: '#173d35', fontSize: 13, lineHeight: 18 },
  tableHeaderText: { fontWeight: '700' },
});
