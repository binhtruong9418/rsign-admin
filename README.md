# RSign Admin - Digital Signature Management System

RSign Admin is a comprehensive web-based administrative platform for managing digital signatures, documents, templates, and user workflows. Built with React, TypeScript, and modern web technologies.

## 🚀 Features

- **Document Management**: Create, send, track, and manage signature documents
- **Template System**: Build reusable document templates with predefined signature zones
- **Batch Operations**: Handle multiple documents efficiently with batch processing
- **User Management**: Manage users, roles, and permissions
- **Signer Groups**: Organize signers into reusable groups
- **Real-time Dashboard**: Monitor document status and signing progress
- **PDF Zone Placement**: Interactive PDF viewer for signature zone configuration
- **Multi-signing Modes**:
    - Individual (separate documents per signer)
    - Shared (single document with multiple signers)
- **Signing Flows**: Sequential or parallel signing workflows

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js**: Version 18.x or higher
- **npm**: Version 9.x or higher (comes with Node.js)
- **Git**: For cloning the repository

## 🛠️ Installation

### 1. Clone the Repository

```bash
git clone https://github.com/binhtruong9418/rsign-admin.git
cd rsign-admin
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Configuration

Create a `.env` file in the root directory:

```bash
# API Configuration
VITE_API_URL=http://localhost:3000/api

# Optional: Other configurations
# VITE_APP_NAME=RSign Admin
```

**Important Environment Variables:**

- `VITE_API_URL`: Backend API base URL (required)

### 4. Start Development Server

```bash
npm run dev
```

The application will be available at `http://localhost:5173`

## 📦 Build for Production

### Build the Project

```bash
npm run build
```

This will:

1. Run TypeScript compiler (`tsc -b`)
2. Build optimized production files in `dist/` directory

### Preview Production Build

```bash
npm run preview
```

## 🏗️ Project Structure

```
rsign-admin/
├── src/
│   ├── assets/          # Static assets (images, fonts)
│   ├── components/      # Reusable React components
│   │   ├── document-creation/   # Document creation wizard
│   │   ├── template-creation/   # Template creation wizard
│   │   ├── layout/             # Layout components
│   │   └── ui/                 # UI components (Button, Input, etc.)
│   ├── contexts/        # React Context providers
│   ├── hooks/          # Custom React hooks
│   ├── lib/            # Utilities and API clients
│   ├── pages/          # Page components
│   │   └── admin/      # Admin dashboard pages
│   ├── types/          # TypeScript type definitions
│   ├── App.tsx         # Main app component
│   └── main.tsx        # Application entry point
├── docs/               # Documentation
├── public/             # Public static files
└── dist/               # Production build output (generated)
```

## 🧪 Available Scripts

| Command           | Description                              |
| ----------------- | ---------------------------------------- |
| `npm run dev`     | Start development server with hot reload |
| `npm run build`   | Build for production                     |
| `npm run preview` | Preview production build locally         |
| `npm run lint`    | Run ESLint for code quality              |

## 🔧 Technology Stack

### Core

- **React 18** - UI library
- **TypeScript** - Type-safe JavaScript
- **Vite** - Build tool and dev server

### Routing & State

- **React Router v6** - Client-side routing
- **TanStack Query (React Query)** - Server state management

### Styling

- **TailwindCSS** - Utility-first CSS framework
- **clsx** - Conditional className utility

### HTTP & APIs

- **Axios** - HTTP client with interceptors
- **PDF.js** - PDF rendering and manipulation

### UI Components

- **Lucide React** - Icon library
- **React Hook Form** - Form management
- **Zod** - Schema validation

## 🌐 API Integration

The application connects to a backend API. Configure the API URL in `.env`:

```bash
VITE_API_URL=https://api.rsign.com/api
```

### API Endpoints Structure

```
/api/admin/
├── documents/        # Document CRUD operations
├── templates/        # Template management
├── users/           # User management
├── signer-groups/   # Signer group operations
├── document-batches/# Batch operations
└── statistics/      # Dashboard statistics
```

For detailed API documentation, see [docs/03-API-DOCUMENTATION.md](docs/03-API-DOCUMENTATION.md)

## 🔐 Authentication

The application uses JWT-based authentication:

1. Login via `/login` page
2. JWT token stored in localStorage
3. Auto-redirect to login on 401 responses
4. Protected routes with `ProtectedRoute` component

## 📱 Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## 🐛 Troubleshooting

### Port Already in Use

If port 5173 is already in use:

```bash
# Edit vite.config.ts to change port
server: {
  port: 3000
}
```

### Build Errors

Clear cache and reinstall:

```bash
rm -rf node_modules package-lock.json
npm install
```

### PDF Rendering Issues

Ensure PDF.js worker is properly configured in `vite.config.ts`:

```typescript
optimizeDeps: {
    include: ["pdfjs-dist"];
}
```

## 📄 License

This project is private and proprietary.

## 👥 Development Team

- **Repository**: https://github.com/binhtruong9418/rsign-admin
- **Owner**: binhtruong9418

## 📚 Documentation

Additional documentation available in `docs/` directory:

- [API Integration Guide](docs/03-API-DOCUMENTATION.md)
- [Frontend Types Reference](docs/FRONTEND_TYPES.md)
- [Template API Integration](docs/FRONTEND_TEMPLATE_API_INTEGRATION.md)
- [Document Creation Workflow](docs/ADMIN_DOCUMENT_CREATION_WORKFLOW.md)
- [UI/UX Design Guidelines](docs/04-UI-UX-DESIGN.md)

## 🚀 Quick Start Guide

1. **Install dependencies**: `npm install`
2. **Configure environment**: Create `.env` with `VITE_API_URL`
3. **Start dev server**: `npm run dev`
4. **Login**: Use admin credentials
5. **Start creating**: Documents, templates, or manage users

---

**Version**: 2.0  
**Last Updated**: January 2026
