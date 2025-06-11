import { Tabs } from 'expo-router';
import React from 'react';
import { Platform } from 'react-native';

import { HapticTab } from '@/components/HapticTab';
import { IconSymbol } from '@/components/ui/IconSymbol';
import TabBarBackground from '@/components/ui/TabBarBackground';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarBackground: TabBarBackground,
        tabBarStyle: Platform.select({
          ios: {
            // Use a transparent background on iOS to show the blur effect
            position: 'absolute',
          },
          default: {},
        }),
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="house.fill" color={color} />,
        }}
      />
      {/* Define the Scan Items tab */}
      <Tabs.Screen
        name="scanItems" // This matches the filename scanItems.tsx
        options={{
          title: 'Scan Items', // The title displayed in the tab bar
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="barcode.viewfinder" color={color} />, // Icon for the tab
        }}
      />
      {/* Define the All Orders tab */}
      <Tabs.Screen
        name="allOrders" // This matches the filename allOrders.tsx
        options={{
          title: 'All Orders', // The title displayed in the tab bar
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="list.bullet.rectangle.portrait.fill" color={color} />, // Icon for the tab
        }}
      />
    </Tabs>
  );
}
