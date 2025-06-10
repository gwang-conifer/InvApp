import { Pressable, StyleSheet, View } from 'react-native';

import ParallaxScrollView from '@/components/ParallaxScrollView';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Colors } from '@/constants/Colors'; // Added for button styling
import { useColorScheme } from '@/hooks/useColorScheme'; // Added for button styling

export default function ScanItemsScreen() {
  const colorScheme = useColorScheme();

  // Placeholder function for scan action
  const handleScanPress = () => {
    console.log('Scan button pressed');
    // In a real app, you would initiate camera scanning here
  };

  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: '#D0D0D0', dark: '#353636' }}
      headerImage={
        <IconSymbol
          size={280} // Adjusted size
          color={colorScheme === 'light' ? Colors.light.icon : Colors.dark.icon}
          name="qrcode.viewfinder" // Changed to a scanning-related icon
          style={styles.headerImage}
        />
      }>
      <ThemedView style={styles.titleContainer}>
        <ThemedText type="title">Scan Item</ThemedText>
      </ThemedView>

      <ThemedView style={styles.contentContainer}>
        <Pressable
          style={({ pressed }) => [
            styles.scanButton,
            { backgroundColor: Colors[colorScheme ?? 'light'].tint },
            pressed && styles.scanButtonPressed,
          ]}
          onPress={handleScanPress}>
          <IconSymbol name="camera.fill" size={24} color="#FFFFFF" style={styles.scanButtonIcon} />
          <ThemedText style={styles.scanButtonText}>Tap to Scan Item</ThemedText>
        </Pressable>

        {/* Placeholder for camera view or instructions */}
        <ThemedView style={styles.cameraPlaceholder}>
          <IconSymbol name="viewfinder" size={80} color={Colors[colorScheme ?? 'light'].text} style={{ opacity: 0.3 }} />
          <ThemedText type='default' style={{ textAlign: 'center', marginTop: 8, opacity: 0.6 }}>
            camera view here
          </ThemedText>            
        </ThemedView>

        <ThemedView style={styles.detailsContainer}>
          <ThemedText type="subtitle">Last Scanned Item</ThemedText>
          <View style={styles.detailItem}>
            <ThemedText type="defaultSemiBold">Name:</ThemedText>
            <ThemedText>---</ThemedText>
          </View>
          <View style={styles.detailItem}>
            <ThemedText type="defaultSemiBold">ID:</ThemedText>
            <ThemedText>---</ThemedText>
          </View>
          <View style={styles.detailItem}>
            <ThemedText type="defaultSemiBold">Quantity:</ThemedText>
            <ThemedText>---</ThemedText>
          </View>
        </ThemedView>
      </ThemedView>
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  headerImage: {
    // Adjusted to better center a typical icon
    bottom: -60, // Adjust as needed
    left: '50%',
    marginLeft: -140, // Half of the icon size (280 / 2)
    position: 'absolute',
  },
  titleContainer: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16, // Added padding
    marginTop: 16,      // Added margin
  },
  contentContainer: {
    padding: 16,
    gap: 24, // Increased gap for better separation
  },
  scanButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    elevation: 2, // For Android shadow
    shadowColor: '#000', // For iOS shadow
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
  },
  scanButtonPressed: {
    opacity: 0.8,
  },
  scanButtonIcon: {
    marginRight: 12,
  },
  scanButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  cameraPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    borderWidth: 2,
    borderColor: Colors.light.gray, // Use a subtle border color
    borderStyle: 'dashed',
    borderRadius: 12,
    marginTop: 16,
  },
  detailsContainer: {
    gap: 12,
    padding: 16,
    borderRadius: 8,
    backgroundColor: Colors.light.cardBackground, // Example: use a card background
    // Add shadow or border if desired
  },
  detailItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  }
});
