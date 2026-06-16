import jwt from 'jsonwebtoken';

// JWT Secret 安全加固：必须在环境变量中设置，禁止硬编码 fallback
const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

// 在应用启动时检查 JWT_SECRET 是否设置
if (!JWT_SECRET) {
  throw new Error(
    'JWT_SECRET environment variable is required. ' +
    'Please set a strong secret key in your .env file.'
  );
}

export interface JWTPayload {
  userId: number;
  username: string;
  email: string;
  role: string;
}

export const generateToken = (payload: JWTPayload): string => {
  // @ts-expect-error - expiresIn accepts string like '7d'
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
};

export const verifyToken = (token: string): JWTPayload | null => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
    return decoded;
  } catch (error) {
    console.error('JWT verification failed:', error);
    return null;
  }
};

export const decodeToken = (token: string): JWTPayload | null => {
  try {
    const decoded = jwt.decode(token) as JWTPayload;
    return decoded;
  } catch (error) {
    console.error('JWT decode failed:', error);
    return null;
  }
};
