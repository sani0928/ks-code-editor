'use client';

import { useState, useEffect } from 'react';
import { darkenColor } from '../../lib/colorUtils';

/**
 * 상단 타이틀 바 컴포넌트
 */
export default function TitleBar({
  problemNumber,
  onProblemNumberChange,
  onLoadProblem,
  onSubmitToBOJ,
  isLoadingProblem,
  isSubmitting,
  currentProblemNumber,
  userId,
  onUserIdChange,
  onLoadProfile,
  isLoadingProfile,
  currentUserId
}) {
  const isSameProblem = problemNumber.trim() === currentProblemNumber;
  const [isFullscreen, setIsFullscreen] = useState(false);

  // 전체화면 상태 감지
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    // Safari 지원
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('MSFullscreenChange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
    };
  }, []);

  // 전체화면 토글 함수
  const handleToggleFullscreen = () => {
    if (!document.fullscreenElement) {
      // 전체화면 진입
      const element = document.documentElement;
      if (element.requestFullscreen) {
        element.requestFullscreen().catch(err => {
          console.error('전체화면 진입 실패:', err);
        });
      } else if (element.webkitRequestFullscreen) {
        // Safari
        element.webkitRequestFullscreen();
      } else if (element.mozRequestFullScreen) {
        // Firefox
        element.mozRequestFullScreen();
      } else if (element.msRequestFullscreen) {
        // IE/Edge
        element.msRequestFullscreen();
      }
    } else {
      // 전체화면 종료
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if (document.webkitExitFullscreen) {
        // Safari
        document.webkitExitFullscreen();
      } else if (document.mozCancelFullScreen) {
        // Firefox
        document.mozCancelFullScreen();
      } else if (document.msExitFullscreen) {
        // IE/Edge
        document.msExitFullscreen();
      }
    }
  };

  return (
    <div style={{
      height: '30px',
      backgroundColor: 'var(--color-bg-header)',
      display: 'flex',
      alignItems: 'center',
      padding: '0 10px',
      userSelect: 'none',
      gap: '10px',
      overflow: 'hidden',
      minWidth: 0,
      flexShrink: 0,
      position: 'relative'
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        flexShrink: 0
      }}>
        <input
          type="text"
          placeholder="유저 아이디"
          value={userId}
          onChange={(e) => onUserIdChange(e.target.value)}
          onKeyPress={(e) => {
            if (e.key === 'Enter') {
              onLoadProfile();
            }
          }}
          style={{
            width: '120px',
            height: '20px',
            padding: '2px 8px',
            backgroundColor: 'var(--color-bg-input)',
            border: '1px solid var(--color-border-input)',
            borderRadius: '5px',
            color: 'var(--color-text-input)',
            fontSize: '12px'
          }}
        />
        <button
          onClick={onLoadProfile}
          disabled={isLoadingProfile || !userId.trim()}
          style={{
            height: '24px',
            padding: '0 12px',
            backgroundColor: 'var(--color-button-secondary-bg)',
            color: 'var(--color-text-button)',
            border: 'none',
            borderRadius: '5px',
            cursor: isLoadingProfile || !userId.trim() ? 'default' : 'pointer',
            fontSize: '11px',
            fontWeight: 500,
            opacity: isLoadingProfile || !userId.trim() ? 0.5 : 1,
            transition: 'background-color 0.2s'
          }}
          onMouseEnter={(e) => {
            if (!isLoadingProfile && userId.trim()) {
              e.currentTarget.style.backgroundColor = darkenColor('--color-button-secondary-bg');
            }
          }}
          onMouseLeave={(e) => {
            if (!isLoadingProfile && userId.trim()) {
              e.currentTarget.style.backgroundColor = 'var(--color-button-secondary-bg)';
            }
          }}
        >
          {isLoadingProfile ? '가져오는 중...' : '프로필 갱신'}
        </button>
      </div>
      <div
        onClick={handleToggleFullscreen}
        style={{
          position: 'absolute',
          left: '50%',
          transform: 'translateX(-50%)',
          fontSize: '12px',
          color: 'var(--color-text-primary)',
          whiteSpace: 'nowrap',
          transition: 'color 0.7s'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.color = 'var(--color-accent-primary)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.color = 'var(--color-text-primary)';
        }}
        title={isFullscreen ? '전체화면 종료' : '전체화면'}
      >
        KS Code Editor v1.1
      </div>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        flexShrink: 0,
        marginLeft: 'auto'
      }}>
        <input
          type="text"
          placeholder="백준 문제 번호"
          value={problemNumber}
          onChange={(e) => onProblemNumberChange(e.target.value)}
          onKeyPress={(e) => {
            if (e.key === 'Enter') {
              onLoadProblem();
            }
          }}
          style={{
            width: '120px',
            height: '20px',
            padding: '2px 8px',
            backgroundColor: 'var(--color-bg-input)',
            border: '1px solid var(--color-border-input)',
            borderRadius: '5px',
            color: 'var(--color-text-input)',
            fontSize: '12px'
          }}
        />
        <button
          onClick={onLoadProblem}
          disabled={isLoadingProblem || !problemNumber.trim() || isSameProblem}
          style={{
            height: '24px',
            padding: '0 12px',
            backgroundColor: isSameProblem ? 'var(--color-bg-sidebar)' : 'var(--color-button-secondary-bg)',
            color: 'var(--color-text-button)',
            border: 'none',
            borderRadius: '5px',
            cursor: (isLoadingProblem || isSameProblem) ? 'default' : 'pointer',
            fontSize: '11px',
            fontWeight: 500,
            opacity: (isLoadingProblem || isSameProblem) ? 0.5 : 1,
            transition: 'background-color 0.2s'
          }}
          onMouseEnter={(e) => {
            if (!isLoadingProblem && !isSameProblem && problemNumber.trim()) {
              e.currentTarget.style.backgroundColor = darkenColor('--color-button-secondary-bg');
            }
          }}
          onMouseLeave={(e) => {
            if (!isLoadingProblem && !isSameProblem && problemNumber.trim()) {
              e.currentTarget.style.backgroundColor = 'var(--color-button-secondary-bg)';
            }
          }}
        >
          {isLoadingProblem ? '가져오는 중...' : '문제 가져오기'}
        </button>
        <button
          onClick={onSubmitToBOJ}
          disabled={isSubmitting || !currentProblemNumber.trim()}
          style={{
            height: '24px',
            padding: '0 12px',
            backgroundColor: 'var(--color-button-primary-bg)',
            color: 'var(--color-text-button)',
            border: 'none',
            borderRadius: '5px',
            cursor: isSubmitting || !currentProblemNumber.trim() ? 'default' : 'pointer',
            fontSize: '11px',
            fontWeight: 500,
            opacity: isSubmitting || !currentProblemNumber.trim() ? 0.5 : 1,
            transition: 'background-color 0.2s'
          }}
          onMouseEnter={(e) => {
            if (!isSubmitting && currentProblemNumber.trim()) {
              e.currentTarget.style.backgroundColor = darkenColor('--color-button-primary-bg');
            }
          }}
          onMouseLeave={(e) => {
            if (!isSubmitting && currentProblemNumber.trim()) {
              e.currentTarget.style.backgroundColor = 'var(--color-button-primary-bg)';
            }
          }}
        >
          {isSubmitting ? '제출 중...' : '백준 제출'}
        </button>
      </div>
    </div>
  );
}

