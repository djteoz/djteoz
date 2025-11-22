import jwt from "jsonwebtoken";

const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || "access_secret";
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || "refresh_secret";

import type { SignOptions } from "jsonwebtoken";

export function signAccessToken(
  payload: string | object | Buffer,
  expiresIn: string = "15m"
) {
  return jwt.sign(
    payload,
    ACCESS_SECRET as jwt.Secret,
    { expiresIn } as SignOptions
  );
}

export function signRefreshToken(
  payload: string | object | Buffer,
  expiresIn: string = "30d"
) {
  return jwt.sign(
    payload,
    REFRESH_SECRET as jwt.Secret,
    { expiresIn } as SignOptions
  );
}

export function verifyAccessToken(token: string) {
  return jwt.verify(token, ACCESS_SECRET);
}

export function verifyRefreshToken(token: string) {
  return jwt.verify(token, REFRESH_SECRET);
}
