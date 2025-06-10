import { FlatList, StyleSheet, View } from 'react-native'; // Added FlatList and View

import Card from '@/components/Card';
import ParallaxScrollView from '@/components/ParallaxScrollView';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol'; // Added import
import { Colors } from '@/constants/Colors'; // Added import for button styling
import { useColorScheme } from '@/hooks/useColorScheme';

interface Order {
  id: string;
  orderNumber: string;
  status: string;
  date: string;
  items: number;
}

const dummyOrders: Order[] = [
  { id: '1', orderNumber: 'ORD1001', status: 'Received', date: '2024-07-28', items: 5 },
  { id: '2', orderNumber: 'ORD1002', status: 'Processing', date: '2024-07-27', items: 12 },
  { id: '3', orderNumber: 'ORD1003', status: 'Completed', date: '2024-07-26', items: 3 },
  { id: '4', orderNumber: 'ORD1004', status: 'Received', date: '2024-07-25', items: 8 },
  { id: '5', orderNumber: 'ORD1005', status: 'Processing', date: '2024-07-24', items: 6 },
  // Add more dummy data as needed
];

export default function AllOrdersScreen() {
  const colorScheme = useColorScheme();

  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: '#A1CEDC', dark: '#1D3D47' }}
      headerImage={
        <IconSymbol // Changed icon to something order-related
          name="list.bullet.rectangle.portrait.fill"
          size={200} // Adjusted size
          color={colorScheme === 'light' ? Colors.light.icon : Colors.dark.icon}
          style={styles.headerIcon}
        />
      }>
      <ThemedView style={styles.titleContainer}>
        <ThemedText type="title">Inventory & Orders</ThemedText>
        {/* Changed title */}
        <ThemedText type="title">All Orders</ThemedText>
      </ThemedView>

      {/* Use FlatList for efficient rendering of a list */}
      <FlatList
        data={dummyOrders}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContentContainer}
        renderItem={({ item }) => (
          <Card title={`Order #${item.orderNumber}`}>
            <View style={styles.cardDetailRow}>
              <ThemedText type="defaultSemiBold">Status:</ThemedText>
              <ThemedText>{item.status}</ThemedText>
            </View>
            <View style={styles.cardDetailRow}>
              <ThemedText type="defaultSemiBold">Date:</ThemedText>
              <ThemedText>{item.date}</ThemedText>
            </View>
            <View style={styles.cardDetailRow}>
              <ThemedText type="defaultSemiBold">Items:</ThemedText>
              <ThemedText>{item.items}</ThemedText>
            </View>
          </Card>
        )}
      />
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  titleContainer: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16, // Added padding
    marginTop: 16,      // Added margin
  },
  listContentContainer: {
    padding: 16, // Add padding around the list
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
  cardDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  }
});
