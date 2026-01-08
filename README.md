<div align="center">
<img width="1200" height="475" alt="Data Vault Banner" src="https://i.ibb.co/JRSDX0hH/data-vault.png" />
</div>

# Datar Vault: AI Document Generator

A modern React application for generating and managing AI-powered documents, including invoices and ledgers. Built with Vite, TypeScript, and integrated with Google's Gemini AI for intelligent document creation.

## Features

- **AI-Powered Document Generation**: Utilize Gemini AI to generate customized documents
- **Invoice Management**: Create, preview, and manage invoices with dynamic forms
- **Document Ledger**: Track and version your documents with a comprehensive ledger system
- **Client and Item Management**: Organize clients and items for efficient document creation
- **PDF Export**: Generate PDF versions of your documents using jsPDF and html2canvas
- **Version History**: Maintain and view version history for all documents

## Tech Stack

- **Frontend**: React 19, TypeScript
- **Build Tool**: Vite
- **AI Integration**: Google Gemini AI (@google/genai)
- **PDF Generation**: jsPDF, html2canvas
- **Styling**: (Add your styling framework if any)

## Prerequisites

- Node.js (latest LTS recommended)
- A valid Google Gemini API key

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

3. Create a `.env.local` file in the root directory and add your Gemini API key:
   ```
   GEMINI_API_KEY=your_gemini_api_key_here
   ```

## Usage

1. Start the development server:

   ```bash
   npm run dev
   ```

2. Open your browser and navigate to `http://localhost:5173`

3. Use the application to:
   - Create and manage clients
   - Add items for invoicing
   - Generate AI-powered documents
   - Export documents as PDFs
   - View document version history

## Available Scripts

- `npm run dev` - Start the development server
- `npm run build` - Build the app for production
- `npm run preview` - Preview the production build locally

## Project Structure

```
src/
├── components/          # React components
│   ├── Accordion.tsx
│   ├── ClientManagerModal.tsx
│   ├── DocumentLedgerModal.tsx
│   ├── Header.tsx
│   ├── Icons.tsx
│   ├── InvoiceForm.tsx
│   ├── InvoicePreview.tsx
│   ├── ItemManagerModal.tsx
│   └── VersionHistoryModal.tsx
├── services/            # Business logic services
│   ├── geminiService.ts
│   └── numberingService.ts
├── App.tsx              # Main app component
├── constants.ts         # Application constants
├── index.tsx            # App entry point
├── types.ts             # TypeScript type definitions
└── metadata.json        # App metadata
```

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Commit your changes: `git commit -am 'Add feature'`
4. Push to the branch: `git push origin feature-name`
5. Submit a pull request

## License

This project is private and proprietary.
