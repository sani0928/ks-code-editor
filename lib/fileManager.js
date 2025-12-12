/**
 * 파일 관리 유틸리티
 */

import { skeletonCodes, fileOrder, specialFiles as specialFilesList } from '../constants/skeletonCode';

// specialFiles를 export하여 다른 컴포넌트에서 사용할 수 있도록 함
export { specialFilesList as specialFiles };

/**
 * 초기 파일 목록 생성
 * @returns {Object} 초기 파일 객체
 */
export function createInitialFiles() {
  const files = {};
  
  // 스켈레톤 코드 파일들 추가
  Object.keys(skeletonCodes).forEach(filename => {
    files[filename] = skeletonCodes[filename];
  });
  
  return files;
}

/**
 * 파일명으로 언어 감지
 * @param {string} filename - 파일명
 * @returns {string} 언어 타입 (Monaco Editor 언어 ID - 소문자)
 */
export function getLanguageFromFile(filename) {
  const ext = filename.split('.').pop()?.toLowerCase() || '';
  const languageMap = {
    'py': 'python',
    'js': 'javascript',
    'jsx': 'javascript',
    'ts': 'typescript',
    'tsx': 'typescript',
    'css': 'css',
    'html': 'html',
    'md': 'markdown',
    'json': 'json',
    'xml': 'xml',
    'sql': 'sql',
    'java': 'java',
    'cpp': 'cpp',
    'c': 'c',
    'go': 'go',
    'rs': 'rust',
    'php': 'php',
    'rb': 'ruby',
    'sh': 'shell',
    'yaml': 'yaml',
    'yml': 'yaml',
    'txt': 'plaintext',
    'ai': 'plaintext'
  };
  return languageMap[ext] || 'plaintext';
}

/**
 * EXPLORER에서 표시할 파일 목록 정렬
 * @param {Object} files - 파일 객체
 * @returns {string[]} 정렬된 파일명 배열
 */
export function getSortedFileList(files) {
  const regularFiles = [];
  const special = [];
  
  // 일반 파일들 (순서대로)
  fileOrder.forEach(filename => {
    if (files[filename] !== undefined) {
      regularFiles.push(filename);
    }
  });
  
  // 나머지 일반 파일들 (알파벳 순, HTML 파일 제외)
  Object.keys(files).forEach(filename => {
    const isHtmlFile = filename.endsWith('.html') && filename !== 'style.css';
    if (!fileOrder.includes(filename) && !specialFilesList.includes(filename) && !isHtmlFile) {
      regularFiles.push(filename);
    }
  });
  
  // 특수 파일들 정렬: profile.html -> (문제이름).html -> input.txt -> style.css -> 옜다정답.ai
  const profileHtml = [];
  const problemHtmlFiles = [];
  const otherSpecialFiles = [];
  const chatbotFile = [];
  
  // 모든 HTML 파일 수집 및 분류
  Object.keys(files).forEach(filename => {
    if (filename.endsWith('.html') && filename !== 'style.css') {
      if (filename === 'profile.html') {
        profileHtml.push(filename);
      } else {
        problemHtmlFiles.push(filename);
      }
    }
  });
  
  // specialFiles에 있는 나머지 파일들 (input.txt, style.css, 옜다정답.ai) - 순서대로
  specialFilesList.forEach(filename => {
    if (files[filename] !== undefined && filename !== 'profile.html' && !filename.endsWith('.html')) {
      if (filename === '옜다정답.ai') {
        chatbotFile.push(filename);
      } else {
        otherSpecialFiles.push(filename);
      }
    }
  });
  
  // 문제 HTML 파일들 알파벳 순 정렬
  problemHtmlFiles.sort();
  
  // 순서: profile.html -> (문제이름).html -> input.txt -> style.css -> 옜다정답.ai
  special.push(...profileHtml, ...problemHtmlFiles, ...otherSpecialFiles, ...chatbotFile);
  
  return [...regularFiles, ...special];
}


/**
 * 코드 파일인지 확인 (다운로드 가능한 파일)
 * @param {string} filename - 파일명
 * @returns {boolean} 코드 파일 여부
 */
export function isCodeFile(filename) {
  if (!filename) return false;
  
  // 특수 파일 제외
  if (filename === 'input.txt' || filename === 'style.css' || filename === '옜다정답.ai') {
    return false;
  }
  
  // HTML 파일 제외
  if (filename.endsWith('.html')) {
    return false;
  }
  
  // 코드 파일 확장자 확인
  const codeExtensions = [
    'py', 'js', 'jsx', 'ts', 'tsx', 'java', 'cpp', 'c', 'h', 'hpp',
    'go', 'rs', 'php', 'rb', 'swift', 'kt', 'scala', 'clj',
    'sh', 'bash', 'zsh', 'fish', 'ps1',
    'sql', 'r', 'm', 'mm', 'cs', 'vb', 'fs',
    'dart', 'lua', 'pl', 'pm', 'tcl', 'vim', 'el'
  ];
  
  const ext = filename.split('.').pop()?.toLowerCase() || '';
  return codeExtensions.includes(ext);
}

