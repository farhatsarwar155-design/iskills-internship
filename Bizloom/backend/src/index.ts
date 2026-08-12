import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.routes';
import dashboardRoutes from './routes/dashboard.routes';
import inventoryRoutes from './routes/inventory.routes';
import salesRoutes from './routes/sales.routes';
import purchaseRoutes from './routes/purchase.routes';
import hrRoutes from './routes/hr.routes';
import financeRoutes from './routes/finance.routes';
import aiRoutes from './routes/ai.routes';
import analyticsRoutes from './routes/analytics.routes';
import searchRoutes from './routes/search.routes';
import swaggerUi from 'swagger-ui-express';
import swaggerDocument from './swagger.json';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// CORS configuration - allow credentials (for secure cookies) and request from client url
const clientUrl = process.env.CLIENT_URL || 'http://localhost:3000';
app.use(cors({
  origin: clientUrl,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use(cookieParser());

// Request logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/sales', salesRoutes);
app.use('/api/purchase', purchaseRoutes);
app.use('/api/hr', hrRoutes);
app.use('/api/finance', financeRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/search', searchRoutes);

// API Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Friendly API landing page
app.get('/', (req, res) => {
  res.send(`
    <html>
      <head>
        <title>Business ERP Lite API</title>
        <style>
          body { font-family: system-ui, -apple-system, sans-serif; background-color: #f8fafc; color: #0f172a; text-align: center; padding: 50px; display: flex; items-center; justify-content: center; height: 80vh; margin: 0; }
          .card { max-width: 480px; margin: auto; background: white; padding: 40px; border-radius: 20px; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.05), 0 4px 6px -4px rgba(0,0,0,0.05); border: 1px solid #e2e8f0; }
          h1 { color: #4f46e5; margin: 0 0 12px 0; font-weight: 900; font-size: 24px; }
          p { color: #64748b; font-size: 14px; line-height: 1.6; margin-bottom: 24px; }
          .btn { display: inline-block; padding: 12px 24px; background-color: #4f46e5; color: white; text-decoration: none; border-radius: 12px; font-weight: 700; font-size: 13px; box-shadow: 0 4px 6px -1px rgba(79, 70, 229, 0.2); transition: all 0.15s; }
          .btn:hover { background-color: #4338ca; transform: scale(1.02); }
        </style>
      </head>
      <body>
        <div class="card">
          <h1>🚀 Bizloom ERP API</h1>
          <p>The Express.js backend API is up and running successfully.<br/>To access the ERP User Interface, open the Next.js client application:</p>
          <a class="btn" href="http://localhost:3000">Go to ERP Frontend (Port 3000)</a>
        </div>
      </body>
    </html>
  `);
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date() });
});

// Global error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled Error:', err);
  res.status(err.status || 500).json({
    message: err.message || 'Internal Server Error',
    error: process.env.NODE_ENV === 'development' ? err : {}
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Business ERP Lite backend server running on port ${PORT}`);
});
