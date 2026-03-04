import { NextApiRequest, NextApiResponse } from 'next';
import { query } from '../../../lib/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      message: '方法不允许',
    });
  }

  try {
    const { postId } = req.body;

    if (!postId) {
      return res.status(400).json({
        success: false,
        message: '文章ID不能为空',
      });
    }

    // 增加浏览数
    const result = await query(
      'UPDATE posts SET views = views + 1 WHERE id = $1 RETURNING views',
      [postId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: '文章不存在',
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        views: result.rows[0].views,
      },
    });
  } catch (error) {
    console.error('Track view error:', error);
    return res.status(500).json({
      success: false,
      message: '记录浏览失败',
    });
  }
}
