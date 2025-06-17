//  scanItems.tsx
import ParallaxScrollView from '@/components/ParallaxScrollView';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Colors } from '@/constants/Colors'; // Added commonColors
import { useColorScheme } from '@/hooks/useColorScheme';
import { BarcodeScanningResult, CameraView, useCameraPermissions } from 'expo-camera';
import * as Haptics from 'expo-haptics';
import React, { useState } from 'react';
import { Alert, Button, Linking, Pressable, StyleSheet, TextInput, View } from 'react-native';

interface ScannedItem {
  type: string; // e.g., 'QR_CODE', 'EAN_13', or 'BLUETOOTH_SCANNER'
  data: string;
}

export default function ScanItemsScreen() {
  const colorScheme = useColorScheme();
  const [isCameraVisible, setIsCameraVisible] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();
  const [scannedItem, setScannedItem] = useState<ScannedItem | null>(null);
  const [hasScannedCooldown, setHasScannedCooldown] = useState(false); // Cooldown for camera scans

  // --- Bluetooth State ---
  const [isBluetoothConnecting, setIsBluetoothConnecting] = useState(false);
  const [connectedBluetoothDevice, setConnectedBluetoothDevice] = useState<unknown | null>(null); // Keep for disabling camera, but type can be unknown
  // ------------------------

  // Function to process scanned data from any source
  const processScannedData = (data: string, type: string) => {
    console.log(`--- ${type} SCANNED ---`, data);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setScannedItem({ type, data });
    setIsCameraVisible(false); // Close camera if it was open
    setHasScannedCooldown(true);
    setTimeout(() => setHasScannedCooldown(false), 2000);
  };

  const handleToggleCamera = async () => {
    if (!permission) return;
    if (isBluetoothConnecting || connectedBluetoothDevice) return; // Don't open camera if BT is active/connecting

    if (permission.granted) {
      setScannedItem(null); // Reset previous scan data
      setIsCameraVisible(prevIsVisible => {
        if (!prevIsVisible) { // If camera is about to become visible
          setHasScannedCooldown(false); // Reset for a new scanning session
        }
        return !prevIsVisible;
      });
    } else {
      const { granted, canAskAgain } = await requestPermission();
      if (granted) {
        setScannedItem(null); // Reset previous scan data
        setHasScannedCooldown(false); // Reset for a new scanning session
        setIsCameraVisible(true);
      } else if (!canAskAgain) {
        Alert.alert("Permissions required", "Camera permission is needed to scan items. Please enable it in settings.", [
          { text: "OK" },
          { text: "Open Settings", onPress: () => Linking.openSettings() },
        ]);
      }
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
      }
    >
      <ThemedView style={styles.titleContainer}>
        <ThemedText type="title">Scan Item</ThemedText>
      </ThemedView>

      {isCameraVisible && permission?.granted ? (
        <View style={styles.cameraContainer}>
          <CameraView
            style={styles.barcodeScannerView}
            barcodeScannerSettings={{
              barcodeTypes: ['qr', 'ean13', 'ean8', 'code128', 'code39', 'upc_a', 'upc_e'], // EXPERIMENT: Try a small value like 0.1 or 0.2
            }}
            onBarcodeScanned={(result: BarcodeScanningResult) => {
              if (!hasScannedCooldown && result.data) {
                processScannedData(result.data, result.type.toString()); // Use the new central function
              } else {
                if (!result.data) console.log("Scan event fired, but NO DATA in result.");
                // If hasScanned is true, it means we're in the cooldown period, so we ignore the scan.
              }
            }}
            facing="back" // Good to be explicit, though it's the default
            zoom={0} // Default to no zoom
          />
          <Pressable style={styles.closeCameraButton} onPress={() => setIsCameraVisible(false)}>
            <IconSymbol name="xmark.circle.fill" size={30} color="#FFFFFF" />
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
            onPress={handleToggleCamera}
            disabled={isBluetoothConnecting || !!connectedBluetoothDevice} // Disable if BT is active/connecting
          >
            <IconSymbol
              name="camera.fill"
              size={24}
              style={[
                styles.scanButtonIcon,
                { color: colorScheme === 'dark' ? Colors.light.text : '#FFFFFF' }
              ]}
            />
            <ThemedText style={[styles.scanButton, { color: colorScheme === 'dark' ? Colors.light.text : '#FFFFFF' }]}>
              {isCameraVisible ? "Close Camera" : "Scan with Camera"}
            </ThemedText>
          </Pressable>

          {permission && !permission.granted && !isCameraVisible && ( // Show only if camera is not visible
            <View style={styles.permissionMessageContainer}>
              <ThemedText style={{ textAlign: 'center', marginBottom: 10 }}>
                Camera permission is required to scan items.
              </ThemedText>
              {permission.canAskAgain && (
                <Button title="Grant Camera Permission" onPress={requestPermission} color={Colors[colorScheme ?? 'light'].tint} />
              )}
              {!permission.canAskAgain && (
                <Button title="Open Settings for Camera" onPress={() => Linking.openSettings()} color={Colors[colorScheme ?? 'light'].tint} />
              )}
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
                <ThemedText type="defaultSemiBold">Source:</ThemedText>
                <ThemedText>{`Camera (${scannedItem.type})`}</ThemedText>
              </View>
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
                  numberOfLines={3}
                />
              </View>
            </ThemedView>
          )}

          {!isCameraVisible && !scannedItem && !connectedBluetoothDevice && ( // Show placeholder if no active input/scan
            <ThemedView style={[
              styles.cameraPlaceholder,
              { borderColor: Colors[colorScheme ?? 'light'].icon }
            ]}>
              <IconSymbol
                name="viewfinder"
                size={80}
                color={Colors[colorScheme ?? 'light'].text}
                style={{ opacity: 0.3 }}
              />
              <ThemedText type='default' style={{ textAlign: 'center', marginTop: 8, opacity: 0.6 }}>
                Use the camera to scan an item.
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
    bottom: -60,
    left: '50%',
    marginLeft: -140,
    position: 'absolute',
  },
  titleContainer: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    marginTop: 16,
  },
  cameraContainer: {
    height: 350, // Adjusted height
    width: '100%',
    position: 'relative',
    marginBottom: 16,
  },
  barcodeScannerView: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    gap: 24,
  },
  scanButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
  },
  scanButtonPressed: {
    opacity: 0.8,
  },
  scanButtonIcon: {
    marginRight: 12,
    fontSize: 18,
    fontWeight: 'bold',
    // Color is set dynamically
  },
  cameraPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderRadius: 12,
    // marginTop: 16, // Now conditional
    opacity: 0.6,
  },
  detailsContainer: {
    gap: 12,
    padding: 16,
    borderRadius: 8,
    marginTop: 8, // Adjusted margin
  },
  detailItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  detailItemLabel: {
    marginRight: 8,
    flexShrink: 0,
  },
  scannedDataInput: {
    flex: 1, // Takes remaining space
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
    top: 10,
    right: 10,
    zIndex: 1,
    padding: 8,
    backgroundColor: 'rgba(0,0,0,0.5)', // Darker for better visibility
    borderRadius: 20, // Circular
  },
});
