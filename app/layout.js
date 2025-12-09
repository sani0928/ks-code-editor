import './globals.css';
import { Analytics } from '@vercel/analytics/next';
import DndProvider from '../components/Providers/DndProvider';
import { getSiteUrl } from '../lib/env';

export const metadata = {
  title: {
    default: 'KS Code Editor',
    template: '%s | KS Code Editor',
  },
  description: '백준(BOJ) 문제 풀이를 위한 온라인 코드 에디터. 여러 프로그래밍 언어를 지원하며, 문제 정보 자동 로드 및 코드 실행 기능을 제공합니다.',
  keywords: ['코드 에디터', '백준', 'BOJ', '알고리즘', '온라인 에디터', 'Python', 'JavaScript', 'C++', 'Java', '프로그래밍', '코딩'],
  authors: [{ name: 'KS Code Editor' }],
  creator: 'KS Code Editor',
  publisher: 'KS Code Editor',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(getSiteUrl()),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'ko_KR',
    url: '/',
    siteName: 'KS Code Editor',
    title: 'KS Code Editor - 백준 문제 풀이를 위한 웹 에디터',
    description: '백준(BOJ) 문제 풀이를 위한 온라인 코드 에디터. 여러 프로그래밍 언어를 지원하며, 문제 정보 자동 로드 및 코드 실행 기능을 제공합니다.',
    images: [
      {
        url: '/icon.svg',
        width: 32,
        height: 32,
        alt: 'KS Code Editor',
      },
    ],
  },
  twitter: {
    card: 'summary',
    title: 'KS Code Editor - 백준 문제 풀이를 위한 웹 에디터',
    description: '백준(BOJ) 문제 풀이를 위한 온라인 코드 에디터. 여러 프로그래밍 언어를 지원합니다.',
    images: ['/icon.svg'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    // Google Search Console, Naver Search Advisor 등에서 제공하는 verification 코드를 여기에 추가하세요
    // google: 'your-google-verification-code',
    // other: {
    //   'naver-site-verification': 'your-naver-verification-code',
    // },
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({ children }) {
  const baseUrl = getSiteUrl();
  
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'KS Code Editor',
    description: '백준(BOJ) 문제 풀이를 위한 온라인 코드 에디터. 여러 프로그래밍 언어를 지원하며, 문제 정보 자동 로드 및 코드 실행 기능을 제공합니다.',
    url: baseUrl,
    applicationCategory: 'DeveloperApplication',
    operatingSystem: 'Web Browser',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'KRW',
    },
    featureList: [
      '코드 에디터',
      'Python 실행',
      'JavaScript 실행',
      '백준 문제 자동 로드',
      '코드 제출 기능',
      '다중 파일 편집',
    ],
    programmingLanguage: ['Python', 'JavaScript', 'C++', 'Java'],
  };

  return (
    <html lang="ko">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body>
        <DndProvider>
          {children}
          <Analytics />
        </DndProvider>
      </body>
    </html>
  );
}

