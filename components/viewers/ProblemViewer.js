'use client';

import { useEffect, useRef } from 'react';
import { themeTemplates } from '../../constants/skeletonCode';
import { extractCSSVariables } from '../../lib/theme';
import { extractHeadStyles, extractBodyContent } from '../../lib/utils';

/**
 * CSS 변수를 :root 스타일 문자열로 변환
 */
const getCSSVariablesStyle = (themeMode, css) => {
  let cssToParse = css;
  
  // CSS가 없거나 themeMode에 따라 기본 테마 템플릿 사용
  if (!cssToParse || themeMode === 'dark' || themeMode === 'light') {
    cssToParse = themeTemplates[themeMode] || themeTemplates.dark;
  }
  
  const variables = extractCSSVariables(cssToParse);
  
  // CSS 변수를 :root 스타일로 변환
  const variableDeclarations = Object.entries(variables)
    .map(([key, value]) => `      --${key}: ${value};`)
    .join('\n');
  
  return `:root {\n${variableDeclarations}\n    }`;
};

/**
 * 문제 HTML 미리보기 컴포넌트
 */
export default function ProblemViewer({ html, css, problemNumber, themeMode = 'dark' }) {
  const containerRef = useRef(null);


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
        color: var(--color-text-primary, #cccccc);
        background-color: var(--color-bg-main, #1e1e1e);
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
        color: var(--color-text-primary, #cccccc);
        background-color: var(--color-bg-main, #1e1e1e);
        letter-spacing: 0.01em;
      }
      
      /* 스크롤바 스타일 */
      ::-webkit-scrollbar {
        width: 10px;
        height: 10px;
      }
      
      ::-webkit-scrollbar-track {
        background: var(--color-scrollbar-track, var(--color-bg-sidebar, #252526));
      }
      
      ::-webkit-scrollbar-thumb {
        background: var(--color-scrollbar-thumb, #424242);
        border-radius: 5px;
      }
      
      ::-webkit-scrollbar-thumb:hover {
        background: var(--color-scrollbar-thumb-hover, #4e4e4e);
      }
      
      /* 기본 링크 스타일 */
      a {
        color: var(--color-accent-primary, #007acc);
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
        color: var(--color-text-primary, #ffffff);
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
        color: var(--color-text-primary, #f0f0f0);
        letter-spacing: -0.01em;
      }
      
      h3 {
        font-size: 1.3em;
        margin-top: 1em;
        margin-bottom: 0.6em;
        font-weight: 600;
        line-height: 1.4;
        color: var(--color-text-primary, #f0f0f0);
      }
      
      h4, h5, h6 {
        font-size: 1.1em;
        margin-top: 0.8em;
        margin-bottom: 0.5em;
        font-weight: 600;
        line-height: 1.4;
        color: var(--color-text-primary, #e8e8e8);
      }
      
      /* 기본 문단 스타일 */
      p {
        margin-bottom: 1.2em;
        line-height: 1.8;
        color: var(--color-text-primary, #cccccc);
      }
      
      /* 리스트 스타일 */
      ul, ol {
        margin-bottom: 1.2em;
        padding-left: 1.5em;
        line-height: 1.8;
      }
      
      li {
        margin-bottom: 0.5em;
        color: var(--color-text-primary, #cccccc);
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
        border: 1px solid var(--color-border-default, #3e3e42);
        text-align: left;
      }
      
      th {
        background-color: var(--color-bg-header, #2d2d30);
        font-weight: 600;
        color: var(--color-text-primary, #ffffff);
      }
      
      td {
        background-color: var(--color-bg-sidebar, #252526);
        color: var(--color-text-primary, #cccccc);
      }
      
      /* 코드 블록 스타일 */
      pre {
        background-color: var(--color-bg-sidebar, #252526);
        padding: 16px;
        border-radius: 6px;
        overflow-x: auto;
        border: 1px solid var(--color-border-default, #3e3e42);
        margin: 1.2em 0;
        line-height: 1.6;
        font-size: 0.9em;
      }
      
      code {
        font-family: 'Consolas', 'Courier New', 'Monaco', monospace;
        font-size: 0.9em;
        color: var(--color-text-primary, #cccccc);
        background-color: var(--color-bg-sidebar, #252526);
        padding: 2px 6px;
        border-radius: 3px;
      }
      
      pre code {
        background-color: transparent;
        padding: 0;
        border: none;
        color: var(--color-text-primary, #cccccc);
        font-size: 0.9em;
        line-height: 1.6;
      }
      
      /* 인라인 코드 스타일 */
      p code, li code, td code {
        font-size: 0.9em;
        padding: 2px 6px;
        background-color: var(--color-bg-sidebar, #252526);
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
    const bodyContent = extractBodyContent(html || '', {
      linkId: problemNumber,
      linkType: 'problem'
    });
    
    // CSS 변수 주입
    const cssVariablesStyle = getCSSVariablesStyle(themeMode, css);
    
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
        background-color: var(--color-accent-primary, #007acc);
        color: var(--color-text-button, #ffffff);
        opacity: 0.6;
      }
      
      ::-moz-selection {
        background-color: var(--color-accent-primary, #007acc);
        color: var(--color-text-button, #ffffff);
        opacity: 0.6;
      }
    `;
    const allCSS = [cssVariablesStyle, baseStyles, containerStyles, headStyles].filter(Boolean).join('\n');
    
    // Shadow DOM에 내용 삽입
    shadowRoot.innerHTML = `
      <style>${allCSS}</style>
      <div class="html-preview-container">
        ${bodyContent}
      </div>
    `;
  }, [html, css, problemNumber, themeMode]);

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

