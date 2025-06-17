//  scanItems.tsx
import ParallaxScrollView from '@/components/ParallaxScrollView';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Colors, commonColors } from '@/constants/Colors'; // Added commonColors
import { useColorScheme } from '@/hooks/useColorScheme';
import { Buffer } from 'buffer'; // For Base64 decoding
import { BarcodeScanningResult, CameraView, useCameraPermissions } from 'expo-camera';
import * as Haptics from 'expo-haptics';
import React, { useEffect, useRef, useState } from 'react';
import { Alert, Button, FlatList, Linking, Modal, PermissionsAndroid, Platform, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { BleError, BleManager, State as BleState, Characteristic, Device, Subscription } from 'react-native-ble-plx';

// --- IMPORTANT: Define your scanner's specific UUIDs here ---
const YOUR_SCANNER_SERVICE_UUID = '0000xxxx-0000-1000-8000-00805f9b34fb'; // EXAMPLE - REPLACE THIS! Find your scanner's service UUID.
const YOUR_SCANNER_CHARACTERISTIC_UUID = '0000yyyy-0000-1000-8000-00805f9b34fb'; // EXAMPLE - REPLACE THIS! Find your scanner's data characteristic UUID.
// You can find these UUIDs using tools like nRF Connect (mobile app) by inspecting your scanner's services.

interface ScannedItem {
  type: string; // e.g., 'QR_CODE', 'EAN_13', or 'BLUETOOTH_SCANNER'
  data: string;
}

export default function ScanItemsScreen() {
  const colorScheme = useColorScheme();
  const bleManager = useRef(new BleManager()).current;
  const [isCameraVisible, setIsCameraVisible] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();
  const [scannedItem, setScannedItem] = useState<ScannedItem | null>(null);
  const [hasScannedCooldown, setHasScannedCooldown] = useState(false); // Cooldown for camera scans

  // --- Bluetooth State ---
  const [isBluetoothConnecting, setIsBluetoothConnecting] = useState(false);
  const [connectedBluetoothDevice, setConnectedBluetoothDevice] = useState<Device | null>(null);
  const [bluetoothPermissionsGranted, setBluetoothPermissionsGranted] = useState(false);
  const [discoveredDevices, setDiscoveredDevices] = useState<Device[]>([]);
  const [isDeviceSelectionModalVisible, setIsDeviceSelectionModalVisible] = useState(false);
  const [bluetoothAdapterState, setBluetoothAdapterState] = useState<BleState>(BleState.Unknown);

  // Refs for subscriptions to ensure they can be cleaned up
  const dataSubscription = useRef<Subscription | null>(null);
  const bleStateSubscription = useRef<Subscription | null>(null);
  // ------------------------



  // Function to process scanned data from any source
  const processScannedData = (data: string, type: string) => {
    console.log(`--- ${type} SCANNED ---`, data);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setScannedItem({ type, data });
    setIsCameraVisible(false); // Close camera if it was open

    // For camera, we use a cooldown. For Bluetooth, it might be continuous.
    // If the type indicates it's from the camera, apply cooldown.
    if (type !== 'BLUETOOTH_SCANNER') {
      setHasScannedCooldown(true);
      setTimeout(() => setHasScannedCooldown(false), 2000);
    }
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

  // --- Bluetooth Functions ---
  const requestBluetoothPermissionsAsync = async (): Promise<boolean> => {
    console.log("Requesting Bluetooth permissions...");
    if (Platform.OS === 'android') {
      const apiLevel = Platform.Version as number;
      let permissionsToRequest: PermissionsAndroid.Permission[] = [];

      if (apiLevel >= 31) { // Android 12+ (API level 31)
        permissionsToRequest.push(PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN!);
        permissionsToRequest.push(PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT!);
      } else { // Android < 12
        // For older Android, ACCESS_FINE_LOCATION is needed for BLE scanning.
        permissionsToRequest.push(PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION!);
      }

      if (permissionsToRequest.length === 0) {
        console.log('No specific runtime Bluetooth permissions needed for this Android version.');
        setBluetoothPermissionsGranted(true);
        return true;
      }

      try {
        const granted = await PermissionsAndroid.requestMultiple(permissionsToRequest);
        const allGranted = permissionsToRequest.every(perm => granted[perm] === PermissionsAndroid.RESULTS.GRANTED);

        if (allGranted) {
          console.log('All required Bluetooth permissions granted for Android.');
          setBluetoothPermissionsGranted(true);
          return true;
        } else {
          console.log('One or more Bluetooth permissions denied for Android.');
          Alert.alert('Permissions Denied', 'Bluetooth permissions are required to connect to a scanner. Please grant them in app settings.');
          setBluetoothPermissionsGranted(false);
          return false;
        }
      } catch (err) {
        console.warn('Error requesting Android Bluetooth permissions:', err);
        setBluetoothPermissionsGranted(false);
        return false;
      }
    } else if (Platform.OS === 'ios') {
      // On iOS, permissions are handled by Info.plist entries and system prompts.
      if (bluetoothAdapterState !== BleState.PoweredOn && bluetoothAdapterState !== BleState.Unknown) {
        Alert.alert('Bluetooth Not Ready', 'Please ensure Bluetooth is enabled in Settings. The app will also request permission if needed.');
      }
      console.log('iOS Bluetooth permissions are handled by Info.plist and system prompts.');
      setBluetoothPermissionsGranted(true); // Optimistic, actual check is BT state
      return true;
    }
    return false;
  };

  const startScan = () => {
    if (bluetoothAdapterState !== BleState.PoweredOn) {
      Alert.alert('Bluetooth Not Powered On', 'Please turn on Bluetooth to scan for devices.');
      setIsBluetoothConnecting(false);
      return;
    }

    setDiscoveredDevices([]);
    setIsDeviceSelectionModalVisible(true);
    console.log('Starting BLE device scan...');

    bleManager.startDeviceScan(null, { allowDuplicates: false }, (error, device) => {
      if (error) {
        console.error('Scan error:', error);
        Alert.alert('Scan Error', `Failed to scan for devices: ${error.message}`);
        setIsBluetoothConnecting(false);
        setIsDeviceSelectionModalVisible(false);
        bleManager.stopDeviceScan();
        return;
      }

      if (device && (device.name || device.localName)) {
        setDiscoveredDevices(prevDevices => {
          if (!prevDevices.find(d => d.id === device.id)) {
            console.log('Discovered device:', device.name || device.localName, device.id);
            return [...prevDevices, device];
          }
          return prevDevices;
        });
      }
    });

    setTimeout(() => {
      if (isBluetoothConnecting && isDeviceSelectionModalVisible) { // Check if still in scanning phase and modal is open
        bleManager.stopDeviceScan();
        console.log('Scan stopped by timeout.');
      }
    }, 15000); // Scan for 15 seconds
  };

  const handleSelectDevice = async (device: Device) => {
    setIsDeviceSelectionModalVisible(false);
    bleManager.stopDeviceScan();
    console.log('Attempting to connect to:', device.name || device.id);
    // setIsBluetoothConnecting(true); // Already true from handleConnectBluetoothScanner

    try {
      const connectedDevice = await device.connect({ autoConnect: false, requestMTU: 251 });
      console.log('Connected to:', connectedDevice.name || connectedDevice.id);
      setConnectedBluetoothDevice(connectedDevice);

      await connectedDevice.discoverAllServicesAndCharacteristics();
      console.log('Services and characteristics discovered.');

      dataSubscription.current = connectedDevice.monitorCharacteristicForService(
        YOUR_SCANNER_SERVICE_UUID,
        YOUR_SCANNER_CHARACTERISTIC_UUID,
        (bleError: BleError | null, characteristic: Characteristic | null) => {
          if (bleError) {
            console.error('Characteristic monitor error:', bleError.message, bleError.errorCode, bleError.reason);
            if (bleError.errorCode === 201 || bleError.message.toLowerCase().includes('disconnected')) {
              Alert.alert('Device Disconnected', `${connectedBluetoothDevice?.name || 'Scanner'} has disconnected.`);
              setConnectedBluetoothDevice(null);
              setIsBluetoothConnecting(false);
              if (dataSubscription.current) {
                dataSubscription.current.remove();
                dataSubscription.current = null;
              }
            } else {
              Alert.alert('Read Error', `Error reading from scanner: ${bleError.message}`);
            }
            return;
          }
          if (characteristic?.value) {
            const rawData = Buffer.from(characteristic.value, 'base64');
            const decodedData = rawData.toString('utf-8');
            console.log('Received data from BT:', decodedData);
            processScannedData(decodedData.trim(), 'BLUETOOTH_SCANNER');
          }
        }
      );
      console.log(`Subscribed to characteristic ${YOUR_SCANNER_CHARACTERISTIC_UUID} on service ${YOUR_SCANNER_SERVICE_UUID}.`);
      setIsBluetoothConnecting(false);
    } catch (error: any) {
      console.error('Connection/Subscription error:', error.message || error.reason || error);
      Alert.alert('Connection Failed', `Could not connect to ${device.name || device.id}: ${error.message || error.reason || 'Unknown error'}`);
      setConnectedBluetoothDevice(null);
      setIsBluetoothConnecting(false);
      try {
        await device.cancelConnection();
      } catch (cancelError) {
        console.error('Error cancelling partial connection:', cancelError);
      }
    }
  };

  const handleConnectBluetoothScanner = async () => {
    if (connectedBluetoothDevice) {
      console.log('Disconnecting from:', connectedBluetoothDevice.name || connectedBluetoothDevice.id);
      setIsBluetoothConnecting(true);
      try {
        if (dataSubscription.current) {
          dataSubscription.current.remove();
          dataSubscription.current = null;
        }
        await connectedBluetoothDevice.cancelConnection();
        console.log('Disconnected successfully.');
      } catch (error: any) {
        console.error('Disconnection error:', error.message || error);
        Alert.alert('Disconnection Error', `Failed to disconnect: ${error.message || error}`);
      } finally {
        setConnectedBluetoothDevice(null);
        setIsBluetoothConnecting(false);
      }
      return;
    }

    const hasPermission = bluetoothPermissionsGranted || await requestBluetoothPermissionsAsync();
    if (!hasPermission) {
      return;
    }
    if (bluetoothAdapterState !== BleState.PoweredOn) {
        Alert.alert('Bluetooth Not Powered On', 'Please turn on Bluetooth to connect to a scanner.');
        return;
    }

    setIsBluetoothConnecting(true);
    startScan();
  };

  useEffect(() => {
    bleStateSubscription.current = bleManager.onStateChange((state) => {
      console.log('Bluetooth adapter state changed to:', state);
      setBluetoothAdapterState(state);
      if (state === BleState.PoweredOff) {
        Alert.alert('Bluetooth is Off', 'Please turn on Bluetooth to use the scanner feature.');
        if (connectedBluetoothDevice) {
          connectedBluetoothDevice.cancelConnection()
            .then(() => console.log('Disconnected due to Bluetooth turning off.'))
            .catch(err => console.error('Error disconnecting due to BT off:', err));
          setConnectedBluetoothDevice(null);
        }
        setIsBluetoothConnecting(false);
        setDiscoveredDevices([]);
        setIsDeviceSelectionModalVisible(false);
      }
    }, true);

    return () => {
      console.log('Cleaning up ScanItemsScreen BLE resources...');
      bleStateSubscription.current?.remove();
      bleManager.stopDeviceScan();
      if (dataSubscription.current) {
        console.log('Removing data subscription.');
        dataSubscription.current.remove();
        dataSubscription.current = null;
      }
      if (connectedBluetoothDevice) {
        console.log('Cancelling connection to', connectedBluetoothDevice.name || connectedBluetoothDevice.id, 'on unmount/dependency change.');
        connectedBluetoothDevice.cancelConnection()
          .catch(err => console.error('Error cancelling connection during cleanup:', err));
      }
    };
  }, [bleManager, connectedBluetoothDevice]);

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
          { (isBluetoothConnecting || !!connectedBluetoothDevice) &&
            <ThemedText style={{textAlign: 'center', opacity: 0.7, marginTop: -16, marginBottom: 8}}>Camera scanning disabled while Bluetooth scanner is active/connecting.</ThemedText>
          }

          {/* Bluetooth Scanner Section */}
          <View style={styles.bluetoothSection}>
            <ThemedText type="subtitle" style={{marginBottom: 8, textAlign: 'center'}}>Or Use Bluetooth Scanner</ThemedText>
            <Pressable
              style={({ pressed }) => [
                styles.scanButton,
                { backgroundColor: connectedBluetoothDevice ? (commonColors.danger) : Colors[colorScheme ?? 'light'].tint },
                pressed && styles.scanButtonPressed,
              ]}
              onPress={handleConnectBluetoothScanner}
              disabled={isBluetoothConnecting}
            >
              <IconSymbol
                name={connectedBluetoothDevice ? "antenna.radiowaves.left.and.right.slash" : "antenna.radiowaves.left.and.right"}
                size={24}
                style={[styles.scanButtonIcon, { color: colorScheme === 'dark' ? Colors.light.text : '#FFFFFF' }]}
              />
              <ThemedText style={[styles.scanButton, { color: colorScheme === 'dark' ? Colors.light.text : '#FFFFFF' }]}>
                {isBluetoothConnecting ? "Connecting..." : (connectedBluetoothDevice ? `Disconnect ${connectedBluetoothDevice.name || 'Scanner'}` : "Connect Bluetooth Scanner")}
              </ThemedText>
            </Pressable>
            {connectedBluetoothDevice && (
              <ThemedText style={{textAlign: 'center', marginTop: 8}}>
                Connected to: {connectedBluetoothDevice.name || connectedBluetoothDevice.id}
              </ThemedText>
            )}
          </View>

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
                <ThemedText>{scannedItem.type === 'BLUETOOTH_SCANNER' ? 'Bluetooth Scanner' : `Camera (${scannedItem.type})`}</ThemedText>
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
                Use camera or connect a Bluetooth scanner.
              </ThemedText>
            </ThemedView>
          )}
        </ThemedView>
      )}

      <Modal
        animationType="slide"
        transparent={true}
        visible={isDeviceSelectionModalVisible}
        onRequestClose={() => {
          setIsDeviceSelectionModalVisible(false);
          bleManager.stopDeviceScan();
          setIsBluetoothConnecting(false);
        }}>
        <View style={styles.modalCenteredView}>
          <View style={[styles.modalView, { backgroundColor: Colors[colorScheme ?? 'light'].background }]}>
            <ThemedText type="subtitle" style={{ marginBottom: 15, textAlign: 'center' }}>Select Bluetooth Scanner</ThemedText>
            {discoveredDevices.length === 0 && isBluetoothConnecting && (
              <ThemedText style={{ textAlign: 'center', marginVertical: 20 }}>Scanning for devices...</ThemedText>
            )}
            {discoveredDevices.length === 0 && !isBluetoothConnecting && (
              <ThemedText style={{ textAlign: 'center', marginVertical: 20 }}>No devices found. Ensure your scanner is on and discoverable.</ThemedText>
            )}
            <FlatList
              data={discoveredDevices}
              keyExtractor={item => item.id}
              renderItem={({ item }) => (
                <Pressable
                  style={({ pressed }) => [
                    styles.deviceItem,
                    { backgroundColor: Colors[colorScheme ?? 'light'].cardBackground || (colorScheme === 'light' ? '#f0f0f0' : '#333') },
                    pressed && { opacity: 0.7 }
                  ]}
                  onPress={() => handleSelectDevice(item)}>
                  <ThemedText type="defaultSemiBold">{item.name || item.localName || 'Unnamed Device'}</ThemedText>
                  <ThemedText style={{ fontSize: 12, opacity: 0.7 }}>{item.id}</ThemedText>
                </Pressable>
              )}
              ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
              style={{maxHeight: 250}}
            />
            <View style={{marginTop: 15}}>
              <Button
                title="Cancel Scan"
                onPress={() => {
                  setIsDeviceSelectionModalVisible(false);
                  bleManager.stopDeviceScan();
                  setIsBluetoothConnecting(false);
                }}
                color={commonColors.danger}
              />
            </View>
          </View>
        </View>
      </Modal>
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
  // --- New Styles for Bluetooth Section ---
  bluetoothSection: {
    // marginTop: 16, // Gap is handled by contentContainer
    paddingVertical: 16,
    paddingHorizontal: 8,
    borderRadius: 8,
    // backgroundColor: colorScheme === 'light' ? '#f0f0f0' : '#2c2c2c', // Example: Use ThemedView for this section for auto light/dark
  },
  // --- Modal Styles ---
  modalCenteredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalView: {
    margin: 20,
    borderRadius: 20,
    padding: 25,
    alignItems: 'stretch',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    width: '90%',
    maxHeight: '80%',
  },
  deviceItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
});
