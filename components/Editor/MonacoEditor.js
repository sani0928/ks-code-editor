'use client';

import dynamic from 'next/dynamic';
import { useRef } from 'react';

// Monaco Editor를 동적으로 로드 (SSR 방지)
const MonacoEditor = dynamic(() => import('@monaco-editor/react'), {
  ssr: false,
  // loading: () => (
  //   <div style={{ 
  //     flex: 1, 
  //     display: 'flex', 
  //     alignItems: 'center', 
  //     justifyContent: 'center', 
  //     color: 'var(--text-primary)' 
  //   }}>
  //     에디터 로딩 중...
  //   </div>
  // )
});

/**
 * Monaco Editor 래퍼 컴포넌트
 */
export default function MonacoEditorWrapper({
  value,
  language,
  onChange,
  onMount,
  height = '100%',
  options = {},
  editorKey
}) {
  const editorRef = useRef(null);

  const defaultOptions = {
    fontSize: 14,
    minimap: { enabled: true },
    scrollBeyondLastLine: false,
    automaticLayout: true,
    wordWrap: 'on',
    lineNumbers: 'on',
    renderLineHighlight: 'all',
    selectOnLineNumbers: true,
    roundedSelection: false,
    readOnly: false,
    cursorStyle: 'line',
    fontFamily: "'Consolas', 'Courier New', monospace",
    tabSize: 4,
    insertSpaces: true,
    detectIndentation: false,
    links: true,
    colorDecorators: true,
    undoRedo: 'full',
    ...options
  };

  const handleEditorDidMount = (editor, monaco) => {
    editorRef.current = editor;
    
    // 테마 설정
    if (monaco) {
      monaco.editor.setTheme('custom-theme');
    }
    
    if (onMount) {
      onMount(editor, monaco);
    }
  };

  return (
    <MonacoEditor
      key={editorKey}
      height={height}
      language={language}
      theme="custom-theme"
      value={value}
      onChange={onChange}
      onMount={handleEditorDidMount}
      options={defaultOptions}
    />
  );
}

