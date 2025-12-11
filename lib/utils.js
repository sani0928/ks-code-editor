/**
 * 공통 유틸리티 함수
 */

/**
 * HTML 이스케이프
 * @param {string} text - 이스케이프할 텍스트
 * @returns {string} 이스케이프된 텍스트
 */
export function escapeHtml(text) {
  if (!text) return '';
  
  // 브라우저 환경에서는 DOM API 사용
  if (typeof document !== 'undefined') {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
  
  // 서버 환경에서는 문자열 치환 사용
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return String(text).replace(/[&<>"']/g, m => map[m]);
}

/**
 * 클라이언트 환경 확인
 * @returns {boolean} 클라이언트 환경 여부
 */
export function isClient() {
  return typeof window !== 'undefined';
}

