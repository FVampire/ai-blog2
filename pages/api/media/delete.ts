import { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'DELETE') {
    return res.status(405).json({ success: false, message: '方法不允许' });
  }

  try {
    const { filename } = req.body;

    if (!filename) {
      return res.status(400).json({
        success: false,
        message: '缺少文件名参数',
      });
    }

    // 安全检查：防止路径遍历攻击
    const safeFilename = path.basename(filename);
    const filePath = path.join(process.cwd(), 'public', 'uploads', safeFilename);

    // 检查文件是否存在
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        message: '文件不存在',
      });
    }

    // 删除文件
    fs.unlinkSync(filePath);

    return res.status(200).json({
      success: true,
      message: '删除成功',
    });
  } catch (error) {
    console.error('Delete image error:', error);
    return res.status(500).json({
      success: false,
      message: '删除失败',
      error: error instanceof Error ? error.message : '未知错误',
    });
  }
}
