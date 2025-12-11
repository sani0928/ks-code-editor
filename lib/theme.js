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
  if (window.monaco && variables['color-bg-editor'] && variables['color-text-editor']) {
    try {
      const themeColors = {
        'editor.background': variables['color-bg-editor'],
        'editor.foreground': variables['color-text-editor'],
        'editor.lineHighlightBackground': variables['color-bg-header'] || variables['color-bg-sidebar'],
        'editor.selectionBackground': (variables['color-accent-primary'] || '#007acc') + '40',
        'editorCursor.foreground': variables['color-accent-primary'] || '#007acc',
        'editorWhitespace.foreground': (variables['color-border-default'] || '#3e3e42') + '40',
        'editorIndentGuide.background': (variables['color-border-default'] || '#3e3e42') + '40',
        'editorIndentGuide.activeBackground': variables['color-border-default'] || '#3e3e42',
        'editorLineNumber.foreground': variables['color-text-secondary'] || '#858585',
        'editorLineNumber.activeForeground': variables['color-text-primary'] || '#cccccc',
        'editorGutter.background': variables['color-bg-main'] || '#1e1e1e',
        'editorWidget.background': variables['color-bg-sidebar'] || '#252526',
        'editorWidget.border': variables['color-border-default'] || '#3e3e42',
        'editorSuggestWidget.background': variables['color-bg-sidebar'] || '#252526',
        'editorSuggestWidget.border': variables['color-border-default'] || '#3e3e42',
        'editorSuggestWidget.foreground': variables['color-text-primary'] || '#cccccc',
        'editorSuggestWidget.selectedBackground': variables['color-bg-header'] || '#2d2d30',
        'editorHoverWidget.background': variables['color-bg-sidebar'] || '#252526',
        'editorHoverWidget.border': variables['color-border-default'] || '#3e3e42',
        'input.background': variables['color-bg-input'] || '#1e1e1e',
        'input.border': variables['color-border-input'] || '#3e3e42',
        'input.foreground': variables['color-text-input'] || '#cccccc',
        'inputOption.activeBorder': variables['color-accent-primary'] || '#007acc',
        'dropdown.background': variables['color-bg-sidebar'] || '#252526',
        'dropdown.border': variables['color-border-default'] || '#3e3e42',
        'dropdown.foreground': variables['color-text-primary'] || '#cccccc',
        'list.activeSelectionBackground': variables['color-bg-header'] || '#2d2d30',
        'list.activeSelectionForeground': variables['color-text-primary'] || '#cccccc',
        'list.hoverBackground': variables['color-bg-header'] || '#2d2d30',
        'list.inactiveSelectionBackground': variables['color-bg-header'] || '#2d2d30',
        'scrollbar.shadow': (variables['color-border-default'] || '#3e3e42') + '40',
        'scrollbarSlider.background': variables['color-scrollbar-thumb'] || (variables['color-border-default'] || '#3e3e42') + '80',
        'scrollbarSlider.hoverBackground': variables['color-scrollbar-thumb-hover'] || variables['color-border-default'] || '#3e3e42',
        'scrollbarSlider.activeBackground': variables['color-scrollbar-thumb-hover'] || variables['color-border-default'] || '#3e3e42'
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

