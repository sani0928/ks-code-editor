'use client';

/**
 * 하단 상태바 컴포넌트
 */
export default function StatusBar({ cursorPosition, language }) {
  return (
    <div style={{
      height: '22px',
      backgroundColor: 'var(--accent-color)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 10px',
      fontSize: '12px',
      color: 'var(--statusbar-text)'
    }}>
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <div style={{ marginRight: '15px', display: 'flex', alignItems: 'center' }}>
          {cursorPosition}
        </div>
        <div style={{ marginRight: '15px', display: 'flex', alignItems: 'center' }}>
          Spaces: 4
        </div>
        <div style={{ marginRight: '15px', display: 'flex', alignItems: 'center' }}>
          UTF-8
        </div>
        <div style={{ marginRight: '15px', display: 'flex', alignItems: 'center' }}>
          {language.charAt(0).toUpperCase() + language.slice(1)}
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <span style={{ marginRight: '5px' }}>문의 및 피드백</span>
        <a
          href="https://gmail.com/"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            color: 'var(--statusbar-text)',
            textDecoration: 'none',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'opacity 0.2s'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.opacity = '1.5';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.opacity = '1';
          }}
        >
          kksan12@gmail.com
        </a>
      </div>
    </div>
  );
}

