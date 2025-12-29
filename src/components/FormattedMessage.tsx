import React from 'react';
import { Text, View, StyleSheet } from 'react-native';
import { theme } from '../theme';

interface FormattedMessageProps {
  text: string;
  isUser: boolean;
}

const FormattedMessage: React.FC<FormattedMessageProps> = ({ text, isUser }) => {
  const cleanText = (text: string): string => {
    return text
      .trim()
      .replace(/\n{3,}/g, '\n\n') // Replace 3+ newlines with just 2
      .replace(/[ \t]+$/gm, '') // Remove trailing spaces/tabs from lines
  };

  const parseMarkdown = (text: string) => {
    const cleanedText = cleanText(text);
    const lines = cleanedText.split('\n');
    const elements: React.ReactNode[] = [];
    
    lines.forEach((line, lineIndex) => {
      const trimmedLine = line.trim();
      
      // Handle empty lines
      if (trimmedLine === '') {
        // Only add line break if we don't already have consecutive line breaks
        if (elements.length > 0) {
          const lastElement = elements[elements.length - 1];
          const isLastElementLineBreak = React.isValidElement(lastElement) && 
            lastElement.key?.toString().startsWith('space-');
          
          if (!isLastElementLineBreak) {
            elements.push(<View key={`space-${lineIndex}`} style={styles.lineBreak} />);
          }
        }
        return;
      }

      // Headers (# ## ###) - make sure there's a space after #
      if (line.match(/^###\s+/)) {
        elements.push(
          <Text key={lineIndex} style={[styles.header3, isUser && styles.userText]}>
            {line.replace(/^###\s+/, '')}
          </Text>
        );
      } else if (line.match(/^##\s+/)) {
        elements.push(
          <Text key={lineIndex} style={[styles.header2, isUser && styles.userText]}>
            {line.replace(/^##\s+/, '')}
          </Text>
        );
      } else if (line.match(/^#\s+/)) {
        elements.push(
          <Text key={lineIndex} style={[styles.header1, isUser && styles.userText]}>
            {line.replace(/^#\s+/, '')}
          </Text>
        );
      }
      // Bullet points - handle various bullet formats
      else if (line.match(/^[-•*]\s/)) {
        elements.push(
          <View key={lineIndex} style={styles.bulletContainer}>
            <Text style={[styles.bullet, isUser && styles.userText]}>•</Text>
            <View style={styles.bulletTextContainer}>
              <Text style={[styles.bulletText, isUser && styles.userText]}>
                {parseInlineMarkdown(line.replace(/^[-•*]\s+/, ''))}
              </Text>
            </View>
          </View>
        );
      }
      // Numbered lists
      else if (line.match(/^\d+\.\s/)) {
        const numberMatch = line.match(/^(\d+\.)/);
        elements.push(
          <View key={lineIndex} style={styles.bulletContainer}>
            <Text style={[styles.numberBullet, isUser && styles.userText]}>
              {numberMatch?.[1]}
            </Text>
            <View style={styles.bulletTextContainer}>
              <Text style={[styles.bulletText, isUser && styles.userText]}>
                {parseInlineMarkdown(line.replace(/^\d+\.\s+/, ''))}
              </Text>
            </View>
          </View>
        );
      }
      // Regular paragraphs
      else if (trimmedLine.length > 0) {
        elements.push(
          <View key={lineIndex} style={styles.paragraphContainer}>
            <Text style={[styles.paragraph, isUser && styles.userText]}>
              {parseInlineMarkdown(trimmedLine)}
            </Text>
          </View>
        );
      }
    });

    return elements;
  };

  const parseInlineMarkdown = (text: string): React.ReactNode => {
    if (!text || typeof text !== 'string') {
      return text;
    }

    // Split by ** and process alternately as normal/bold
    const segments = text.split('**');
    
    if (segments.length === 1) {
      // No ** found, return as-is
      return text;
    }

    const parts: React.ReactNode[] = [];
    
    segments.forEach((segment, index) => {
      if (segment === '') {
        return; // Skip empty segments
      }
      
      if (index % 2 === 0) {
        // Even indices are regular text
        parts.push(<Text key={index}>{segment}</Text>);
      } else {
        // Odd indices are bold text
        parts.push(
          <Text key={index} style={[styles.bold, isUser && styles.userText]}>
            {segment}
          </Text>
        );
      }
    });

    return parts.length > 0 ? parts : text;
  };

  // Remove the processItalics function since we're simplifying
  // const processItalics = (text: string, startKey: number) => {
  //   // Removed for simplicity - focus on bold formatting first
  // };

  return (
    <View style={styles.container}>
      {parseMarkdown(text)}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    // Natural sizing based on content
  },
  lineBreak: {
    height: 6,
  },
  header1: {
    fontSize: 18,
    fontWeight: '700', // Use numeric weight for better cross-platform support
    color: '#333',
    marginVertical: 6,
  },
  header2: {
    fontSize: 17,
    fontWeight: '600',
    color: '#333',
    marginVertical: 5,
  },
  header3: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginVertical: 4,
  },
  paragraphContainer: {
    marginBottom: 4,
  },
  paragraph: {
    fontSize: 16,
    lineHeight: 22, // Better readability
    color: '#333',
  },
  bulletContainer: {
    flexDirection: 'row',
    marginBottom: 3,
    alignItems: 'flex-start',
  },
  bullet: {
    fontSize: 16,
    color: '#333',
    marginRight: 8,
    marginTop: 2,
    width: 12,
  },
  numberBullet: {
    fontSize: 16,
    color: '#333',
    marginRight: 8,
    marginTop: 2,
    minWidth: 24, // Accommodate larger numbers
    textAlign: 'left',
  },
  bulletTextContainer: {
    flex: 1,
  },
  bulletText: {
    fontSize: 16,
    lineHeight: 22,
    color: '#333',
  },
  bold: {
    fontWeight: '700',
  },
  italic: {
    fontStyle: 'italic',
  },
  userText: {
    color: '#ffffff',
  },
});

export default FormattedMessage;