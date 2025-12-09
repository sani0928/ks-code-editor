'use client';

import { useState, useEffect, useRef } from 'react';
import { PiCopySimple } from 'react-icons/pi';
import MusicPlayer from './MusicPlayer';

/**
 * 출력 패널 컴포넌트
 */
export default function OutputPanel({ 
  output, 
  isRunning, 
  onRunCode 
}) {
  const [currentTime, setCurrentTime] = useState('');
  const outputRef = useRef(null);

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

  // 출력이 업데이트될 때마다 스크롤을 맨 아래로 이동
  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [output]);

  // 출력 결과 복사 함수
  const handleCopy = async () => {
    if (!output) return;
    
    try {
      // HTML 태그 제거하고 순수 텍스트만 추출
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = output;
      const textContent = tempDiv.textContent || tempDiv.innerText || '';
      
      await navigator.clipboard.writeText(textContent);
      
      // 복사 성공 피드백 (선택사항)
      const copyButton = document.querySelector('[data-copy-button]');
      if (copyButton) {
        const originalColor = copyButton.style.color;
        copyButton.style.color = 'var(--accent-color)';
        setTimeout(() => {
          copyButton.style.color = originalColor;
        }, 500);
      }
    } catch (error) {
      console.error('복사 실패:', error);
    }
  };

  return (
    <div style={{
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      backgroundColor: 'var(--bg-primary)',
      borderTop: '1px solid var(--border-color)',
      minHeight: 0,
      overflow: 'hidden'
    }}>
      <div 
        style={{
          height: '30px',
          backgroundColor: 'var(--bg-tertiary)',
          display: 'flex',
          alignItems: 'center',
          padding: '0 10px',
          borderBottom: '1px solid var(--border-color)',
          fontSize: '12px',
          color: 'var(--text-primary)',
          gap: '12px',
          userSelect: 'none',
          WebkitUserSelect: 'none',
          MozUserSelect: 'none',
          msUserSelect: 'none'
        }}
        onDragStart={(e) => e.preventDefault()}
      >
        <div style={{
          padding: '4px 8px',
          cursor: 'pointer',
          borderRadius: '3px',
          fontWeight: 500,
          backgroundColor: 'var(--bg-tertiary)',
        }}>
          OUTPUT
        </div>
        <button
          data-copy-button
          onClick={handleCopy}
          disabled={!output}
          style={{
            padding: '4px 8px',
            backgroundColor: 'transparent',
            color: output ? 'var(--text-primary)' : 'var(--text-secondary)',
            border: 'none',
            borderRadius: '3px',
            cursor: output ? 'pointer' : 'default',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '14px',
            opacity: output ? 1 : 0.5,
            transition: 'color 0.2s'
          }}
          title="OUTPUT 복사"
        >
          <PiCopySimple />
        </button>
        <button
          style={{
            padding: '4px 10px',
            backgroundColor: 'var(--accent-color)',
            color: 'var(--button-text)',
            border: 'none',
            borderRadius: '3px',
            cursor: isRunning ? 'not-allowed' : 'pointer',
            fontSize: '10px',
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
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          <MusicPlayer />
          <div style={{
            fontSize: '11px',
            color: 'var(--text-primary)',
            fontFamily: "'Consolas', 'Courier New', monospace",
            fontWeight: 500
          }}>
            {currentTime}
          </div>
        </div>
      </div>
      <div
        ref={outputRef}
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

