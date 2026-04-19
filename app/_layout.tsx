import { ThemeProvider } from '@react-navigation/native'
import { Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import 'react-native-reanimated'

import { Colors } from '@/constants/theme'
import { useColorScheme } from '@/hooks/use-color-scheme'

export const unstable_settings = {
  anchor: '(tabs)',
}

const navigationTheme = {
  dark: true,
  colors: {
    primary: Colors.light.primary,
    background: Colors.light.background,
    card: Colors.light.background,
    text: Colors.light.foreground,
    border: Colors.light.border,
    notification: Colors.light.accent,
  },
  fonts: {
    regular: {
      fontFamily: 'System',
      fontWeight: '400' as const,
    },
    medium: {
      fontFamily: 'System',
      fontWeight: '500' as const,
    },
    bold: {
      fontFamily: 'System',
      fontWeight: '700' as const,
    },
    heavy: {
      fontFamily: 'System',
      fontWeight: '800' as const,
    },
  },
}

export default function RootLayout() {
  useColorScheme()

  return (
    <ThemeProvider value={navigationTheme}>
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
