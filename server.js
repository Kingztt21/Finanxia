import express from 'express';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import path from 'path';
import dotenv from 'dotenv';

// Load .env file if it exists
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

// API route to get configuration
app.get('/api/config', (req, res) => {
  console.log('[API] GET /api/config');
  res.json({
    GROQ_API_KEY: process.env.GROQ_API_KEY || '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'
  });
});

// API route to call Groq
app.post('/api/chat', async (req, res) => {
  try {
    console.log('[API] POST /api/chat');
    const apiKey = process.env.GROQ_API_KEY;
    
    if (!apiKey) {
      console.error('[ERROR] GROQ_API_KEY not configured');
      return res.status(500).json({ 
        error: 'API key not configured on server. Please set GROQ_API_KEY environment variable.' 
      });
    }

    const { messages } = req.body;
    
    if (!messages) {
      return res.status(400).json({ error: 'Messages required' });
    }

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: messages,
        temperature: 0.7,
        max_tokens: 2000,
        top_p: 0.9
      })
    });

    const data = await response.json();
    
    if (!response.ok) {
      console.error('[ERROR] Groq API Error:', data);
      return res.status(response.status).json(data);
    }

    res.json(data);
  } catch (error) {
    console.error('[ERROR] /api/chat:', error);
    res.status(500).json({ error: error.message });
  }
});

// Main routes
app.get('/', (req, res) => {
  console.log('[ROUTE] GET /');
  const filePath = join(__dirname, 'index.html');
  res.sendFile(filePath, (err) => {
    if (err) {
      console.error('[ERROR] Failed to send index.html:', err);
      res.status(500).send('Erro ao carregar página');
    }
  });
});

app.get('/chat', (req, res) => {
  console.log('[ROUTE] GET /chat');
  const filePath = join(__dirname, 'chat.html');
  res.sendFile(filePath, (err) => {
    if (err) {
      console.error('[ERROR] Failed to send chat.html:', err);
      res.status(500).send('Erro ao carregar chat');
    }
  });
});

// 404 handler - serve index.html for any other route (SPA fallback)
app.use((req, res) => {
  console.log('[FALLBACK] Serving index.html for:', req.path);
  const filePath = join(__dirname, 'index.html');
  res.sendFile(filePath, (err) => {
    if (err) {
      console.error('[ERROR] 404 handler error:', err);
      res.status(404).send('Página não encontrada');
    }
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('[ERROR]', err);
  res.status(500).send('Erro interno do servidor');
});

// Start server
const server = app.listen(PORT, () => {
  console.log(`✅ Servidor FinanxIA rodando na porta ${PORT}`);
  console.log(`🌐 URL Base: http://localhost:${PORT}`);
});

// Handle server errors
server.on('error', (err) => {
  console.error('[SERVER ERROR]', err);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM recebido. Desligando servidor...');
  server.close(() => {
    console.log('Servidor desligado');
    process.exit(0);
  });
});
