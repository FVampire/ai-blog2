import React, { useState } from 'react';
import Head from 'next/head';
import Header from '../components/Header';
import Footer from '../components/Footer';
import ImageUpload from '../components/ImageUpload';

const ImageUploadDemo: React.FC = () => {
  const [uploadedUrl, setUploadedUrl] = useState<string>('');

  const handleUploadSuccess = (imageUrl: string) => {
    console.log('✅ 图片上传成功:', imageUrl);
    setUploadedUrl(imageUrl);
  };

  const handleUploadError = (error: string) => {
    console.error('❌ 图片上传失败:', error);
  };

  return (
    <div>
      <Head>
        <title>图片上传演示 - 五月的火</title>
        <meta name="description" content="测试图片上传功能" />
      </Head>

      <Header />

      <div className="container" style={{ paddingTop: '48px', paddingBottom: '48px' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <h1 style={{ marginBottom: '24px', fontSize: '32px', fontWeight: '700' }}>
            图片上传演示
          </h1>

          <div style={{ marginBottom: '32px' }}>
            <h2 style={{ marginBottom: '16px', fontSize: '20px', fontWeight: '600' }}>
              上传你的图片
            </h2>
            <p style={{ marginBottom: '24px', color: '#6C757D' }}>
              支持点击选择文件或拖拽图片到上传区域，实时预览上传进度。
            </p>

            <ImageUpload
              onUploadSuccess={handleUploadSuccess}
              onUploadError={handleUploadError}
            />
          </div>

          {uploadedUrl && (
            <div style={{
              marginTop: '32px',
              padding: '24px',
              backgroundColor: '#F8F9FA',
              borderRadius: '12px',
              border: '1px solid #DEE2E6'
            }}>
              <h3 style={{ marginBottom: '16px', fontSize: '18px', fontWeight: '600' }}>
                上传成功 ✅
              </h3>
              <div style={{ marginBottom: '12px' }}>
                <strong>图片URL:</strong>
                <div style={{
                  marginTop: '8px',
                  padding: '12px',
                  backgroundColor: 'white',
                  borderRadius: '6px',
                  fontFamily: 'monospace',
                  fontSize: '14px',
                  wordBreak: 'break-all'
                }}>
                  {uploadedUrl}
                </div>
              </div>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(uploadedUrl);
                  alert('已复制到剪贴板');
                }}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#FF6B6B',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '500',
                  transition: 'all 0.3s ease'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.backgroundColor = '#FF8C42';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.backgroundColor = '#FF6B6B';
                }}
              >
                复制链接
              </button>
            </div>
          )}

          <div style={{
            marginTop: '48px',
            padding: '24px',
            backgroundColor: '#FFF3CD',
            borderRadius: '12px',
            border: '1px solid #FFE69C'
          }}>
            <h3 style={{ marginBottom: '16px', fontSize: '18px', fontWeight: '600' }}>
              📝 使用说明
            </h3>
            <ul style={{ paddingLeft: '24px', lineHeight: '1.8' }}>
              <li>支持 JPG、PNG、GIF 等图片格式</li>
              <li>最大文件大小：10MB</li>
              <li>支持拖拽上传</li>
              <li>实时显示上传进度</li>
              <li>上传后可预览和删除图片</li>
            </ul>
          </div>

          <div style={{
            marginTop: '32px',
            padding: '24px',
            backgroundColor: '#D1ECF1',
            borderRadius: '12px',
            border: '1px solid #BEE5EB'
          }}>
            <h3 style={{ marginBottom: '16px', fontSize: '18px', fontWeight: '600' }}>
              💡 组件使用示例
            </h3>
            <pre style={{
              padding: '16px',
              backgroundColor: '#263238',
              color: '#AABFC9',
              borderRadius: '8px',
              overflow: 'auto',
              fontSize: '14px',
              lineHeight: '1.6'
            }}>
{`import ImageUpload from '../components/ImageUpload';

function MyComponent() {
  const [imageUrl, setImageUrl] = useState('');

  return (
    <ImageUpload
      onUploadSuccess={(url) => setImageUrl(url)}
      onUploadError={(error) => console.error(error)}
      defaultImage="/path/to/default.jpg"
      disabled={false}
    />
  );
}`}
            </pre>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default ImageUploadDemo;
