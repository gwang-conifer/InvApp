import ParallaxScrollView from '@/components/ParallaxScrollView';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { BarcodeScanningResult, CameraView, useCameraPermissions } from 'expo-camera';
import React, { useState } from 'react';
import { Alert, Button, Linking, Pressable, StyleSheet, TextInput, View } from 'react-native'; // Added Platform, PermissionsAndroid

interface ScannedItem {
  type: string; // react-native-smart-barcode provides 'type'
  data: string;
}

export default function ScanItemsScreen() {
  const colorScheme = useColorScheme();
  const [isCameraVisible, setIsCameraVisible] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();

  const [scannedItem, setScannedItem] = useState<ScannedItem | null>(null);

  

  const handleToggleCamera = async () => {
    if (!permission) { // Permissions are still loading
      return;
    }

    if (permission.granted) {
      setScannedItem(null); // Reset previous scan
      setIsCameraVisible(prev => !prev);
    } else { // Permission not granted
      const { granted: newPermissionGranted, canAskAgain } = await requestPermission();
      if (newPermissionGranted) {
        setScannedItem(null); // Reset previous scan
        setIsCameraVisible(true); // Open camera on first grant
      } else if (!canAskAgain) {
        Alert.alert("Permissions required", "Camera permission is needed to scan items. Please enable it in settings.", [
          { text: "OK" },
          { text: "Open Settings", onPress: () => Linking.openSettings() }
        ]);
      }
      // If !newPermissionGranted && canAskAgain, the system prompt was shown.
      // The UI for permission denied (below) will handle showing the "Grant Permission" button
      // or "Open Settings" based on the updated permission status.
    }
  };
  

  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: '#D0D0D0', dark: '#353636' }}
      headerImage={
      <View style={styles.headerImage}>
        <IconSymbol
          size={280}
          color={colorScheme === 'light' ? Colors.light.icon : Colors.dark.icon}
          name="qrcode.viewfinder"
        />
      </View>

      }>
      <ThemedView style={styles.titleContainer}>
        <ThemedText type="title">Scan Item</ThemedText>
      </ThemedView>

      {isCameraVisible && permission?.granted ? (
        <View style={styles.cameraContainer}>

        <CameraView
            style={styles.barcodeScannerView}
            onBarcodeScanned={(scanningResult: BarcodeScanningResult) => {
              if (isCameraVisible && scanningResult.data) {
                console.log('Barcode SCANNED (expo-camera):', scanningResult.data, 'Type:', scanningResult.type);
                // Prevent multiple scans if already processing one
                if (scannedItem?.data !== scanningResult.data || scannedItem?.type !== scanningResult.type) {
                  setScannedItem({ type: scanningResult.type, data: scanningResult.data });
                  setIsCameraVisible(false); // Hide camera after successful scan
              
                }
               }
            }}
            // You can configure barcodeTypes if needed:
            // barcodeScannerSettings={{ barcodeTypes: ['qr', 'ean13', 'code128', etc...] }}
          />
           <Pressable style={styles.closeCameraButton} onPress={() => setIsCameraVisible(false)}>
            <IconSymbol name="xmark.circle.fill" size={30} color="white" />
          </Pressable>
        </View>
      ) : (
        <ThemedView style={styles.contentContainer}>
          <Pressable
            style={({ pressed }) => [
              styles.scanButton,
              { backgroundColor: Colors[colorScheme ?? 'light'].tint },
              pressed && styles.scanButtonPressed,
            ]}
            onPress={handleToggleCamera}>
            <IconSymbol name="camera.fill" size={24} color="#FFFFFF" style={styles.scanButtonIcon} />
            <ThemedText style={styles.scanButtonText}>
              {scannedItem ? "Scan Another Item" : "Tap to Scan Item"} 
            </ThemedText>
          </Pressable>

          {/* Show permission request/info if permission is denied */}
          {permission && !permission.granted && (
            <View style={styles.permissionMessageContainer}>
              <ThemedText style={{ textAlign: 'center', marginBottom: 10 }}>
                Camera permission is required to scan items.
              </ThemedText>
              {permission.canAskAgain && ( // Only show "Grant Permission" if we can ask again
                <Button title="Grant Permission" onPress={requestPermission} color={Colors[colorScheme ?? 'light'].tint} />
              )} 
              <Button title="Open Settings" onPress={() => Linking.openSettings()} color={Colors[colorScheme ?? 'light'].tint} />
            </View>
          )}

          {scannedItem && (
            <ThemedView
              style={styles.detailsContainer}
              lightColor={Colors.light.cardBackground || '#f9f9f9'} 
              darkColor={Colors.dark.cardBackground || '#2a2a2a'}  
            >
              <ThemedText type="subtitle">Last Scanned Item</ThemedText>
              <View style={styles.detailItem}>
                <ThemedText type="defaultSemiBold">Type:</ThemedText>
                <ThemedText>{scannedItem.type}</ThemedText>
              </View>
              <View style={styles.detailItem}>
                <ThemedText type="defaultSemiBold" style={styles.detailItemLabel}>Data:</ThemedText>
                <TextInput
                  style={[
                    styles.scannedDataInput,
                    {
                      color: Colors[colorScheme ?? 'light'].text,
                      borderColor: Colors[colorScheme ?? 'light'].border || (colorScheme === 'light' ? '#ccc' : '#555'),
                      backgroundColor: Colors[colorScheme ?? 'light'].inputBackground || (colorScheme === 'light' ? '#fff' : '#333'),
                    }
                  ]}
                  value={scannedItem.data}
                  editable={false}
                  multiline
                  numberOfLines={3} // Adjust as needed
                />
              </View>
              {/* You can add more fields here based on what you do with the scanned data */}
            </ThemedView>
          )}

          {/* Original Placeholder - can be removed or kept if camera is not active */}
          {!isCameraVisible && !scannedItem && (
            <ThemedView style={[
              styles.cameraPlaceholder,
              { borderColor: Colors[colorScheme ?? 'light'].icon } // Apply theme-aware border color
            ]}>             
            <IconSymbol
                name="viewfinder"
                size={80}
                color={Colors[colorScheme ?? 'light'].text} // Or .icon if preferred
                style={{ opacity: 0.3 }}
              />
              <ThemedText type='default' style={{ textAlign: 'center', marginTop: 8, opacity: 0.6 }}>
                Press the button above to start scanning
              </ThemedText>
              
            </ThemedView>
          )}
        </ThemedView>
      )}
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
  cameraContainer: {
    height: 400, // Adjust as needed
    width: '100%',
    position: 'relative', // For positioning the close button
  },
  barcodeScannerView: { // Added style for the Barcode component
    flex: 1,
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
    paddingVertical: 40, // Corrected borderColor to be theme-aware
    borderWidth: 2, // borderColor: Colors.light.icon, // Changed from Colors.light.gray
    borderStyle: 'dashed',
    borderRadius: 12,
    marginTop: 16,
    opacity: 0.6,
  },
  detailsContainer: {
    gap: 12,
    padding: 16,
    borderRadius: 8,
    // Add shadow or border if desired
  },
  detailItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  detailItemLabel: { // Added definition for detailItemLabel
    marginRight: 8,
    flexShrink: 0,
  },
  scannedDataInput: { // Added definition for scannedDataInput
    flex: 1,
    marginLeft: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderRadius: 6,
  },
  permissionMessageContainer: {
    alignItems: 'center',
    paddingVertical: 20,
    gap: 10,
  },
  closeCameraButton: {
    position: 'absolute',
    top: 20,
    right: 20,
    zIndex: 1,
    padding: 8, // Make it easier to tap
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderRadius: 20,
  }
});
