/**
 * Tab 导航布局
 * 首页 / 发布 / 我的
 * 按首页浅色产品化方案统一头部与底部样式，不改交互结构
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
          title: '',
          tabBarShowLabel: false,
          tabBarIcon: () => (
            <View style={styles.createButton}>
              <MaterialIcons name="add" size={24} color="#fff" />
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
    paddingTop: 6,
    paddingBottom: 8,
    height: 88,
    boxShadow: '0px -8px 24px rgba(15, 23, 42, 0.06)',
    elevation: 8,
  },
  tabBarLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
    marginBottom: 0,
    lineHeight: 16,
  },
  tabBarItem: {
    paddingTop: 4,
    paddingBottom: 4,
    justifyContent: 'center',
  },
  tabBarIcon: {
    marginTop: 0,
    marginBottom: 0,
  },
  header: {
    backgroundColor: Colors.light.background,
    boxShadow: '0px 6px 20px rgba(15, 23, 42, 0.04)',
    elevation: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#EDF2F7',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.light.foreground,
    letterSpacing: 0.2,
  },
  createButton: {
    width: 46,
    height: 46,
    backgroundColor: Colors.light.accent,
    borderRadius: 23,
    justifyContent: 'center',
    alignItems: 'center',
    boxShadow: '0px 10px 22px rgba(79, 70, 229, 0.22)',
    elevation: 6,
  },
})
