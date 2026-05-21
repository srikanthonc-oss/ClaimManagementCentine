import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import { authRoutes } from './routes/auth'
import { claimsRoutes } from './routes/claims'
import { dataSourcesRoutes } from './routes/dataSources'
import { usersRoutes } from './routes/users'
import { dashboardRoutes } from './routes/dashboard'
import { thresholdsRoutes } from './routes/thresholds'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 4000

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}))
app.use(express.json({ limit: '50mb' }))

// Routes
app.use('/api/auth', authRoutes)
app.use('/api/claims', claimsRoutes)
app.use('/api/data-sources', dataSourcesRoutes)
app.use('/api/users', usersRoutes)
app.use('/api/dashboard', dashboardRoutes)
app.use('/api/thresholds', thresholdsRoutes)

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

app.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`)
})

export default app
