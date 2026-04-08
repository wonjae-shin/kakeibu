import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'

import authRouter from './routes/auth.js'
import categoriesRouter from './routes/categories.js'
import accountsRouter from './routes/accounts.js'
import transactionsRouter from './routes/transactions.js'
import budgetsRouter from './routes/budgets.js'
import statsRouter from './routes/stats.js'
import { errorHandler } from './middleware/errorHandler.js'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 4000

app.use(cors())
app.use(express.json())

app.use('/api/auth', authRouter)
app.use('/api/categories', categoriesRouter)
app.use('/api/accounts', accountsRouter)
app.use('/api/transactions', transactionsRouter)
app.use('/api/budgets', budgetsRouter)
app.use('/api/stats', statsRouter)

app.get('/api/health', (req, res) => {
  res.json({ success: true, message: '서버 정상 동작 중' })
})

app.use(errorHandler)

app.listen(PORT, () => {
  console.log(`서버 실행 중: http://localhost:${PORT}`)
})
