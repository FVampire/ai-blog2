# Pencil Blog - Full-Featured Blogging Platform

A complete, production-ready blogging platform built with Next.js, TypeScript, and PostgreSQL. Features a modern admin dashboard, Markdown editor, image management, tag system, and view tracking.

![Blog Dashboard](./public/screenshots/dashboard.png)

## 🌟 Key Features

### 🔧 Administration Panel
- Secure JWT-based authentication
- Role-based access control (admin/editor/author)
- Dashboard with content statistics
- User management with status controls

### 📝 Content Management
- Full-featured Markdown editor with live preview
- Draft/published/archived post workflow
- Tag management system with post association
- SEO-friendly URL slugs
- Featured image uploads

### 🖼️ Media Management
- Drag-and-drop image uploader
- Media library with preview thumbnails
- File validation and size limits
- Tencent COS object storage

### 📊 Analytics & Tracking
- Automatic view counting with deduplication
- Post popularity metrics
- Content performance overview

### 🎨 Design System
- Responsive layout for all devices
- Modern UI with gradient accents
- Consistent component library
- Dark mode support in admin

### 🛠️ Technical Features
- Multi-database support (PostgreSQL, MySQL, SQLite)
- Environment-based configuration
- API route protection
- Server-side rendering for SEO
- TypeScript type safety

## 🚀 Getting Started

### Prerequisites
- Node.js 16+
- PostgreSQL (or MySQL/SQLite)
- pnpm (recommended) or npm

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd pencil-blog
```

2. **Install dependencies**
```bash
pnpm install
```

3. **Environment Setup**
Create a `.env.local` file in the root directory:
```env
# Database Configuration
DATABASE_URL=postgresql://user:password@localhost:5432/blog_db
# Or for other databases:
# DATABASE_URL=mysql://user:password@localhost:3306/blog_db
# DATABASE_URL=sqlite:///./db.sqlite

# JWT Secret (use a strong random string)
JWT_SECRET=your-super-secret-jwt-key

# Optional: Supabase (if using)
# NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
# NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

4. **Database Setup**
```bash
# Create database
createdb blog_db

# Run initial schema
psql -d blog_db -f db/schema.sql
```

5. **Run Development Server**
```bash
pnpm dev
```

Visit [http://localhost:3000](http://localhost:3000) for the frontend and [http://localhost:3000/admin](http://localhost:3000/admin) for the admin panel.

### Default Admin Credentials
- **Username**: admin
- **Password**: admin123

> ⚠️ Change the default password immediately after first login

## 🏗️ Project Structure

```
pencil-blog/
├── components/          # Reusable React components
│   ├── admin/           # Admin-specific components
│   ├── BlogPostCard.tsx # Post display component
│   ├── MarkdownEditor.tsx # Rich text editor
│   └── ImageUpload.tsx  # File upload component
├── pages/               # Next.js pages and API routes
│   ├── api/             # Backend API endpoints
│   ├── admin/           # Admin dashboard pages
│   ├── posts/           # Blog post pages
│   └── index.tsx        # Homepage
├── lib/                 # Utility functions and clients
├── db/                  # Database schema and migrations
├── styles/              # Global CSS and design tokens
└── public/              # Static assets and uploads
```

## 🗄️ Database Schema

The platform uses a normalized relational database structure:

### Core Tables
- **users**: User accounts with roles and authentication
- **posts**: Blog posts with content, status, and metadata
- **tags**: Content categorization system
- **post_tags**: Many-to-many relationship between posts and tags
- **comments**: Reader feedback (optional feature)

### Key Relationships
- Users can author multiple posts (1:N)
- Posts can have multiple tags (N:M)
- Posts can receive comments (1:N)

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/login` - User authentication
- `POST /api/auth/logout` - Session termination

### Posts
- `GET /api/posts` - List public posts (supports pagination)
- `POST /api/posts` - Create new post (admin only)
- `GET /api/posts/[id]` - Retrieve specific post
- `PUT /api/posts/[id]` - Update post (admin only)
- `DELETE /api/posts/[id]` - Delete post (admin only)
- `POST /api/posts/track-view` - Increment view counter

### Tags
- `GET /api/tags` - List all tags with usage counts
- `POST /api/tags` - Create new tag (admin only)
- `PUT /api/tags/[id]` - Update tag (admin only)
- `DELETE /api/tags/[id]` - Delete tag (admin only)

### Media
- `POST /api/upload` - Upload image file (admin only)
- `GET /api/media/list` - List uploaded media (admin only)
- `DELETE /api/media/delete` - Remove media file (admin only)

## 🎨 Design & Styling

### Technology Stack
- **Tailwind CSS** v4 - Utility-first CSS framework
- **CSS Variables** - Design token system for consistent theming
- **Google Fonts** - Instrument Serif (headlines) and Inter (body)

### Color Palette
The design uses a dual-palette approach:
- **Tech Palette**: Cyans, purples, and pinks for article elements
- **Warm Palette**: Corals, oranges, and peaches for tags and sidebar

### Typography
- **Headings**: Instrument Serif, italicized for editorial feel
- **Body Text**: Inter, clean and highly readable
- **Code Blocks**: Monospace with syntax highlighting

## 🚢 Deployment

### Vercel (Recommended)
[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone)

### Manual Deployment
```bash
# Build for production
pnpm build

# Start production server
pnpm start
```

### Environment Variables for Production
```env
# Database connection
DATABASE_URL=your-production-database-url

# Security
JWT_SECRET=your-production-jwt-secret

# Optional features
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

## 🛡️ Security Features

- Password hashing with bcrypt (10+ rounds)
- JWT token authentication with expiration
- SQL injection prevention through parameterized queries
- XSS protection via React's automatic escaping
- File upload validation and sanitization
- Role-based access controls for admin features

## 🧪 Development

### Available Scripts
- `pnpm dev` - Start development server
- `pnpm build` - Create production build
- `pnpm start` - Start production server
- `pnpm lint` - Run code quality checks

### Recommended VS Code Extensions
- **ESLint** - JavaScript/TypeScript linting
- **Prettier** - Code formatting
- **Tailwind CSS IntelliSense** - CSS class suggestions

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/) - React framework
- [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS framework
- [PostgreSQL](https://www.postgresql.org/) - Open-source database
- [bcrypt.js](https://github.com/dcodeIO/bcrypt.js) - Password hashing
- [react-markdown](https://github.com/remarkjs/react-markdown) - Markdown rendering