'use client';

import { useState, useEffect } from 'react';

/**
 * 출력 패널 컴포넌트
 */
export default function OutputPanel({ 
  output, 
  isRunning, 
  onRunCode 
}) {
  const [currentTime, setCurrentTime] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const hours = now.getHours();
      const minutes = String(now.getMinutes()).padStart(2, '0');
      const seconds = String(now.getSeconds()).padStart(2, '0');
      const ampm = hours >= 12 ? 'PM' : 'AM';
      const displayHours = hours % 12 || 12;
      const formattedHours = String(displayHours).padStart(2, '0');
      setCurrentTime(`${ampm} ${formattedHours}:${minutes}:${seconds}`);
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{
      height: '300px',
      display: 'flex',
      flexDirection: 'column',
      backgroundColor: 'var(--bg-primary)',
      borderTop: '1px solid var(--border-color)'
    }}>
      <div style={{
        height: '30px',
        backgroundColor: 'var(--bg-tertiary)',
        display: 'flex',
        alignItems: 'center',
        padding: '0 10px',
        borderBottom: '1px solid var(--border-color)',
        fontSize: '12px',
        color: 'var(--text-primary)',
        gap: '15px'
      }}>
        <div style={{
          padding: '4px 8px',
          cursor: 'pointer',
          borderRadius: '3px',
          backgroundColor: 'var(--bg-tertiary)',
        }}>
          OUTPUT
        </div>
        <button
          style={{
            padding: '4px 10px',
            backgroundColor: 'var(--accent-color)',
            color: 'var(--button-text)',
            border: 'none',
            borderRadius: '3px',
            cursor: isRunning ? 'not-allowed' : 'pointer',
            fontSize: '10px',
            fontWeight: 500,
            opacity: isRunning ? 0.6 : 1
          }}
          onClick={onRunCode}
          disabled={isRunning}
          onMouseEnter={(e) => {
            if (!isRunning) {
              e.currentTarget.style.backgroundColor = 'var(--button-hover-bg)';
            }
          }}
          onMouseLeave={(e) => {
            if (!isRunning) {
              e.currentTarget.style.backgroundColor = 'var(--accent-color)';
            }
          }}
        >
          {isRunning ? '실행 중...' : '▶ 실행'}
        </button>
        <div style={{
          fontSize: '10px',
          color: 'var(--text-secondary)',
          lineHeight: '1.5'
        }}>
          실행 시 입력은 input.txt 파일에서 자동으로 읽어옵니다.
        </div>
        <div style={{
          marginLeft: 'auto',
          fontSize: '11px',
          color: 'var(--text-primary)',
          fontFamily: "'Consolas', 'Courier New', monospace",
          fontWeight: 500
        }}>
          {currentTime}
        </div>
      </div>
      <div
        style={{
          flex: 1,
          padding: '10px',
          overflowY: 'auto',
          backgroundColor: 'var(--bg-primary)',
          fontFamily: "'Consolas', 'Courier New', monospace",
          fontSize: '13px',
          color: 'var(--text-primary)',
          whiteSpace: 'pre-wrap',
          wordWrap: 'break-word'
        }}
        dangerouslySetInnerHTML={{ __html: output || '출력이 여기에 표시됩니다...' }}
      />
    </div>
  );
}

