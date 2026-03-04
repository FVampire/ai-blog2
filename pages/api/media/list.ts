import { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, message: '方法不允许' });
  }

  try {
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads');

    // 确保uploads目录存在
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
      return res.status(200).json({
        success: true,
        data: {
          images: [],
          total: 0,
        },
      });
    }

    // 读取目录中的所有文件
    const files = fs.readdirSync(uploadsDir);

    // 过滤出图片文件并获取文件信息
    const images = files
      .filter(file => {
        const ext = path.extname(file).toLowerCase();
        return ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp'].includes(ext);
      })
      .map(file => {
        const filePath = path.join(uploadsDir, file);
        const stats = fs.statSync(filePath);

        return {
          filename: file,
          url: `/uploads/${file}`,
          size: stats.size,
          uploadedAt: stats.birthtime,
          modifiedAt: stats.mtime,
        };
      })
      .sort((a, b) => {
        // 按上传时间倒序排列
        return new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime();
      });

    return res.status(200).json({
      success: true,
      data: {
        images,
        total: images.length,
      },
    });
  } catch (error) {
    console.error('Get images error:', error);
    return res.status(500).json({
      success: false,
      message: '获取图片列表失败',
      error: error instanceof Error ? error.message : '未知错误',
    });
  }
}
