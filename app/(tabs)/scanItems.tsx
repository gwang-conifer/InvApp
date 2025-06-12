//  scanItems.tsx
import ParallaxScrollView from '@/components/ParallaxScrollView';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { BarcodeScanningResult, CameraView, useCameraPermissions } from 'expo-camera';
import * as Haptics from 'expo-haptics'; // Import Haptics
import React, { useState } from 'react';
import { Alert, Button, Linking, Pressable, StyleSheet, TextInput, View } from 'react-native';

interface ScannedItem {
  type: string;
  data: string;
}

export default function ScanItemsScreen() {
  const colorScheme = useColorScheme();
  const [isCameraVisible, setIsCameraVisible] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();
  const [scannedItem, setScannedItem] = useState<ScannedItem | null>(null);
  const [hasScanned, setHasScanned] = useState(false); // cooldown flag

  const handleToggleCamera = async () => {
    if (!permission) return;

    if (permission.granted) {
      setScannedItem(null); // Reset previous scan data
      setIsCameraVisible(prevIsVisible => {
        if (!prevIsVisible) { // If camera is about to become visible
          setHasScanned(false); // Reset for a new scanning session
        }
        return !prevIsVisible;
      });
    } else {
      const { granted, canAskAgain } = await requestPermission();
      if (granted) {
        setScannedItem(null); // Reset previous scan data
        setHasScanned(false); // Reset for a new scanning session
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
              if (!hasScanned && result.data) {
                console.log("--- BARCODE SCANNED ---", result);
                setHasScanned(true); // Set cooldown flag
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); // Haptic feedback
                setScannedItem({ type: result.type, data: result.data });
                setIsCameraVisible(false); // Close the camera

                // Reset cooldown after a short delay to allow camera to close
                // and prevent immediate re-scan if user reopens camera quickly.
                setTimeout(() => setHasScanned(false), 2000);
              } else {
                if (!result.data) console.log("Scan event fired, but NO DATA in result.");
                // If hasScanned is true, it means we're in the cooldown period, so we ignore the scan.
              }
            }}
            facing="back" // Good to be explicit, though it's the default
            zoom={1} // EXPERIMENT: Try a small value like 0.1 or 0.2
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
            onPress={handleToggleCamera}
          >
            <IconSymbol name="camera.fill" size={24} color="#FFFFFF" style={styles.scanButtonIcon} />
            <ThemedText style={styles.scanButtonText}>
              {scannedItem ? "Scan Another Item" : "Tap to Scan Item"}
            </ThemedText>
          </Pressable>

          {permission && !permission.granted && (
            <View style={styles.permissionMessageContainer}>
              <ThemedText style={{ textAlign: 'center', marginBottom: 10 }}>
                Camera permission is required to scan items.
              </ThemedText>
              {permission.canAskAgain && (
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
                  numberOfLines={3}
                />
              </View>
            </ThemedView>
          )}

          {!isCameraVisible && !scannedItem && (
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
    height: 400,
    width: '100%',
    position: 'relative',
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
    borderStyle: 'dashed',
    borderRadius: 12,
    marginTop: 16,
    opacity: 0.6,
  },
  detailsContainer: {
    gap: 12,
    padding: 16,
    borderRadius: 8,
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
    padding: 8,
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderRadius: 20,
  },
});
