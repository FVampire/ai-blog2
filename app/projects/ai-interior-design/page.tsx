import type { Metadata } from 'next';
export const metadata: Metadata = {
 title:'栖居 · AI 装修设计｜产品体验样例',
 description:'从户型导入、风格偏好、空间方案到效果预览，体验栖居的完整产品体验与空间设计样例。',
 openGraph:{images:['/uploads/ai-interior-design/03-living.webp']},
};
export default function InteriorDesignPage(){
 return <main style={{height:'100dvh',background:'#f7f8f3'}}><iframe src="/uploads/ai-interior-design/product/index.html" title="栖居 · AI装修设计产品体验" style={{border:0,width:'100%',height:'100%',display:'block'}} /></main>;
}
