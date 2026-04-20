/**
 * 游戏社区 App - 颜色主题
 * 基于 UI/UX Pro Max Vibrant & Block-based 设计系统
 * 风格：暗色系、游戏风、活力感
 */

import { Platform } from 'react-native'

export const Colors = {
  light: {
    // 主色系
    primary: '#7C3AED',       // 紫色
    onPrimary: '#FFFFFF',     // 主色上文字
    secondary: '#A78BFA',     // 次紫色
    accent: '#F43F5E',        // 玫红-行动按钮
    background: '#0F0F23',    // 深色背景
    foreground: '#E2E8F0',    // 浅色文字
    muted: '#27273B',         // 卡片背景
    border: '#4C1D95',         // 边框
    destructive: '#EF4444',   // 危险/删除
    ring: '#7C3AED',          // 聚焦环

    // 文字颜色
    text: '#E2E8F0',
    textSecondary: '#94A3B8',
    textMuted: '#64748B',

    // Tab 栏
    tabBarBackground: '#0F0F23',
    tabBarBorder: '#27273B',
    tabIconDefault: '#64748B',
    tabIconSelected: '#7C3AED',
    tint: '#7C3AED',
    icon: '#94A3B8',
  },
  dark: {
    // 主色系
    primary: '#7C3AED',       // 紫色
    onPrimary: '#FFFFFF',     // 主色上文字
    secondary: '#A78BFA',     // 次紫色
    accent: '#F43F5E',        // 玫红-行动按钮
    background: '#0F0F23',    // 深色背景
    foreground: '#E2E8F0',    // 浅色文字
    muted: '#27273B',         // 卡片背景
    border: '#4C1D95',         // 边框
    destructive: '#EF4444',   // 危险/删除
    ring: '#7C3AED',          // 聚焦环

    // 文字颜色
    text: '#E2E8F0',
    textSecondary: '#94A3B8',
    textMuted: '#64748B',

    // Tab 栏
    tabBarBackground: '#0F0F23',
    tabBarBorder: '#27273B',
    tabIconDefault: '#64748B',
    tabIconSelected: '#7C3AED',
    tint: '#7C3AED',
    icon: '#94A3B8',
  },
}

/**
 * 阴影配置 - 暗色主题专用
 * 紫色发光效果
 */
export const Shadows = {
  card: {
    boxShadow: '0px 4px 12px rgba(124, 58, 237, 0.3)',
    elevation: 8,
  },
  button: {
    boxShadow: '0px 2px 8px rgba(124, 58, 237, 0.4)',
    elevation: 4,
  },
  glow: {
    boxShadow: '0px 0px 20px rgba(124, 58, 237, 0.6)',
    elevation: 0,
  },
}

export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
})
