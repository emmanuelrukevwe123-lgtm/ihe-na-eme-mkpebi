import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

// Serves api/*.js in `npm run dev` with a Vercel-like req/res, so the Vercel CLI is optional locally.
function localApi() {
  return {
    name: 'local-api',
    configureServer(server) {
      Object.assign(process.env, loadEnv(server.config.mode, process.cwd(), ''))
      server.middlewares.use('/api', async (req, res) => {
        const name = req.url.split('?')[0].replace(/^\//, '')
        if (!/^[a-z-]+$/.test(name)) return notFound(res)
        let mod
        try {
          mod = await server.ssrLoadModule(`/api/${name}.js`)
        } catch {
          return notFound(res)
        }
        let raw = ''
        for await (const chunk of req) raw += chunk
        try {
          req.body = raw ? JSON.parse(raw) : undefined
        } catch {
          req.body = undefined
        }
        res.status = (code) => ((res.statusCode = code), res)
        res.json = (data) => {
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify(data))
        }
        await mod.default(req, res)
      })
    },
  }
}

function notFound(res) {
  res.statusCode = 404
  res.end('Not found')
}

export default defineConfig({
  plugins: [react(), localApi()],
})
