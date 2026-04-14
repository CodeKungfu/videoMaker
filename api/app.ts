/**
 * This is a API server
 */

import express, {
  type Request,
  type Response,
  type NextFunction,
} from 'express'
import express from 'express'
import cors from 'cors'
import path from 'path'
import { fileURLToPath } from 'url'
import authRoutes from './routes/auth.js'
import projectsRoutes from './routes/projects.js'
import shotsRoutes from './routes/shots.js'
import assetsRoutes from './routes/assets.js'
import uploadRoutes from './routes/upload.js'
import settingsRoutes from './routes/settings.js'

// for esm mode
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// load env
dotenv.config()

const app: express.Application = express()

app.use(cors())
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

// serve static uploads
app.use('/uploads', express.static(path.join(process.cwd(), 'public', 'uploads')))

/**
 * API Routes
 */
app.use('/api/auth', authRoutes)
app.use('/api/projects', projectsRoutes)
app.use('/api/shots', shotsRoutes)
app.use('/api/assets', assetsRoutes)
app.use('/api/upload', uploadRoutes)
app.use('/api/settings', settingsRoutes)

/**
 * health
 */
app.use(
  '/api/health',
  (req: Request, res: Response, next: NextFunction): void => {
    res.status(200).json({
      success: true,
      message: 'ok',
    })
  },
)

/**
 * error handler middleware
 */
app.use((error: Error, req: Request, res: Response, next: NextFunction) => {
  res.status(500).json({
    success: false,
    error: 'Server internal error',
  })
})

/**
 * 404 handler
 */
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: 'API not found',
  })
})

export default app
