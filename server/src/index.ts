import http from 'http'
import app from './app'
import { config } from './config/env'
import { connectDB } from './config/db'
import { autoSeedAdmin } from './services/autoSeed'
import { setupSocket } from './sockets'
import { getIO } from './sockets'

async function start(): Promise<void> {
  await connectDB()
  await autoSeedAdmin()

  const httpServer = http.createServer(app)
  setupSocket(httpServer)

  httpServer.listen(config.port, () => {
    console.log(`Server running on port ${config.port} in ${config.nodeEnv} mode`)
  })
}

start().catch((err) => {
  console.error('Failed to start server:', err)
  process.exit(1)
})

export { getIO }
