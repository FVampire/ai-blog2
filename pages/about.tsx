import React from 'react';
import Head from 'next/head';
import { GetServerSideProps } from 'next';
import Header from '../components/Header';
import Footer from '../components/Footer';
import SkillsList from '../components/SkillsList';
import { SettingsRepository } from '../lib/repositories/SettingsRepository';

interface SocialLink {
  platform: string;
  name: string;
  url: string;
}

interface AboutSettings {
  authorName: string;
  authorBio: string;
  authorBio2: string;
  authorBio3: string;
  socialLinks: SocialLink[];
}

interface AboutPageProps {
  settings: AboutSettings;
}

const AboutPage: React.FC<AboutPageProps> = ({ settings }) => {
  return (
    <div>
      <Head>
        <title>About - 五月的火</title>
        <meta name="description" content="About the author" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <Header />

      <div className="container">
        <div className="content-wrapper">
          <div className="main-content">
            <div className="blog-section">
              <h1 className="section-title">About Me</h1>
              <div className="card">
                <div className="avatar" style={{ margin: '0 auto 20px' }}></div>
                <h2 className="author-name">{settings.authorName}</h2>
                <p className="author-bio">{settings.authorBio}</p>
                <p className="author-bio">{settings.authorBio2}</p>
                <p className="author-bio">{settings.authorBio3}</p>
                {settings.socialLinks && settings.socialLinks.length > 0 && (
                  <div className="social-links" style={{ justifyContent: 'center', marginTop: '20px' }}>
                    {settings.socialLinks.map((link) => (
                      <a key={link.platform} href={link.url} className="social-link" target="_blank" rel="noopener noreferrer">
                        {link.name}
                      </a>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="sidebar">
            <SkillsList />
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export const getServerSideProps: GetServerSideProps = async () => {
  try {
    const settings = await SettingsRepository.getAboutSettings();

    return {
      props: {
        settings,
      },
    };
  } catch (error) {
    console.error('Error fetching about settings:', error);

    // 返回默认数据以防止错误
    return {
      props: {
        settings: {
          authorName: 'John Doe',
          authorBio: "I'm a full-stack developer with over 10 years of experience building web applications.",
          authorBio2: "I specialize in modern JavaScript frameworks like React and Node.js.",
          authorBio3: "I believe in continuous learning and sharing knowledge with the community.",
          socialLinks: [],
        },
      },
    };
  }
};

export default AboutPage;