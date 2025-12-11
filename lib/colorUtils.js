/**
 * 색상 유틸리티 함수들
 */

/**
 * 색상을 어둡게 만드는 함수 (CSS 변수 또는 실제 색상 값 모두 처리)
 * @param {string} color - CSS 변수명 (예: '--color-button-primary-bg') 또는 실제 색상 값 (예: '#007acc', 'rgb(0, 122, 204)')
 * @param {number} amount - 어둡게 할 정도 (0-1, 기본값: 0.15)
 * @returns {string} 어두워진 RGB 색상 값
 */
export const darkenColor = (color, amount = 0.15) => {
  try {
    let computedColor = color;
    
    // CSS 변수인 경우 처리
    if (color.startsWith('var(') || color.startsWith('--')) {
      const root = document.documentElement;
      const varName = color.startsWith('var(') 
        ? color.match(/var\(([^)]+)\)/)?.[1]?.trim() 
        : color;
      computedColor = getComputedStyle(root).getPropertyValue(varName).trim() || color;
    }
    
    if (!computedColor) return color;
    
    // #hex 형식 처리
    if (computedColor.startsWith('#')) {
      const hex = computedColor.slice(1);
      const num = parseInt(hex, 16);
      const r = Math.max(0, Math.floor((num >> 16) * (1 - amount)));
      const g = Math.max(0, Math.floor(((num >> 8) & 0x00FF) * (1 - amount)));
      const b = Math.max(0, Math.floor((num & 0x0000FF) * (1 - amount)));
      return `rgb(${r}, ${g}, ${b})`;
    }
    
    // rgb/rgba 형식 처리
    const rgbMatch = computedColor.match(/\d+/g);
    if (rgbMatch && rgbMatch.length >= 3) {
      const r = Math.max(0, Math.floor(parseInt(rgbMatch[0]) * (1 - amount)));
      const g = Math.max(0, Math.floor(parseInt(rgbMatch[1]) * (1 - amount)));
      const b = Math.max(0, Math.floor(parseInt(rgbMatch[2]) * (1 - amount)));
      return `rgb(${r}, ${g}, ${b})`;
    }
    
    return computedColor;
  } catch (e) {
    return color;
  }
};

