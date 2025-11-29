import React from 'react';
import { Text, View, StyleSheet } from 'react-native';
import { theme } from '../theme';

interface FormattedMessageProps {
  text: string;
  isUser: boolean;
}

const FormattedMessage: React.FC<FormattedMessageProps> = ({ text, isUser }) => {
  // Simple markdown parsing for common elements
  const parseMarkdown = (text: string) => {
    const lines = text.split('\n');
    const elements: React.ReactNode[] = [];
    
    lines.forEach((line, lineIndex) => {
      if (line.trim() === '') {
        elements.push(<View key={`space-${lineIndex}`} style={styles.lineBreak} />);
        return;
      }

      // Headers (# ## ###)
      if (line.startsWith('###')) {
        elements.push(
          <Text key={lineIndex} style={[styles.header3, isUser && styles.userText]}>
            {line.replace(/^###\s*/, '')}
          </Text>
        );
      } else if (line.startsWith('##')) {
        elements.push(
          <Text key={lineIndex} style={[styles.header2, isUser && styles.userText]}>
            {line.replace(/^##\s*/, '')}
          </Text>
        );
      } else if (line.startsWith('#')) {
        elements.push(
          <Text key={lineIndex} style={[styles.header1, isUser && styles.userText]}>
            {line.replace(/^#\s*/, '')}
          </Text>
        );
      }
      // Bullet points
      else if (line.startsWith('-') || line.startsWith('•')) {
        elements.push(
          <View key={lineIndex} style={styles.bulletContainer}>
            <Text style={[styles.bullet, isUser && styles.userText]}>•</Text>
            <Text style={[styles.bulletText, isUser && styles.userText]}>
              {parseInlineMarkdown(line.replace(/^[-•]\s*/, ''))}
            </Text>
          </View>
        );
      }
      // Numbered lists
      else if (/^\d+\./.test(line)) {
        elements.push(
          <View key={lineIndex} style={styles.bulletContainer}>
            <Text style={[styles.bullet, isUser && styles.userText]}>
              {line.match(/^\d+\./)?.[0]} 
            </Text>
            <Text style={[styles.bulletText, isUser && styles.userText]}>
              {parseInlineMarkdown(line.replace(/^\d+\.\s*/, ''))}
            </Text>
          </View>
        );
      }
      // Regular paragraphs
      else {
        elements.push(
          <Text key={lineIndex} style={[styles.paragraph, isUser && styles.userText]}>
            {parseInlineMarkdown(line)}
          </Text>
        );
      }
    });

    return elements;
  };

  // Parse inline markdown (bold, italic)
  const parseInlineMarkdown = (text: string) => {
    const parts = [];
    let remainingText = text;
    let key = 0;

    while (remainingText.length > 0) {
      // Bold text **text**
      const boldMatch = remainingText.match(/\*\*(.*?)\*\*/);
      if (boldMatch) {
        const beforeBold = remainingText.substring(0, boldMatch.index);
        if (beforeBold) {
          parts.push(<Text key={key++}>{beforeBold}</Text>);
        }
        parts.push(
          <Text key={key++} style={styles.bold}>
            {boldMatch[1]}
          </Text>
        );
        remainingText = remainingText.substring(boldMatch.index! + boldMatch[0].length);
      }
      // Italic text *text*
      else {
        const italicMatch = remainingText.match(/\*(.*?)\*/);
        if (italicMatch && !remainingText.startsWith('**')) {
          const beforeItalic = remainingText.substring(0, italicMatch.index);
          if (beforeItalic) {
            parts.push(<Text key={key++}>{beforeItalic}</Text>);
          }
          parts.push(
            <Text key={key++} style={styles.italic}>
              {italicMatch[1]}
            </Text>
          );
          remainingText = remainingText.substring(italicMatch.index! + italicMatch[0].length);
        } else {
          // No more markdown, add remaining text
          parts.push(<Text key={key++}>{remainingText}</Text>);
          break;
        }
      }
    }

    return parts.length > 0 ? parts : text;
  };

  return (
    <View style={styles.container}>
      {parseMarkdown(text)}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  lineBreak: {
    height: 8,
  },
  header1: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
    marginTop: 8,
  },
  header2: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 6,
    marginTop: 6,
  },
  header3: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
    marginTop: 4,
  },
  paragraph: {
    fontSize: 16,
    lineHeight: 22,
    color: '#333',
    marginBottom: 4,
  },
  bulletContainer: {
    flexDirection: 'row',
    marginBottom: 4,
    alignItems: 'flex-start',
  },
  bullet: {
    fontSize: 16,
    color: '#333',
    marginRight: 8,
    marginTop: 2,
  },
  bulletText: {
    fontSize: 16,
    lineHeight: 22,
    color: '#333',
    flex: 1,
  },
  bold: {
    fontWeight: 'bold',
  },
  italic: {
    fontStyle: 'italic',
  },
  userText: {
    color: '#ffffff',
  },
});

export default FormattedMessage;