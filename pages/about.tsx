import React from 'react';
import Head from 'next/head';
import Header from '../components/Header';
import Footer from '../components/Footer';
import SkillsList from '../components/SkillsList';

const AboutPage: React.FC = () => {
  return (
    <div>
      <Head>
        <title>About - My Blog</title>
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
                <h2 className="author-name">John Doe</h2>
                <p className="author-bio">
                  I'm a full-stack developer with over 10 years of experience building web applications.
                  My passion lies in creating beautiful, functional, and user-friendly digital experiences.
                </p>
                <p className="author-bio">
                  Throughout my career, I've worked with startups and enterprises alike, helping them
                  transform their ideas into successful products. I specialize in modern JavaScript
                  frameworks like React and Node.js, and I'm always excited to learn about new technologies.
                </p>
                <p className="author-bio">
                  When I'm not coding, you can find me hiking in the mountains, reading science fiction
                  novels, or experimenting with new cooking recipes. I believe in continuous learning
                  and sharing knowledge with the community through writing and mentoring.
                </p>
                <div className="social-links" style={{ justifyContent: 'center', marginTop: '20px' }}>
                  <a href="#" className="social-link">Twitter</a>
                  <a href="#" className="social-link">GitHub</a>
                  <a href="#" className="social-link">LinkedIn</a>
                </div>
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

export default AboutPage;