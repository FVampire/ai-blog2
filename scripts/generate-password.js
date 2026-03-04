// 生成密码hash的测试脚本
// 运行: node scripts/generate-password.js

const bcrypt = require('bcryptjs');

const password = 'admin123';
const saltRounds = 10;

async function generateHash() {
  try {
    const hash = await bcrypt.hash(password, saltRounds);
    console.log('Password:', password);
    console.log('Generated hash:', hash);
    console.log('\n--- 验证hash ---');

    // 验证hash
    const isValid = await bcrypt.compare(password, hash);
    console.log('Hash验证结果:', isValid);

    console.log('\n--- SQL语句 ---');
    console.log(`
UPDATE users SET password_hash = '${hash}' WHERE username = 'admin';
    `);

    console.log('\n--- 或者创建新用户 ---');
    console.log(`
INSERT INTO users (username, email, password_hash, role, status)
VALUES ('admin', 'admin@example.com', '${hash}', 'admin', 'active')
ON CONFLICT (username) DO UPDATE SET password_hash = EXCLUDED.password_hash;
    `);
  } catch (error) {
    console.error('Error:', error);
  }
}

generateHash();
