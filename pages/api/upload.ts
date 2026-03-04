import { NextApiRequest, NextApiResponse } from 'next';
import formidable from 'formidable';
import fs from 'fs';
import path from 'path';

// 禁用默认的body parser
export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: '方法不允许' });
  }

  try {
    // 确保uploads目录存在
    const uploadDir = path.join(process.cwd(), 'public', 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    // 配置formidable
    const form = formidable({
      uploadDir,
      keepExtensions: true,
      maxFileSize: 10 * 1024 * 1024, // 10MB
      filename: (name, ext, part) => {
        // 生成唯一文件名
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        return `${uniqueSuffix}${ext}`;
      },
    });

    // 解析表单数据
    const [fields, files] = await form.parse(req);

    // 获取上传的文件
    const uploadedFile = files.file?.[0];

    if (!uploadedFile) {
      return res.status(400).json({
        success: false,
        message: '没有找到上传的文件',
      });
    }

    // 返回文件URL
    const fileUrl = `/uploads/${path.basename(uploadedFile.filepath)}`;

    return res.status(200).json({
      success: true,
      message: '上传成功',
      data: {
        url: fileUrl,
        filename: uploadedFile.originalFilename,
        size: uploadedFile.size,
        mimetype: uploadedFile.mimetype,
      },
    });
  } catch (error) {
    console.error('Upload error:', error);
    return res.status(500).json({
      success: false,
      message: '上传失败',
      error: error instanceof Error ? error.message : '未知错误',
    });
  }
}
