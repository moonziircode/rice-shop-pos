# Rice Shop POS Admin System

A modern, responsive web administration interface for managing a rice shop Point of Sale (POS) system. Built with React, Next.js, Tailwind CSS, and Supabase for a complete full-stack solution.

![Rice Shop POS Dashboard](https://via.placeholder.com/800x400/f3f4f6/1f2937?text=Rice+Shop+POS+Dashboard)

## 🌟 Features

### **Authentication & User Management**
- 🔐 Secure user authentication with Supabase Auth
- 👥 Role-based access control (Admin, Manager, Cashier)
- 🔑 User account management (Create, Read, Update, Delete)
- 📊 User activity tracking and status management

### **Product Inventory Management**
- 📦 Comprehensive product catalog
- 🏷️ Category management (Liter, Kiloan, Karungan)
- 📊 Stock level tracking with low-stock alerts
- 💰 Dynamic pricing per unit (kg, liter, sack)
- 📝 Product descriptions and metadata

### **Transaction Management**
- 🧾 Complete transaction history
- 🔍 Advanced filtering (date, cashier, payment method)
- 💳 Multiple payment methods (Cash, Card, Digital)
- 📋 Detailed transaction breakdown with itemized receipts

### **Analytics Dashboard**
- 📈 Real-time sales analytics and charts
- 📊 Revenue tracking (daily, weekly, monthly)
- 🏆 Top-performing products and cashiers
- 📉 Interactive charts with Recharts library

### **Design & UX**
- 🎨 Clean monochrome design with strategic accent colors
- 📱 Fully responsive design (mobile, tablet, desktop)
- 🧭 Intuitive sidebar navigation
- ⚡ Fast loading and smooth transitions
- 🎯 Clear information hierarchy

## 🚀 Quick Start

### Prerequisites

Before you begin, ensure you have:
- Node.js 18+ installed
- A Supabase account (free tier available)
- Git for version control

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/rice-shop-pos.git
cd rice-shop-pos
npm install
```

### 2. Supabase Setup

#### Step 2.1: Create a New Supabase Project

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Click "New Project"
3. Choose your organization
4. Fill in project details:
   - **Name**: `rice-shop-pos`
   - **Database Password**: Generate a secure password
   - **Region**: Choose closest to your location
5. Click "Create new project"

#### Step 2.2: Get Your Project Credentials

Once your project is created:

1. Go to **Settings** → **API**
2. Copy these values:
   - **Project URL**: `https://your-project-id.supabase.co`
   - **Project ID**: `your-project-id` (from the URL)
   - **anon/public key**: `eyJ...` (anon key)
   - **service_role key**: `eyJ...` (service role key)

#### Step 2.3: Configure Environment Variables

Create a `/utils/supabase/info.tsx` file:

```typescript
// /utils/supabase/info.tsx
export const projectId = 'your-project-id'
export const publicAnonKey = 'your-anon-key'
```

In your Supabase project dashboard, go to **Settings** → **Environment Variables** and add:

```
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_DB_URL=postgresql://postgres:[YOUR-PASSWORD]@db.your-project-id.supabase.co:5432/postgres
```

### 3. Database Setup

The application uses Supabase's KV Store for data management. No additional database setup is required as the server automatically initializes:

- ✅ Demo user accounts (Admin, Manager)
- ✅ Sample product catalog
- ✅ Key-value storage system

### 4. Deploy Edge Functions

1. Install Supabase CLI:
```bash
npm install -g supabase
```

2. Login to Supabase:
```bash
supabase login
```

3. Link your project:
```bash
supabase link --project-ref your-project-id
```

4. Deploy the edge function:
```bash
supabase functions deploy server
```

### 5. Run the Application

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🔐 Demo Credentials

The system automatically creates demo accounts for testing:

### Admin Account
- **Email**: `admin@riceshop.com`
- **Password**: `admin123`
- **Permissions**: Full system access

### Manager Account
- **Email**: `manager@riceshop.com`
- **Password**: `manager123`
- **Permissions**: User management, products, transactions

## 📊 System Architecture

```
Frontend (React/Next.js)
    ↓
Supabase Edge Functions (Hono Server)
    ↓
Supabase Database (PostgreSQL + KV Store)
    ↓
Supabase Auth (User Management)
```

### Key Components

- **Frontend**: React with TypeScript, Tailwind CSS
- **Backend**: Supabase Edge Functions with Hono framework
- **Database**: Supabase PostgreSQL with KV Store abstraction
- **Authentication**: Supabase Auth with role-based access
- **Charts**: Recharts for analytics visualization
- **Icons**: Lucide React for consistent iconography

## 🛠️ Development Guide

### Project Structure

```
rice-shop-pos/
├── components/
│   ├── Dashboard.tsx          # Analytics dashboard
│   ├── LoginPage.tsx          # Authentication
│   ├── ProductManagement.tsx  # Product CRUD
│   ├── TransactionManagement.tsx # Transaction history
│   ├── UserManagement.tsx     # User administration
│   ├── Sidebar.tsx           # Navigation
│   └── ui/                   # Reusable UI components
├── supabase/
│   └── functions/
│       └── server/
│           ├── index.tsx     # Main server routes
│           └── kv_store.tsx  # Database abstraction
├── utils/
│   └── supabase/
│       └── info.tsx         # Supabase configuration
├── styles/
│   └── globals.css          # Tailwind CSS + custom styles
└── App.tsx                  # Main application entry
```

### API Endpoints

The server provides these REST endpoints:

#### Authentication
- `POST /auth/signin` - User login
- `POST /auth/signup` - Create new user

#### User Management
- `GET /users` - List all users
- `PUT /users/:id` - Update user
- `DELETE /users/:id` - Delete user

#### Product Management
- `GET /products` - List all products
- `POST /products` - Create product
- `PUT /products/:id` - Update product
- `DELETE /products/:id` - Delete product

#### Transaction Management
- `GET /transactions` - List transactions
- `POST /transactions` - Create transaction

#### Analytics
- `GET /analytics/sales` - Sales analytics data

### Adding New Features

1. **Create Component**: Add new React component in `/components/`
2. **Add Route**: Update navigation in `App.tsx`
3. **Server Endpoint**: Add route in `/supabase/functions/server/index.tsx`
4. **Database**: Use KV store methods in `/supabase/functions/server/kv_store.tsx`

### Styling Guidelines

- Use Tailwind utility classes for styling
- Follow the monochrome color scheme with strategic accents
- Utilize the design tokens in `/styles/globals.css`
- Maintain responsive design principles

## 🔧 Configuration

### Customizing the Application

#### 1. Branding
Update branding elements in:
- `LoginPage.tsx` - Logo and app name
- `Sidebar.tsx` - App title and logo
- `/styles/globals.css` - Color scheme and design tokens

#### 2. User Roles
Modify user roles in:
- `/supabase/functions/server/index.tsx` - Authentication logic
- `App.tsx` - Role-based navigation
- `UserManagement.tsx` - Role options

#### 3. Product Categories
Update product categories in:
- `ProductManagement.tsx` - Categories and units arrays
- Server initialization in `/supabase/functions/server/index.tsx`

### Environment Configuration

For production deployment, ensure these environment variables are set:

```bash
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_DB_URL=your-database-url
```

## 🚀 Deployment

### Deploy to Vercel

1. Connect your GitHub repository to Vercel
2. Configure environment variables in Vercel dashboard
3. Deploy automatically on git push

### Deploy to Netlify

1. Connect repository to Netlify
2. Build command: `npm run build`
3. Publish directory: `dist`
4. Add environment variables in site settings

### Manual Deployment

```bash
npm run build
npm run preview
```

## 🐛 Troubleshooting

### Common Issues

#### Authentication Errors
- ✅ Verify Supabase project credentials
- ✅ Check if demo users are created
- ✅ Ensure proper environment variables

#### API Connection Issues
- ✅ Confirm Edge Functions are deployed
- ✅ Check browser network tab for errors
- ✅ Verify CORS settings in Supabase

#### Data Not Loading
- ✅ Check browser console for errors
- ✅ Verify access tokens in requests
- ✅ Ensure KV store is properly initialized

### Debug Mode

Enable detailed logging by adding to browser console:
```javascript
localStorage.setItem('debug', 'true')
```

## 📝 License

This project is licensed under the MIT License. See [LICENSE](LICENSE) file for details.

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📞 Support

For support and questions:
- 📧 Email: support@riceshop-pos.com
- 💬 GitHub Issues: [Create an issue](https://github.com/your-username/rice-shop-pos/issues)
- 📖 Documentation: [Wiki](https://github.com/your-username/rice-shop-pos/wiki)

## 🙏 Acknowledgments

- [Supabase](https://supabase.com) for backend infrastructure
- [Tailwind CSS](https://tailwindcss.com) for styling system
- [Recharts](https://recharts.org) for data visualization
- [Lucide](https://lucide.dev) for beautiful icons
- [Figma Make](https://figma.com/make) for rapid prototyping

---

**Built with ❤️ for modern rice shop management**