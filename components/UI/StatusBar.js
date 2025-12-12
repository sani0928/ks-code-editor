'use client';

/**
 * 하단 상태바 컴포넌트
 */
export default function StatusBar({ cursorPosition, language, filename }) {
  // 언어 표시 이름 매핑
  const languageDisplayMap = {
    'cpp': 'C++',
    'css': 'CSS',
    'html': 'HTML',
    'javascript': 'JavaScript'
  };

  // '옜다정답.ai' 파일인 경우 'AI'로 표시
  let displayLanguage;
  if (filename === '옜다정답.ai') {
    displayLanguage = '옜다정답 AI';
  } else {
    // 매핑된 이름이 있으면 사용, 없으면 첫 글자만 대문자로 변환
    displayLanguage = languageDisplayMap[language] || 
      (language.charAt(0).toUpperCase() + language.slice(1));
  }

  return (
    <div style={{
      height: '22px',
      backgroundColor: 'var(--color-accent-primary)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 10px',
      fontSize: '12px',
      color: 'var(--color-text-statusbar)'
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
          {displayLanguage}
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <span style={{ marginRight: '5px' }}>문의 및 피드백</span>
        <a
          href="https://gmail.com/"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            color: 'var(--color-text-statusbar)',
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
