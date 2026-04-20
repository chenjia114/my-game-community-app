/**
 * Tab 导航布局
 * 首页 / 发布 / 我的
 * 基于 Vibrant & Block-based 暗色游戏风
 */
import { Tabs } from 'expo-router'
import { MaterialIcons } from '@expo/vector-icons'
import { StyleSheet, View } from 'react-native'

import { Colors } from '@/constants/theme'

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors.light.tabIconSelected,
        tabBarInactiveTintColor: Colors.light.tabIconDefault,
        headerShown: true,
        tabBarStyle: styles.tabBar,
        tabBarLabelStyle: styles.tabBarLabel,
        tabBarItemStyle: styles.tabBarItem,
        tabBarIconStyle: styles.tabBarIcon,
        tabBarHideOnKeyboard: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: '首页',
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="home" size={size} color={color} />
          ),
          headerTitle: '虫友青春版',
          headerStyle: styles.header,
          headerTitleStyle: styles.headerTitle,
        }}
      />
      <Tabs.Screen
        name="create"
        options={{
          title: '发布',
          tabBarIcon: ({ color, size }) => (
            <View style={styles.createButton}>
              <MaterialIcons name="add" size={28} color="#fff" />
            </View>
          ),
          headerTitle: '发布帖子',
          headerStyle: styles.header,
          headerTitleStyle: styles.headerTitle,
        }}
      />
      <Tabs.Screen
        name="my"
        options={{
          title: '我的',
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="person" size={size} color={color} />
          ),
          headerTitle: '我的',
          headerStyle: styles.header,
          headerTitleStyle: styles.headerTitle,
        }}
      />
    </Tabs>
  )
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: Colors.light.tabBarBackground,
    borderTopWidth: 1,
    borderTopColor: Colors.light.tabBarBorder,
    paddingTop: 10,
    paddingBottom: 10,
    height: 88,
  },
  tabBarLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 4,
    marginBottom: 2,
  },
  tabBarItem: {
    paddingVertical: 4,
    justifyContent: 'center',
  },
  tabBarIcon: {
    marginTop: 2,
  },
  header: {
    backgroundColor: Colors.light.background,
    boxShadow: '0px 2px 8px rgba(124, 58, 237, 0.2)',
    elevation: 4,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.light.foreground,
    letterSpacing: 0.5,
  },
  createButton: {
    width: 48,
    height: 48,
    backgroundColor: Colors.light.accent,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    boxShadow: '0px 4px 8px rgba(244, 63, 94, 0.4)',
    elevation: 4,
  },
})
