'use client';

import { useState, useEffect, useRef } from 'react';
import { PiCopySimple, PiCaretDown, PiCaretUp } from 'react-icons/pi';
import MusicPlayer from './MusicPlayer';
import { darkenColor } from '../../lib/colorUtils';

// 화면 크기 감지 훅 (768px 이상만 고려)
const useResponsiveSize = () => {
  const [size, setSize] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 1920,
    isCompact: false
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleResize = () => {
      const width = window.innerWidth;
      // 768px 이상에서만 동작, 768px~1024px 사이를 compact로 간주
      setSize({
        width,
        isCompact: width >= 768 && width <= 1024
      });
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return size;
};

/**
 * 출력 패널 컴포넌트
 */
export default function OutputPanel({ 
  output, 
  isRunning, 
  onRunCode,
  onCollapseChange,
  outputStatus
}) {
  const [currentTime, setCurrentTime] = useState('');
  const [isCollapsed, setIsCollapsed] = useState(false);
  const outputRef = useRef(null);
  const { isCompact } = useResponsiveSize();

  // 버튼 색상 결정
  const getButtonColor = () => {
    if (isRunning) return 'var(--color-accent-primary)'; // 실행 중일 때는 기본 색상
    if (outputStatus === 'success') return '#27ae60'; // 진한 초록색 (성공)
    if (outputStatus === 'error') return '#c0392b'; // 진한 빨간색 (에러)
    return 'var(--color-accent-primary)'; // 기본 색상
  };

  // 접기/펼치기 토글
  const handleToggleCollapse = () => {
    const newCollapsed = !isCollapsed;
    setIsCollapsed(newCollapsed);
    if (onCollapseChange) {
      onCollapseChange(newCollapsed);
    }
  };

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      const seconds = String(now.getSeconds()).padStart(2, '0');
      setCurrentTime(`${hours}:${minutes}:${seconds}`);
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
        copyButton.style.color = 'var(--color-accent-primary)';
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
      backgroundColor: 'var(--color-bg-main)',
      borderTop: '1px solid var(--color-border-default)',
      minHeight: 0,
      overflow: 'hidden'
    }}>
      <div 
        style={{
          height: '30px',
          backgroundColor: 'var(--color-bg-header)',
          display: 'flex',
          alignItems: 'center',
          padding: isCompact ? '0 6px' : '0 10px',
          borderBottom: '1px solid var(--color-border-default)',
          fontSize: isCompact ? '11px' : '12px',
          color: 'var(--color-text-primary)',
          gap: isCompact ? '6px' : '12px',
          userSelect: 'none',
          WebkitUserSelect: 'none',
          MozUserSelect: 'none',
          msUserSelect: 'none',
          overflowX: 'auto',
          overflowY: 'hidden',
          minWidth: 0
        }}
        onDragStart={(e) => e.preventDefault()}
      >
        <div style={{
          padding: isCompact ? '4px 6px' : '4px 8px',
          borderRadius: '5px',
          fontWeight: 500,
          backgroundColor: 'var(--color-bg-header)',
          flexShrink: 0,
          fontSize: isCompact ? '10px' : '12px',
        }}>
          OUTPUT
        </div>
        <button
          data-copy-button
          onClick={handleCopy}
          disabled={!output}
          style={{
            padding: isCompact ? '4px 6px' : '4px 8px',
            backgroundColor: 'transparent',
            color: output ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
            border: 'none',
            borderRadius: '5px',
            cursor: output ? 'pointer' : 'default',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: isCompact ? '12px' : '14px',
            opacity: output ? 1 : 0.3,
            transition: 'color 0.2s',
            flexShrink: 0
          }}
          title="출력 복사"
        >
          <PiCopySimple />
        </button>
        <button
          style={{
            padding: isCompact ? '4px 6px' : '4px 10px',
            backgroundColor: getButtonColor(),
            color: 'var(--color-text-button)',
            border: 'none',
            borderRadius: '5px',
            cursor: isRunning ? 'not-allowed' : 'pointer',
            fontSize: isCompact ? '9px' : '10px',
            opacity: isRunning ? 0.6 : 1,
            transition: 'background-color 0.3s',
            whiteSpace: 'nowrap',
            flexShrink: 0
          }}
          onClick={onRunCode}
          disabled={isRunning}
          onMouseEnter={(e) => {
            if (!isRunning) {
              const currentColor = getButtonColor();
              // 호버 시 약간 어둡게
              e.currentTarget.style.backgroundColor = darkenColor(currentColor);
            }
          }}
          onMouseLeave={(e) => {
            if (!isRunning) {
              e.currentTarget.style.backgroundColor = getButtonColor();
            }
          }}
        >
          {isRunning ? '실행 중...' : '▶ 실행'}
        </button>
        {!isCompact && (
          <div style={{
            fontSize: '10px',
            color: 'var(--color-text-secondary)',
            lineHeight: '1.5',
            flexShrink: 0,
            whiteSpace: 'nowrap'
          }}>
            실행 시 입력은 input.txt 파일에서 자동으로 읽어옵니다.
          </div>
        )}
        <div style={{
          marginLeft: 'auto',
          display: 'flex',
          alignItems: 'center',
          gap: isCompact ? '6px' : '12px',
          flexShrink: 0
        }}>
          <MusicPlayer isCompact={isCompact} />
          <div style={{
            fontSize: isCompact ? '10px' : '11px',
            color: 'var(--color-text-primary)',
            fontFamily: "'Consolas', 'Courier New', monospace",
            fontWeight: 500,
            flexShrink: 0,
            whiteSpace: 'nowrap'
          }}>
            {currentTime}
          </div>
          <button
            onClick={handleToggleCollapse}
            style={{
              padding: '4px 6px',
              backgroundColor: 'transparent',
              color: 'var(--color-text-primary)',
              border: 'none',
              outline: 'none',
              cursor: 'default',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: isCompact ? '12px' : '14px',
              lineHeight: '1',
              minWidth: '26px',
              minHeight: '22px',
              boxSizing: 'border-box',
              flexShrink: 0
            }}
            title={isCollapsed ? '펼치기' : '접기'}
          >
            {isCollapsed ? <PiCaretUp /> : <PiCaretDown />}
          </button>
        </div>
      </div>
      {!isCollapsed && (
        <div
          ref={outputRef}
          style={{
            flex: 1,
            padding: '10px',
            overflowY: 'auto',
            backgroundColor: 'var(--color-bg-main)',
            fontFamily: "'Consolas', 'Courier New', monospace",
            fontSize: '13px',
            color: 'var(--color-text-primary)',
            whiteSpace: 'pre-wrap',
            wordWrap: 'break-word'
          }}
          dangerouslySetInnerHTML={{ __html: output || '출력이 여기에 표시됩니다...' }}
        />
      )}
    </div>
  );
}

