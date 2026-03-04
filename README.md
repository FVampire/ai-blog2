# Blog Website Implementation

This is a Next.js implementation of the blog website design we created using Pencil. The implementation follows the editorial-inspired design system with a focus on typography and a monochrome color palette.

## Features Implemented

1. **Homepage** - Displays a list of blog posts with excerpts
2. **Blog Post Pages** - Individual pages for each blog post
3. **Tags Page** - Displays all tags with post counts
4. **About Page** - Information about the author
5. **Articles Page** - Lists all articles
6. **Responsive Design** - Adapts to different screen sizes
7. **Multi-Database Support** - Supports PostgreSQL (default), MySQL, SQLite, and Supabase

## Design System

The implementation follows a sophisticated editorial design system with:
- **Typography**: Combination of Instrument Serif (italic) for headlines and Inter for body text
- **Color Scheme**: Monochrome palette with black, white, and grays
- **Layout**: Clean, structured layout with proper spacing and visual hierarchy
- **Components**: Card-based design with consistent padding and styling

## Getting Started

First, install the dependencies:

```bash
npm install
# or
yarn install
```

Then, run the development server:

```bash
npm run dev
# or
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Project Structure

```
blog-website/
├── components/
│   ├── Header.tsx
│   ├── Footer.tsx
│   ├── BlogPostCard.tsx
│   ├── TagCloud.tsx
│   ├── AuthorBio.tsx
│   └── SearchWidget.tsx
├── pages/
│   ├── index.tsx (homepage)
│   ├── about.tsx
│   ├── articles.tsx
│   ├── tags.tsx
│   ├── posts/
│   │   └── [slug].tsx (individual post pages)
├── styles/
│   └── globals.css
├── public/
│   └── (static assets if any)
├── package.json
├── tsconfig.json
└── next.config.js
```

## Database Configuration

This project supports multiple databases:
- PostgreSQL (default)
- MySQL
- SQLite
- Supabase (uses dedicated Supabase client)

To configure your database, set the following environment variables in your `.env` file:

### For PostgreSQL/MySQL/SQLite:
```
DATABASE_TYPE=postgresql  # or mysql, sqlite
DATABASE_URL=your_database_connection_string
```

### For Supabase:
```
DATABASE_TYPE=supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

For detailed database configuration instructions, see [MULTI_DB_GUIDE.md](MULTI_DB_GUIDE.md).

## Customization

### Typography
The design uses two primary fonts:
- **Instrument Serif** for headlines (italic)
- **Inter** for body text

These are loaded from Google Fonts in `styles/globals.css`.

### Color Scheme
The color scheme is defined as CSS variables in `styles/globals.css`. You can easily customize the colors by modifying these variables.

### Components
All UI components are built as reusable React components in the `components/` directory. Each component follows the design system principles.

## Deployment

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/deployment) for more details.