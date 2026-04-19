import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native'
import { Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import 'react-native-reanimated'

import { Colors } from '@/constants/theme'
import { useColorScheme } from '@/hooks/use-color-scheme'

export const unstable_settings = {
  anchor: '(tabs)',
}

export default function RootLayout() {
  const colorScheme = useColorScheme()

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="search"
          options={{
            title: '搜索',
            headerStyle: { backgroundColor: Colors.light.background },
            headerTintColor: Colors.light.foreground,
            headerTitleStyle: {
              fontSize: 20,
              fontWeight: '700',
              color: Colors.light.foreground,
            },
          }}
        />
        <Stack.Screen
          name="post/[id]"
          options={{
            title: '帖子详情',
            headerStyle: { backgroundColor: Colors.light.background },
            headerTintColor: Colors.light.foreground,
            headerTitleStyle: {
              fontSize: 20,
              fontWeight: '700',
              color: Colors.light.foreground,
            },
          }}
        />
        <Stack.Screen
          name="admin"
          options={{
            title: '管理台',
            headerStyle: { backgroundColor: Colors.light.background },
            headerTintColor: Colors.light.foreground,
            headerTitleStyle: {
              fontSize: 20,
              fontWeight: '700',
              color: Colors.light.foreground,
            },
          }}
        />
        <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  )
}
