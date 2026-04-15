import express, { Express } from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

import authRouter from './routes/auth.js'
import categoriesRouter from './routes/categories.js'
import accountsRouter from './routes/accounts.js'
import transactionsRouter from './routes/transactions.js'
import budgetsRouter from './routes/budgets.js'
import statsRouter from './routes/stats.js'
import notificationsRouter from './routes/notifications.js'
import { errorHandler } from './middleware/errorHandler.js'

dotenv.config()

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const app: Express = express()
const PORT = parseInt(process.env.PORT ?? '4000', 10)

app.use(cors())
app.use(express.json())

app.use('/api/auth', authRouter)
app.use('/api/categories', categoriesRouter)
app.use('/api/accounts', accountsRouter)
app.use('/api/transactions', transactionsRouter)
app.use('/api/budgets', budgetsRouter)
app.use('/api/stats', statsRouter)
app.use('/api/notifications', notificationsRouter)

app.get('/api/health', (_req, res) => {
  res.json({ success: true, message: '서버 정상 동작 중' })
})

app.use(errorHandler)

// 프로덕션: React 빌드 정적 파일 서빙
if (process.env.NODE_ENV === 'production') {
  const clientDist = path.resolve(__dirname, '../../client/dist')
  app.use(express.static(clientDist))
  app.get('*', (_req, res) => {
    res.sendFile(path.join(clientDist, 'index.html'))
  })
}

app.listen(PORT, () => {
  console.log(`서버 실행 중: http://localhost:${PORT}`)
})
