/**
 * 환경 변수 및 사이트 URL 관리
 */

/**
 * 현재 환경에 맞는 사이트 URL을 반환합니다.
 * - 개발 환경: http://localhost:3000
 * - 프로덕션 환경: NEXT_PUBLIC_SITE_URL 환경 변수 또는 기본값
 */
export function getSiteUrl() {
  // 개발 환경 체크
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  if (isDevelopment) {
    // 개발 환경에서는 localhost 사용
    const port = process.env.PORT || 3000;
    return `http://localhost:${port}`;
  }
  
  // 프로덕션 환경에서는 환경 변수 또는 기본값 사용
  return process.env.NEXT_PUBLIC_SITE_URL || 'https://ks-code-editor.com';
}

/**
 * 프로덕션 환경 여부 확인
 */
export function isProduction() {
  return process.env.NODE_ENV === 'production';
}

/**
 * 개발 환경 여부 확인
 */
export function isDevelopment() {
  return process.env.NODE_ENV === 'development';
}

