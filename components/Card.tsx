import React from 'react';
import { StyleSheet, View, ViewProps } from 'react-native';

import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { ThemedText } from './ThemedText';
import { ThemedView } from './ThemedView';

interface CardProps extends ViewProps {
  title?: string;
  children?: React.ReactNode;
}

export default function Card({ title, children, style, ...rest }: CardProps) {
  const colorScheme = useColorScheme();
  const cardBackgroundColor = colorScheme === 'light' ? Colors.light.background : Colors.dark.background; // Or a specific card background color
  const cardBorderColor = colorScheme === 'light' ? Colors.light.icon : Colors.dark.icon; // Example border

  return (
    <ThemedView
      style={[
        styles.card,
        { backgroundColor: cardBackgroundColor, borderColor: cardBorderColor },
        style,
      ]}
      {...rest}>
      {title && <ThemedText type="subtitle" style={styles.cardTitle}>{title}</ThemedText>}
      <View style={styles.cardContent}>
        {children}
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16, // Space between cards
    borderWidth: StyleSheet.hairlineWidth, // Subtle border
    // You can add shadow styles here for iOS and elevation for Android if desired
    // Example shadow for iOS:
    // shadowColor: '#000',
    // shadowOffset: { width: 0, height: 1 },
    // shadowOpacity: 0.1,
    // shadowRadius: 3,
    // Example elevation for Android:
    // elevation: 2,
  },
  cardTitle: {
    marginBottom: 12,
    fontWeight: '600', // Make title a bit bolder
  },
  cardContent: {
    // Styles for the content area within the card
  },
});