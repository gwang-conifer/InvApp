import { Pressable, StyleSheet } from 'react-native';

import ParallaxScrollView from '@/components/ParallaxScrollView';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol'; // Added import
import { Colors } from '@/constants/Colors'; // Added import for button styling
import { useColorScheme } from '@/hooks/useColorScheme'; // Added import for button styling

export default function HomeScreen() {
  const colorScheme = useColorScheme();

  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: '#A1CEDC', dark: '#1D3D47' }}
      headerImage={
        <IconSymbol
          name="shippingbox.fill" // Changed to a more relevant icon
          size={200} // Adjusted size
          color={colorScheme === 'light' ? Colors.light.icon : Colors.dark.icon}
          style={styles.headerIcon}
        />
      }>
      <ThemedView style={styles.titleContainer}>
        <ThemedText type="title">Inventory & Orders</ThemedText>
      </ThemedView>

      <ThemedView style={styles.sectionContainer}>
        <ThemedText type="subtitle">Quick Actions</ThemedText>
        <Pressable style={[styles.button, { backgroundColor: Colors[colorScheme ?? 'light'].tint }]}>
          <ThemedText style={styles.buttonText}>Receive New Order</ThemedText>
        </Pressable>
        <Pressable style={[styles.button, { backgroundColor: Colors[colorScheme ?? 'light'].tint }]}>
          <ThemedText style={styles.buttonText}>View Inventory</ThemedText>
        </Pressable>
        <Pressable style={[styles.button, { backgroundColor: Colors[colorScheme ?? 'light'].tint }]}>
          <ThemedText style={styles.buttonText}>Scan Item</ThemedText>
        </Pressable>
      </ThemedView>

      <ThemedView style={styles.sectionContainer}>
        <ThemedText type="subtitle">Recent Activity</ThemedText>
        <ThemedText>
          - Order #12345 received on 2024-07-28.
        </ThemedText>
        <ThemedText>
          - Item XYZ stock updated.
        </ThemedText>
      </ThemedView>

      <ThemedView style={styles.sectionContainer}>
        <ThemedText type="subtitle">Inventory Overview</ThemedText>
        <ThemedText>
          - Total Items: 1500
        </ThemedText>
        <ThemedText>
          - Low Stock Alerts: 5 items
        </ThemedText>
      </ThemedView>
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionContainer: {
    gap: 8,
    marginBottom: 8,
    padding: 16,
    borderRadius: 8,
  },
  headerIcon: { // Renamed from reactLogo and adjusted
    bottom: -50, // Adjust as needed
    left: '50%',
    marginLeft: -100, // Half of the icon size to center it
    position: 'absolute',
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  buttonText: {
    color: '#FFFFFF', // Assuming tint color contrasts well with white
    fontSize: 16,
    fontWeight: 'bold',
  }
});
