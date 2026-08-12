"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const dotenv_1 = __importDefault(require("dotenv"));
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const dashboard_routes_1 = __importDefault(require("./routes/dashboard.routes"));
const inventory_routes_1 = __importDefault(require("./routes/inventory.routes"));
const sales_routes_1 = __importDefault(require("./routes/sales.routes"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 5000;
// CORS configuration - allow credentials (for secure cookies) and request from client url
const clientUrl = process.env.CLIENT_URL || 'http://localhost:3000';
app.use((0, cors_1.default)({
    origin: clientUrl,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express_1.default.json());
app.use((0, cookie_parser_1.default)());
// Request logging middleware
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
    next();
});
// API Routes
app.use('/api/auth', auth_routes_1.default);
app.use('/api/dashboard', dashboard_routes_1.default);
app.use('/api/inventory', inventory_routes_1.default);
app.use('/api/sales', sales_routes_1.default);
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
app.use((err, req, res, next) => {
    console.error('Unhandled Error:', err);
    res.status(err.status || 500).json({
        message: err.message || 'Internal Server Error',
        error: process.env.NODE_ENV === 'development' ? err : {}
    });
});
app.listen(PORT, () => {
    console.log(`🚀 Business ERP Lite backend server running on port ${PORT}`);
});
