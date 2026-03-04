import { NextApiRequest, NextApiResponse } from "next";
import { query } from "../../../../lib/db";
import {
  needsModeration,
  getFilterReason,
} from "../../../../lib/content-filter";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { id } = req.query;

  if (!id || Array.isArray(id)) {
    return res.status(400).json({
      success: false,
      message: "无效的文章ID",
    });
  }

  try {
    // GET - 获取文章的所有已批准评论（公开访问）
    if (req.method === "GET") {
      const result = await query(
        `SELECT
          id, visitor_id, content, created_at
         FROM comments
         WHERE post_id = $1 AND status = 'approved'
         ORDER BY created_at DESC`,
        [id]
      );

      return res.status(200).json({
        success: true,
        data: result.rows,
      });
    }

    // POST - 提交新评论
    if (req.method === "POST") {
      const { visitorId, content } = req.body;

      if (!visitorId || !content) {
        return res.status(400).json({
          success: false,
          message: "访客ID和评论内容不能为空",
        });
      }

      // 验证内容长度
      if (content.trim().length < 2) {
        return res.status(400).json({
          success: false,
          message: "评论内容至少需要2个字符",
        });
      }

      if (content.length > 1000) {
        return res.status(400).json({
          success: false,
          message: "评论内容不能超过1000个字符",
        });
      }

      // 检测违禁词
      const needsReview = needsModeration(content);
      const status = needsReview ? "pending" : "approved";

      // 获取IP地址
      const forwarded =
        req.headers["x-forwarded-for"] || req.headers["x-real-ip"]; // 最常用（代理服务器设置）
      const ipAddress = forwarded
        ? Array.isArray(forwarded)
          ? forwarded[0]
          : forwarded.split(",")[0]
        : req.socket.remoteAddress || "unknown";

      let city = "";
      if (ipAddress) {
        const result = await fetch(
          `http://ip-api.com/json/${ipAddress}?lang=zh-CN`
        );
        if (result.ok) {
          const data = await result.json();
          city = data.city || "";
        }
      }
      // 插入评论
      const result = await query(
        `INSERT INTO comments (post_id, visitor_id, ip_address, city, content, status)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING id, visitor_id, content, city, status, created_at`,
        [id, visitorId, ipAddress, city, content.trim(), status]
      );

      // 如果需要审核，记录原因
      if (needsReview) {
        const reason = getFilterReason(content);
        console.log(
          `Comment ${result.rows[0].id} flagged for review: ${reason}`
        );
      }

      return res.status(201).json({
        success: true,
        message: needsReview
          ? "评论提交成功，包含敏感内容，等待审核"
          : "评论提交成功",
        data: result.rows[0],
        needsReview,
      });
    }

    return res.status(405).json({
      success: false,
      message: "方法不允许",
    });
  } catch (error) {
    console.error("Comments API error:", error);
    return res.status(500).json({
      success: false,
      message: "服务器错误",
    });
  }
}
