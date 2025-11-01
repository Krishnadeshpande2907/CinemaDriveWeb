import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { Analytics } from "@vercel/analytics/react"; // 1. Import Analytics
import { SpeedInsights } from "@vercel/speed-insights/react"; // 2. Import Speed Insights

import { useColorScheme } from '@/hooks/use-color-scheme';

export const unstable_settings = {
  anchor: '(tabs)',
};

export const metadata = {
  title: 'Cinema Drive',
  description: 'An app to manage and stream my personal movie collection.',
  verification: {
    google: 'K6Vd7hoP0MhU3Kdb1LQKjbmlfO4RhJIU4fUZRiBZyxM',
  }
};

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
      </Stack>
      <StatusBar style="auto" />
      <Analytics /> 
      <SpeedInsights />
    </ThemeProvider>
  );
}
