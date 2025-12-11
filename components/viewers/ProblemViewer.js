'use client';

import { useEffect, useRef } from 'react';

/**
 * 문제 HTML 미리보기 컴포넌트
 */
export default function ProblemViewer({ html, css, problemNumber }) {
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

  // HTML에서 body 내용 추출 및 문제 제목에 링크 추가
  const extractBodyContent = (htmlString) => {
    if (!htmlString) return '';
    let bodyContent = '';
    const bodyMatch = htmlString.match(/<body[^>]*>([\s\S]*)<\/body>/i);
    if (bodyMatch) {
      bodyContent = bodyMatch[1];
    } else {
      // body 태그가 없으면 전체 HTML에서 html, head, body 태그 제거
      bodyContent = htmlString
        .replace(/<!DOCTYPE[^>]*>/gi, '')
        .replace(/<html[^>]*>/gi, '')
        .replace(/<\/html>/gi, '')
        .replace(/<head[^>]*>[\s\S]*<\/head>/gi, '')
        .replace(/<body[^>]*>/gi, '')
        .replace(/<\/body>/gi, '');
    }
    
    // 문제 번호가 있고 문제 제목(h1)에 링크가 없으면 링크 추가
    if (problemNumber && bodyContent) {
      // h1 태그를 찾아서 링크로 감싸기 (이미 링크가 있는 경우 제외)
      bodyContent = bodyContent.replace(
        /<h1([^>]*)>([^<]+)<\/h1>/gi,
        (match, attributes, titleText) => {
          // 이미 링크가 있는지 확인
          if (match.includes('<a') || match.includes('href=')) {
            return match;
          }
          // 링크가 없으면 추가
          const problemUrl = `https://www.acmicpc.net/problem/${problemNumber}`;
          return `<h1${attributes}><a href="${problemUrl}" target="_blank" rel="noopener noreferrer" style="color: inherit; text-decoration: none;">${titleText}</a></h1>`;
        }
      );
    }
    
    return bodyContent;
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
        font-size: 14px;
        line-height: 1.8;
        color: #e4e4e4;
        background-color: #1e1e1e;
        -webkit-font-smoothing: antialiased;
        -moz-osx-font-smoothing: grayscale;
        box-sizing: border-box;
        letter-spacing: 0.01em;
      }
      
      /* body 스타일을 컨테이너에 적용 */
      body {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
        font-size: 14px;
        line-height: 1.8;
        color: #e4e4e4;
        background-color: #1e1e1e;
        letter-spacing: 0.01em;
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
      h1 {
        font-size: 1.8em;
        margin-top: 0;
        margin-bottom: 0.8em;
        font-weight: 700;
        line-height: 1.3;
        color: #ffffff;
        letter-spacing: -0.02em;
      }
      
      /* h1 내부 링크 스타일 */
      h1 a {
        color: inherit;
        text-decoration: none;
        transition: opacity 0.2s;
      }
      
      h1 a:hover {
        opacity: 0.8;
      }
      
      h2 {
        font-size: 1.5em;
        margin-top: 1.2em;
        margin-bottom: 0.7em;
        font-weight: 600;
        line-height: 1.3;
        color: #f0f0f0;
        letter-spacing: -0.01em;
      }
      
      h3 {
        font-size: 1.3em;
        margin-top: 1em;
        margin-bottom: 0.6em;
        font-weight: 600;
        line-height: 1.4;
        color: #f0f0f0;
      }
      
      h4, h5, h6 {
        font-size: 1.1em;
        margin-top: 0.8em;
        margin-bottom: 0.5em;
        font-weight: 600;
        line-height: 1.4;
        color: #e8e8e8;
      }
      
      /* 기본 문단 스타일 */
      p {
        margin-bottom: 1.2em;
        line-height: 1.8;
        color: #e4e4e4;
      }
      
      /* 리스트 스타일 */
      ul, ol {
        margin-bottom: 1.2em;
        padding-left: 1.5em;
        line-height: 1.8;
      }
      
      li {
        margin-bottom: 0.5em;
        color: #e4e4e4;
      }
      
      /* 테이블 스타일 */
      table {
        width: 100%;
        border-collapse: collapse;
        margin: 1.2em 0;
        font-size: 0.95em;
      }
      
      th, td {
        padding: 0.6em 0.8em;
        border: 1px solid #3e3e42;
        text-align: left;
      }
      
      th {
        background-color: #2d2d30;
        font-weight: 600;
        color: #ffffff;
      }
      
      td {
        background-color: #252526;
        color: #e4e4e4;
      }
      
      /* 코드 블록 스타일 */
      pre {
        background-color: #252526;
        padding: 16px;
        border-radius: 6px;
        overflow-x: auto;
        border: 1px solid #3e3e42;
        margin: 1.2em 0;
        line-height: 1.6;
        font-size: 0.9em;
      }
      
      code {
        font-family: 'Consolas', 'Courier New', 'Monaco', monospace;
        font-size: 0.9em;
        color: #d4d4d4;
        background-color: rgba(255, 255, 255, 0.05);
        padding: 2px 6px;
        border-radius: 3px;
      }
      
      pre code {
        background-color: transparent;
        padding: 0;
        border: none;
        color: #d4d4d4;
        font-size: 0.9em;
        line-height: 1.6;
      }
      
      /* 인라인 코드 스타일 */
      p code, li code, td code {
        font-size: 0.9em;
        padding: 2px 6px;
        background-color: rgba(255, 255, 255, 0.08);
        border-radius: 3px;
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
    const bodyContent = extractBodyContent(html || '', problemNumber);
    
    // 모든 CSS 통합
    const baseStyles = getBaseStyles();
    const containerStyles = `
      .html-preview-container {
        padding: 24px;
        padding-right: 32px;
        width: 100%;
        min-height: 100%;
        box-sizing: border-box;
        max-width: 100%;
      }
      
      /* 텍스트 선택 시 색상 */
      ::selection {
        background-color: #264f78;
        color: #ffffff;
      }
      
      ::-moz-selection {
        background-color: #264f78;
        color: #ffffff;
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
  }, [html, css, problemNumber]);

  return (
    <div 
      ref={containerRef}
      style={{
        flex: 1,
        width: '100%',
        height: '100%',
        overflow: 'auto',
        backgroundColor: 'var(--color-bg-main)',
        boxSizing: 'border-box'
      }}
    />
  );
}

