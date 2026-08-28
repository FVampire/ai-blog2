import Footer from '@/components/Footer';
import Header from '@/components/Header';
import ToolsWorkspace from '@/components/tools/ToolsWorkspace';
import { TOOLS } from '@/lib/tools/registry';

export default function ToolsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <Header />
      <ToolsWorkspace tools={TOOLS}>{children}</ToolsWorkspace>
      <Footer />
    </div>
  );
}
