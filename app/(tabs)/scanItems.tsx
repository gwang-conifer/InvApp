// import { BarcodeScanningResult, CameraView, useCameraPermissions } from 'expo-camera'; // Replaced
import ParallaxScrollView from '@/components/ParallaxScrollView';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import React, { useEffect, useState } from 'react';
import { Alert, Button, Linking, PermissionsAndroid, Platform, Pressable, StyleSheet, TextInput, View } from 'react-native'; // Added Platform, PermissionsAndroid
import Barcode from 'react-native-smart-barcode'; // Added for react-native-smart-barcode

interface ScannedItem {
  type: string; // react-native-smart-barcode provides 'type'
  data: string;
}

export default function ScanItemsScreen() {
  const colorScheme = useColorScheme();
  // const [permission, requestPermission] = useCameraPermissions(); // Removed expo-camera permission hook
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null); // null: undetermined, true: granted, false: denied
  const [isCameraVisible, setIsCameraVisible] = useState(false);
  const [scannedItem, setScannedItem] = useState<ScannedItem | null>(null);

  useEffect(() => {
    const checkInitialPermission = async () => {
      if (Platform.OS === 'android') {
        const result = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.CAMERA);
        setHasCameraPermission(result);
      } else {
        // For iOS, permission is typically requested when the camera is first accessed.
        // Setting to null so the user is prompted on first tap.
        setHasCameraPermission(null);
      }
    };
    checkInitialPermission();
  }, []);

  const requestCameraPermissionAction = async (): Promise<boolean> => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.CAMERA,
          {
            title: "Camera Permission",
            message: "RecOrd needs access to your camera to scan barcodes.",
            buttonPositive: "OK",
            buttonNegative: "Cancel",
          }
        );
        const isGranted = granted === PermissionsAndroid.RESULTS.GRANTED;
        setHasCameraPermission(isGranted);
        return isGranted;
      } catch (err) {
        console.warn(err);
        setHasCameraPermission(false);
        return false;
      }
    } else { // iOS
      // For iOS, the system will prompt when the Barcode component tries to access the camera.
      // We set permission to true to allow the component to render and trigger the prompt.
      setHasCameraPermission(true);
      return true;
    }
  };

  const handleToggleCamera = async () => {
    let currentPermissionGranted = hasCameraPermission;
    if (hasCameraPermission !== true) { // If null (undetermined/initial) or false (denied)
      currentPermissionGranted = await requestCameraPermissionAction();
    }

    if (currentPermissionGranted) {
      setScannedItem(null); // Reset previous scan
      setIsCameraVisible(prev => !prev);
    } else if (hasCameraPermission === false) { // Only show alert if explicitly denied and not just undetermined
        Alert.alert("Permissions required", "Camera permission is needed to scan items. Please enable it in settings.", [
          { text: "OK" },
          { text: "Open Settings", onPress: () => Linking.openSettings() }
        ]);
    }
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

      {isCameraVisible && hasCameraPermission === true ? (
        <View style={styles.cameraContainer}>
          <Barcode
            style={styles.barcodeScannerView} // Use flex: 1 to fill container
            onBarCodeRead={(event: { data: string; type: string }) => {
              console.log('Barcode scan attempt (react-native-smart-barcode):', JSON.stringify(event, null, 2));
              if (isCameraVisible && event.data) {
                console.log('Barcode SCANNED (react-native-smart-barcode):', event.data, 'Type:', event.type);
                // Prevent multiple scans if already processing one
                if (scannedItem?.data !== event.data || scannedItem?.type !== event.type) {
                  setScannedItem({ type: event.type, data: event.data });
                  setIsCameraVisible(false); // Hide camera after successful scan
                }
              }
            }}
            // react-native-smart-barcode does not have a barcodeTypes prop like expo-camera.
            // It scans for all supported types by default.
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
          {hasCameraPermission === false && (
            <View style={styles.permissionMessageContainer}>
              <ThemedText style={{ textAlign: 'center', marginBottom: 10 }}>
                Camera permission is required to scan items.
              </ThemedText>
              {Platform.OS === 'android' && ( // On Android, we can prompt again.
                <Button title="Grant Permission" onPress={requestCameraPermissionAction} color={Colors[colorScheme ?? 'light'].tint} />
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
            <ThemedView style={styles.cameraPlaceholder}>
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
    backgroundColor: Colors.light.cardBackground, // Ensure this is defined in your Colors.ts
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
