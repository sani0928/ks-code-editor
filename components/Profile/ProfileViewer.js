'use client';

import { useEffect, useRef } from 'react';

/**
 * 프로필 HTML 미리보기 컴포넌트
 */
export default function ProfileViewer({ html, css }) {
  const containerRef = useRef(null);

  // HTML에서 head 내부의 style 태그 추출
  const extractHeadStyles = (htmlString) => {
    if (!htmlString) return '';
    const headMatch = htmlString.match(/<head[^>]*>([\s\S]*)<\/head>/i);
    if (!headMatch) return '';
    
    const headContent = headMatch[1];
    const styleMatches = headContent.match(/<style[^>]*>([\s\S]*?)<\/style>/gi);
    if (!styleMatches) return '';
    
    // 모든 style 태그의 내용을 추출하여 합침
    return styleMatches
      .map(styleTag => {
        const contentMatch = styleTag.match(/<style[^>]*>([\s\S]*?)<\/style>/i);
        return contentMatch ? contentMatch[1] : '';
      })
      .join('\n');
  };

  // HTML에서 body 내용 추출
  const extractBodyContent = (htmlString) => {
    if (!htmlString) return '';
    const bodyMatch = htmlString.match(/<body[^>]*>([\s\S]*)<\/body>/i);
    if (bodyMatch) {
      return bodyMatch[1];
    }
    // body 태그가 없으면 전체 HTML에서 html, head, body 태그 제거
    return htmlString
      .replace(/<!DOCTYPE[^>]*>/gi, '')
      .replace(/<html[^>]*>/gi, '')
      .replace(/<\/html>/gi, '')
      .replace(/<head[^>]*>[\s\S]*<\/head>/gi, '')
      .replace(/<body[^>]*>/gi, '')
      .replace(/<\/body>/gi, '');
  };

  // 기본 스타일 리셋 및 개선
  const getBaseStyles = () => {
    return `
      * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
      }
      
      :host {
        display: block;
        width: 100%;
        height: 100%;
        overflow: hidden;
      }
      
      .html-preview-container {
        width: 100%;
        min-height: 100%;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
        line-height: 1.6;
        color: #cccccc;
        background-color: #1e1e1e;
        -webkit-font-smoothing: antialiased;
        -moz-osx-font-smoothing: grayscale;
        box-sizing: border-box;
      }
      
      /* body 스타일을 컨테이너에 적용 */
      body {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
        line-height: 1.6;
        color: #cccccc;
        background-color: #1e1e1e;
      }
      
      /* 스크롤바 스타일 */
      ::-webkit-scrollbar {
        width: 10px;
        height: 10px;
      }
      
      ::-webkit-scrollbar-track {
        background: #252526;
      }
      
      ::-webkit-scrollbar-thumb {
        background: #424242;
        border-radius: 5px;
      }
      
      ::-webkit-scrollbar-thumb:hover {
        background: #4e4e4e;
      }
      
      /* 기본 링크 스타일 */
      a {
        color: #007acc;
        text-decoration: none;
      }
      
      a:hover {
        text-decoration: underline;
      }
      
      /* 기본 제목 스타일 */
      h1, h2, h3, h4, h5, h6 {
        margin-top: 0;
        margin-bottom: 0.5em;
        font-weight: 600;
        line-height: 1.2;
      }
      
      /* 기본 문단 스타일 */
      p {
        margin-bottom: 1em;
      }
      
      /* 코드 블록 스타일 */
      pre {
        background-color: #252526;
        padding: 15px;
        border-radius: 5px;
        overflow-x: auto;
        border: 1px solid #3e3e42;
        margin: 1em 0;
      }
      
      code {
        font-family: 'Consolas', 'Courier New', monospace;
        font-size: 0.9em;
      }
      
      pre code {
        background-color: transparent;
        padding: 0;
        border: none;
      }
    `;
  };

  useEffect(() => {
    if (!containerRef.current) return;

    // Shadow DOM 생성
    let shadowRoot = containerRef.current.shadowRoot;
    if (!shadowRoot) {
      shadowRoot = containerRef.current.attachShadow({ mode: 'open' });
    }

    const headStyles = extractHeadStyles(html || '');
    const bodyContent = extractBodyContent(html || '');
    
    // 모든 CSS 통합
    const baseStyles = getBaseStyles();
    const containerStyles = `
      .html-preview-container {
        padding: 20px;
        padding-right: 30px;
        width: 100%;
        min-height: 100%;
        box-sizing: border-box;
      }
    `;
    const allCSS = [baseStyles, containerStyles, headStyles, css || ''].filter(Boolean).join('\n');
    
    // Shadow DOM에 내용 삽입
    shadowRoot.innerHTML = `
      <style>${allCSS}</style>
      <div class="html-preview-container">
        ${bodyContent}
      </div>
    `;
  }, [html, css]);

  return (
    <div 
      ref={containerRef}
      style={{
        flex: 1,
        width: '100%',
        height: '100%',
        overflow: 'auto',
        backgroundColor: 'var(--bg-primary)',
        boxSizing: 'border-box'
      }}
    />
  );
}

