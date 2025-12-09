'use client';

/**
 * 문제 HTML 미리보기 컴포넌트
 */
export default function ProblemViewer({ html }) {
  return (
    <div style={{
      flex: 1,
      width: '100%',
      height: '100%',
      overflow: 'hidden',
      backgroundColor: 'var(--bg-primary)'
    }}>
      <iframe
        srcDoc={html || ''}
        style={{
          width: '100%',
          height: '100%',
          border: 'none',
          backgroundColor: 'var(--bg-primary)'
        }}
        title="Problem Preview"
        sandbox="allow-same-origin"
      />
    </div>
  );
}

