import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // 从 CSS 变量映射 - 背景色
        'page-bg': '#F8F9FA',
        'sidebar-bg': '#0F1419',
        'card-bg': '#1A1F35',
        'card-warm': '#FFF5F0',
        'dark-section': '#0F1419',
        'placeholder': '#2A2F45',
        'avatar-bg': '#FFE5D9',

        // 主色调 (Tech/Cyber for articles)
        'primary-cyan': '#00F0FF',
        'primary-blue': '#0066FF',
        'primary-purple': '#8B5CF6',
        'primary-pink': '#FF006E',
        'primary-green': '#00FF9F',

        // 暖色调 (Tags and bio)
        'warm-coral': '#FF6B6B',
        'warm-orange': '#FF8C42',
        'warm-peach': '#FFAB73',
        'warm-yellow': '#FFD93D',
        'warm-pink': '#FF9ECD',

        // 基础色
        'black': '#000000',
        'white': '#FFFFFF',

        // 灰度 - 深色系列 (Dark for articles)
        'gray-dark': '#0F1419',
        'gray-700': '#1A1F35',
        'gray-600': '#2A2F45',
        'gray-500': '#3A3F55',
        'gray-400': '#4A4F65',
        'gray-300': '#5A5F75',
        'gray-200': '#6A6F85',

        // 灰度 - 浅色系列 (Light for general)
        'gray-light-100': '#F8F9FA',
        'gray-light-200': '#E9ECEF',
        'gray-light-300': '#DEE2E6',
        'gray-light-400': '#CED4DA',

        // 边框色
        'border-light': '#2A2F45',
        'border-dark': '#0F1419',
        'border-warm': '#FFE8DD',

        // 文本色
        'text-primary': '#212529',
        'text-card-light': '#FFFFFF',
        'text-secondary': '#6C757D',
        'text-tertiary': '#ADB5BD',
        'text-muted': '#DEE2E6',
        'text-light': '#FFFFFF',
      },

      spacing: {
        // 从 --space-* 映射
        '1': '2px',
        '2': '6px',
        '3': '8px',
        '4': '12px',
        '5': '14px',
        '6': '16px',
        '7': '20px',
        '8': '24px',
        '9': '28px',
        '10': '32px',
        '11': '48px',
        '12': '52px',
        '13': '56px',
      },

      fontFamily: {
        display: ['Instrument Serif', 'serif'],
        body: ['Inter', 'sans-serif'],
      },

      fontSize: {
        'xs': '12px',
        'sm': '13px',
        'base': '14px',
        'lg': '16px',
        'xl': '18px',
        '2xl': '20px',
        '3xl': '24px',
        '4xl': '32px',
        '5xl': '44px',
        '6xl': '64px',
        'logo': '28px',
      },

      borderRadius: {
        'none': '0px',
        'avatar': '20px',
      },

      keyframes: {
        bounce: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-8px)' },
        },
        'scan-line': {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100%)' },
        },
        'float-background': {
          '0%, 100%': { transform: 'translateY(0) scale(1)' },
          '50%': { transform: 'translateY(-20px) scale(1.05)' },
        },
      },

      animation: {
        bounce: 'bounce 2s ease-in-out infinite',
        'scan-line': 'scan-line 4s ease-in-out infinite',
        'float-bg': 'float-background 20s ease-in-out infinite',
      },

      // 自定义过渡时长
      transitionDuration: {
        '400': '400ms',
        '500': '500ms',
        '600': '600ms',
      },
    },
  },
  plugins: [],
};

export default config;
