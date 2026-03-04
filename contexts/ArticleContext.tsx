import React, { createContext, useContext, useState, ReactNode } from 'react';

export interface ArticleContextData {
  id: number;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  author_name: string;
  tags: { name: string }[];
}

interface ArticleContextType {
  article: ArticleContextData | null;
  setArticle: (article: ArticleContextData | null) => void;
}

const ArticleContext = createContext<ArticleContextType>({
  article: null,
  setArticle: () => {},
});

export const ArticleProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [article, setArticle] = useState<ArticleContextData | null>(null);

  return (
    <ArticleContext.Provider value={{ article, setArticle }}>
      {children}
    </ArticleContext.Provider>
  );
};

export const useArticle = () => useContext(ArticleContext);

export default ArticleContext;
