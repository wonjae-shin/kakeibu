import jwt from 'jsonwebtoken'
import { Request, Response, NextFunction } from 'express'

export function authMiddleware(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ success: false, message: '인증이 필요합니다.' })
    return
  }

  const token = authHeader.split(' ')[1]
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET) as {
      userId: string
      email: string
    }
    req.user = payload
    next()
  } catch {
    res.status(401).json({ success: false, message: '유효하지 않은 토큰입니다.' })
  }
}
