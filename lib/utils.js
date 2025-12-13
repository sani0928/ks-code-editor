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

/**
 * 티어 레벨을 문자열로 변환
 * @param {number} level - 티어 레벨 (1-30)
 * @returns {string|null} 티어 문자열 (예: "Bronze V", "Gold III") 또는 "Master" 또는 null
 */
export function convertTierLevel(level) {
  if (!level) return null;
  
  const romanNumerals = { 1: "V", 2: "IV", 3: "III", 4: "II", 5: "I" };
  let tierName, tierLevel;
  
  if (level <= 5) {
    tierName = "Bronze";
    tierLevel = level;
  } else if (level <= 10) {
    tierName = "Silver";
    tierLevel = level - 5;
  } else if (level <= 15) {
    tierName = "Gold";
    tierLevel = level - 10;
  } else if (level <= 20) {
    tierName = "Platinum";
    tierLevel = level - 15;
  } else if (level <= 25) {
    tierName = "Diamond";
    tierLevel = level - 20;
  } else if (level <= 30) {
    tierName = "Ruby";
    tierLevel = level - 25;
  } else {
    return "Master";
  }
  
  return `${tierName} ${romanNumerals[tierLevel]}`;
}

/**
 * 티어별 색상 반환
 * @param {string} tierName - 티어 이름 (예: "Bronze V", "Gold III")
 * @returns {string} 티어 색상 (hex 코드)
 */
export function getTierColor(tierName) {
  if (!tierName) return '#007acc';
  
  const tier = tierName.toLowerCase();
  if (tier.includes('bronze')) return '#AD5600'; // 브론즈 - 황동색
  if (tier.includes('silver')) return '#435F7A'; // 실버 - 은색
  if (tier.includes('gold')) return '#EC9A00'; // 골드 - 금색
  if (tier.includes('platinum')) return '#27E2A4'; // 플래티넘 - 청록색
  if (tier.includes('diamond')) return '#00B4FC'; // 다이아몬드 - 파란색
  if (tier.includes('ruby')) return '#FF0062'; // 루비 - 분홍색
  if (tier.includes('master')) return '#000000'; // 마스터 - 검은색
  
  return '#007acc'; // 기본 색상
}

/**
 * HTML에서 head 내부의 style 태그 추출
 * @param {string} htmlString - HTML 문자열
 * @returns {string} 추출된 스타일 내용
 */
export function extractHeadStyles(htmlString) {
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
}

/**
 * HTML에서 body 내용 추출 및 선택적으로 h1 태그에 링크 추가
 * @param {string} htmlString - HTML 문자열
 * @param {Object} options - 옵션 객체
 * @param {string} options.linkId - 링크에 사용할 ID (문제 번호 또는 유저 아이디)
 * @param {string} options.linkType - 링크 타입 ('problem' | 'profile')
 * @returns {string} 추출된 body 내용
 */
export function extractBodyContent(htmlString, options = {}) {
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
  
  // 링크 추가 옵션이 있으면 h1 태그에 링크 추가
  if (options.linkId && bodyContent) {
    const { linkId, linkType } = options;
    let linkUrl = '';
    
    if (linkType === 'problem') {
      linkUrl = `https://www.acmicpc.net/problem/${linkId}`;
    } else if (linkType === 'profile') {
      linkUrl = `https://solved.ac/profile/${linkId}`;
    }
    
    if (linkUrl) {
      // h1 태그를 찾아서 링크로 감싸기 (이미 링크가 있는 경우 제외)
      bodyContent = bodyContent.replace(
        /<h1([^>]*)>([^<]+)<\/h1>/gi,
        (match, attributes, titleText) => {
          // 이미 링크가 있는지 확인
          if (match.includes('<a') || match.includes('href=')) {
            return match;
          }
          // 링크가 없으면 추가
          return `<h1${attributes}><a href="${linkUrl}" target="_blank" rel="noopener noreferrer" style="color: inherit; text-decoration: none;">${titleText}</a></h1>`;
        }
      );
    }
  }
  
  return bodyContent;
}

