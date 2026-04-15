import { Request, Response, NextFunction } from 'express'

export function errorHandler(
  err: Error & { status?: number },
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  console.error(err)
  const status = err.status || 500
  const message = err.message || '서버 오류가 발생했습니다.'
  res.status(status).json({ success: false, message })
}
