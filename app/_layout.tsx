import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import Head from 'expo-router/head';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { Analytics } from "@vercel/analytics/react"; // 1. Import Analytics
import { SpeedInsights } from "@vercel/speed-insights/react"; // 2. Import Speed Insights

import { useColorScheme } from '@/hooks/use-color-scheme';

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Head>
        <title>CinemaDrive</title>
        <meta name="description" content="An app to manage and stream my personal movie collection." />
        <meta name="google-site-verification" content="EXPO_PUBLIC_GOOGLE_SITE_VERIFICATION" />
      </Head>
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
