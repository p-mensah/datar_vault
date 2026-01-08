<div align="center">
<img width="1200" height="475" alt="Data Vault Banner" src="https://i.ibb.co/JRSDX0hH/data-vault.png" />
</div>

# Datar Vault: AI Document Generator

A comprehensive business management platform for generating and managing AI-powered documents, including invoices, contracts, statements, and ledgers. Built with modern web technologies and integrated with Google's Gemini AI for intelligent document creation.

## ✨ Features

### 🤖 AI-Powered Document Generation
- **Intelligent Contract Generation**: Use Gemini AI to create customized legal agreements
- **Smart Terms Generation**: AI-powered terms and conditions creation
- **Document Analysis**: AI suggestions for document optimization

### 📊 Advanced Analytics & Reporting
- **Business Intelligence Dashboard**: Interactive charts and metrics
- **Revenue Tracking**: Real-time financial insights and trends
- **Client Analytics**: Performance tracking and profitability analysis
- **Document Status Monitoring**: Comprehensive workflow tracking

### ☁️ Cloud Sync & Backup
- **Supabase Integration**: Secure cloud storage and synchronization
- **Multi-Device Sync**: Access your data across all devices
- **Automatic Backups**: Never lose your business data
- **User Authentication**: Secure login and data protection

### 💰 Enhanced Invoice Management
- **Tabbed Form Interface**: Organized, user-friendly form design
- **Recurring Invoices**: Advanced scheduling with custom intervals
- **Multi-Currency Support**: Global currency exchange rates
- **Payment Tracking**: Status updates and payment history

### 🔄 Advanced Automation
- **Smart Scheduling**: Weekly, monthly, yearly recurring patterns
- **Custom Intervals**: Every X days/weeks/months/years
- **Advanced Options**: Specific days of week/month scheduling
- **Automated Generation**: Background invoice creation

### 📱 Modern User Experience
- **Responsive Design**: Optimized for desktop, tablet, and mobile
- **Intuitive Navigation**: Context-aware headers and breadcrumbs
- **Tabbed Forms**: Organized document creation workflow
- **Professional UI**: Clean, modern interface design

### 🏢 Business Management
- **Client Portal**: Self-service client access (planned)
- **Document Ledger**: Comprehensive version history and tracking
- **Template System**: Multiple document templates and customization
- **Export Capabilities**: PDF generation and data export

### 🔒 Security & Compliance
- **Secure Authentication**: User authentication via Supabase
- **Data Encryption**: Secure cloud storage and transmission
- **Audit Trails**: Complete activity logging
- **Backup Security**: Encrypted data backups

## 🛠️ Tech Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS
- **Build Tool**: Vite
- **AI Integration**: Google Gemini AI (@google/genai)
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Charts**: Chart.js, React-Chartjs-2
- **PDF Generation**: jsPDF, html2canvas
- **State Management**: React Hooks
- **Icons**: Heroicons

## Prerequisites

- Node.js (latest LTS recommended)
- A valid Google Gemini API key
- Supabase account and project (for cloud features)

## Installation

1. Clone the repository:

   ```bash
   git clone <repository-url>
   cd datar-vault
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Set up environment variables:

   Create a `.env.local` file in the root directory with:

   ```env
   GEMINI_API_KEY=your_gemini_api_key_here
   # Supabase credentials (optional, for cloud features)
   VITE_SUPABASE_URL=https://your-project-id.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key
   ```

4. (Optional) Set up Supabase database:

   If you want to use cloud sync features, create a Supabase project and run the SQL migrations in `supabase/migrations/` (if available) or configure the database tables manually:

   - `users` table for user management
   - `invoices` table for document storage
   - `clients` table for client data
   - `items` table for item catalog
   - `ledger` table for document history

## 🚀 Usage

### Getting Started

1. Start the development server:

   ```bash
   npm run dev
   ```

2. Open your browser and navigate to `http://localhost:5173`

### Core Workflows

#### 📊 Dashboard & Analytics
- **Business Overview**: View key metrics and recent documents
- **Analytics**: Click the analytics button for detailed insights with interactive charts
- **Quick Actions**: Create new documents, manage clients/items, access cloud sync

#### 📄 Document Creation
- **Tabbed Interface**: Use the organized tabbed form for creating documents:
  - **Basic Info**: Document type, number, dates, currency
  - **Parties**: Client and business information
  - **Items**: Line items and contract details
  - **Automation**: Recurring invoice settings
  - **Details**: Tax, discounts, notes
  - **Payment**: Banking and payment information
  - **Terms**: AI-generated terms and conditions
  - **Attachments**: Logo uploads

#### ☁️ Cloud Features
- **Authentication**: Sign up/in to enable cloud sync
- **Data Sync**: Upload/download data across devices
- **Automatic Backups**: Secure cloud storage of your business data

#### 🤖 AI Features
- **Contract Generation**: AI creates complete legal agreements
- **Terms Generation**: Intelligent terms and conditions
- **Smart Refinement**: AI-powered contract modifications

#### 💰 Business Management
- **Client Management**: Add, edit, and organize client information
- **Item Catalog**: Manage your products and services
- **Document Ledger**: Track all documents with version history
- **Payment Tracking**: Monitor invoice status and payments

## Available Scripts

- `npm run dev` - Start the development server
- `npm run build` - Build the app for production
- `npm run preview` - Preview the production build locally

## 📁 Project Structure

```
src/
├── components/          # React components
│   ├── Accordion.tsx
│   ├── AnalyticsModal.tsx      # Business analytics dashboard
│   ├── ClientManagerModal.tsx
│   ├── CloudSyncModal.tsx      # Cloud sync and authentication
│   ├── Dashboard.tsx           # Main dashboard with metrics
│   ├── DocumentLedgerModal.tsx
│   ├── Header.tsx              # Separate dashboard/form headers
│   ├── Icons.tsx               # Icon components
│   ├── InvoiceForm.tsx         # Legacy accordion form
│   ├── InvoicePreview.tsx
│   ├── ItemManagerModal.tsx
│   ├── TabbedInvoiceForm.tsx   # New tabbed form interface
│   └── VersionHistoryModal.tsx
├── services/            # Business logic services
│   ├── currencyService.ts      # Multi-currency support
│   ├── geminiService.ts        # AI document generation
│   ├── numberingService.ts     # Document numbering
│   └── supabaseService.ts      # Cloud database integration
├── types.ts             # TypeScript type definitions
├── constants.ts         # Application constants
├── App.tsx              # Main app component
├── index.tsx            # App entry point
└── metadata.json        # App metadata

Other files:
├── .env.local           # Environment variables
├── .gitignore          # Git ignore rules
├── package.json        # Dependencies and scripts
├── tsconfig.json       # TypeScript configuration
├── vite.config.ts      # Vite build configuration
├── index.html          # HTML template
└── plans/              # Project planning documents
    └── dashboard_design.md
```

## 🏗️ Development Status & Roadmap

### ✅ **Implemented Features** (17/22 completed - 77%)

**Core Infrastructure:**
- ✅ Advanced analytics and reporting with interactive charts
- ✅ Cloud sync and backup with Supabase integration
- ✅ Multi-currency exchange rates with live conversion
- ✅ Enhanced recurring invoices with advanced scheduling
- ✅ Modern responsive UI with separate dashboard/form headers
- ✅ Tabbed form interface replacing accordion design
- ✅ Supabase database and storage integration

**User Experience:**
- ✅ Mobile-responsive design improvements
- ✅ Enhanced empty states and loading indicators
- ✅ Breadcrumb navigation and context-aware headers
- ✅ Professional UI with consistent design language

### 🚧 **Planned Features** (Remaining 5/22)

**Business Process Automation:**
- 🔄 Payment processing integration (Stripe/PayPal)
- 🔄 Automated email reminders for overdue invoices
- 🔄 Document signing with e-signature integration
- 🔄 Advanced search and filtering capabilities
- 🔄 Client portal for self-service access

**Enterprise Features:**
- 🔄 Multi-user collaboration and team workspaces
- 🔄 Document templates marketplace
- 🔄 API integration for third-party services
- 🔄 Advanced security features and audit trails
- 🔄 Enhanced AI features for document analysis

### 🎯 **Next Priority Features**

1. **Advanced Search & Filtering** - Essential for document management
2. **Payment Processing** - Core revenue functionality
3. **Automated Reminders** - Improves cash flow management
4. **Document Signing** - Legal compliance and workflow completion
5. **Client Portal** - Customer experience enhancement

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Commit your changes: `git commit -am 'Add feature'`
4. Push to the branch: `git push origin feature-name`
5. Submit a pull request

## License

This project is private and proprietary.
