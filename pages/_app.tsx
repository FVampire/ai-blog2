import '../styles/globals.css';
import type { AppProps } from 'next/app';
import { useRouter } from 'next/router';
import AIChatWidget from '../components/AIChatWidget';
import { ArticleProvider } from '../contexts/ArticleContext';

function MyApp({ Component, pageProps }: AppProps) {
  const router = useRouter();

  // 在后台管理页面不显示 AI 聊天组件
  const isAdminPage = router.pathname.startsWith('/admin');

  return (
    <ArticleProvider>
      <Component {...pageProps} />
      {!isAdminPage && <AIChatWidget />}
    </ArticleProvider>
  );
}

export default MyApp;