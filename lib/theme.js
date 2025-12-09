/**
 * 테마 관리 유틸리티
 */

/**
 * CSS에서 :root 블록의 CSS 변수를 파싱하여 적용
 * @param {string} cssContent - CSS 내용
 */
export function applyCSSVariables(cssContent) {
  if (typeof window === 'undefined') return;
  
  const root = document.documentElement;
  
  // :root 블록 찾기
  const rootBlockMatch = cssContent.match(/:root\s*\{([^}]+)\}/);
  if (!rootBlockMatch) {
    return;
  }
  
  const rootContent = rootBlockMatch[1];
  
  // CSS 변수 파싱 (--변수명: 값; 형식)
  const variableRegex = /--([^:]+):\s*([^;]+);/g;
  let match;
  const variables = {};
  
  while ((match = variableRegex.exec(rootContent)) !== null) {
    const variableName = match[1].trim();
    const variableValue = match[2].trim();
    root.style.setProperty(`--${variableName}`, variableValue);
    variables[variableName] = variableValue;
  }
  
  // Monaco Editor 테마 업데이트
  if (window.monaco && variables['editor-bg'] && variables['editor-text']) {
    try {
      const themeColors = {
        'editor.background': variables['editor-bg'],
        'editor.foreground': variables['editor-text'],
        'editor.lineHighlightBackground': variables['bg-tertiary'] || variables['bg-secondary'],
        'editor.selectionBackground': (variables['accent-color'] || '#007acc') + '40',
        'editorCursor.foreground': variables['accent-color'] || '#007acc',
        'editorWhitespace.foreground': (variables['border-color'] || '#3e3e42') + '40',
        'editorIndentGuide.background': (variables['border-color'] || '#3e3e42') + '40',
        'editorIndentGuide.activeBackground': variables['border-color'] || '#3e3e42',
        'editorLineNumber.foreground': variables['text-secondary'] || '#858585',
        'editorLineNumber.activeForeground': variables['text-primary'] || '#cccccc',
        'editorGutter.background': variables['bg-primary'] || '#1e1e1e',
        'editorWidget.background': variables['bg-secondary'] || '#252526',
        'editorWidget.border': variables['border-color'] || '#3e3e42',
        'editorSuggestWidget.background': variables['bg-secondary'] || '#252526',
        'editorSuggestWidget.border': variables['border-color'] || '#3e3e42',
        'editorSuggestWidget.foreground': variables['text-primary'] || '#cccccc',
        'editorSuggestWidget.selectedBackground': variables['bg-tertiary'] || '#2d2d30',
        'editorHoverWidget.background': variables['bg-secondary'] || '#252526',
        'editorHoverWidget.border': variables['border-color'] || '#3e3e42',
        'input.background': variables['bg-primary'] || '#1e1e1e',
        'input.border': variables['border-color'] || '#3e3e42',
        'input.foreground': variables['text-primary'] || '#cccccc',
        'inputOption.activeBorder': variables['accent-color'] || '#007acc',
        'dropdown.background': variables['bg-secondary'] || '#252526',
        'dropdown.border': variables['border-color'] || '#3e3e42',
        'dropdown.foreground': variables['text-primary'] || '#cccccc',
        'list.activeSelectionBackground': variables['bg-tertiary'] || '#2d2d30',
        'list.activeSelectionForeground': variables['text-primary'] || '#cccccc',
        'list.hoverBackground': variables['bg-tertiary'] || '#2d2d30',
        'list.inactiveSelectionBackground': variables['bg-tertiary'] || '#2d2d30',
        'scrollbar.shadow': (variables['border-color'] || '#3e3e42') + '40',
        'scrollbarSlider.background': variables['scrollbar-thumb'] || (variables['border-color'] || '#3e3e42') + '80',
        'scrollbarSlider.hoverBackground': variables['scrollbar-thumb-hover'] || variables['border-color'] || '#3e3e42',
        'scrollbarSlider.activeBackground': variables['scrollbar-thumb-hover'] || variables['border-color'] || '#3e3e42'
      };
      
      window.monaco.editor.defineTheme('custom-theme', {
        base: 'vs-dark',
        inherit: true,
        rules: [],
        colors: themeColors
      });
      
      // 모든 에디터 인스턴스에 테마 적용
      if (window.monaco && window.monaco.editor) {
        window.monaco.editor.setTheme('custom-theme');
      }
    } catch (error) {
      console.error('Monaco Editor 테마 업데이트 오류:', error);
    }
  }
}

