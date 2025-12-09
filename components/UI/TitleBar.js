'use client';

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

  return (
    <div style={{
      height: '30px',
      backgroundColor: 'var(--bg-tertiary)',
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
            backgroundColor: 'var(--bg-primary)',
            border: '1px solid var(--border-color)',
            borderRadius: '3px',
            color: 'var(--text-primary)',
            fontSize: '12px'
          }}
        />
        <button
          onClick={onLoadProfile}
          disabled={isLoadingProfile || !userId.trim()}
          style={{
            height: '24px',
            padding: '0 12px',
            backgroundColor: 'var(--button-load-bg)',
            color: 'var(--button-text)',
            border: 'none',
            borderRadius: '3px',
            cursor: isLoadingProfile || !userId.trim() ? 'not-allowed' : 'pointer',
            fontSize: '11px',
            fontWeight: 500,
            opacity: isLoadingProfile || !userId.trim() ? 0.5 : 1
          }}
        >
          {isLoadingProfile ? '가져오는 중...' : '프로필 가져오기'}
        </button>
      </div>
      <div style={{
        position: 'absolute',
        left: '50%',
        transform: 'translateX(-50%)',
        fontSize: '12px',
        color: 'var(--text-primary)',
        whiteSpace: 'nowrap',
        pointerEvents: 'none'
      }}>
        KS Code Editor v1.0
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
            backgroundColor: 'var(--bg-primary)',
            border: '1px solid var(--border-color)',
            borderRadius: '3px',
            color: 'var(--text-primary)',
            fontSize: '12px'
          }}
        />
        <button
          onClick={onLoadProblem}
          disabled={isLoadingProblem || !problemNumber.trim() || isSameProblem}
          style={{
            height: '24px',
            padding: '0 12px',
            backgroundColor: isSameProblem ? 'var(--bg-secondary)' : 'var(--button-load-bg)',
            color: 'var(--button-text)',
            border: 'none',
            borderRadius: '3px',
            cursor: isSameProblem ? 'not-allowed' : 'pointer',
            fontSize: '11px',
            fontWeight: 500,
            opacity: isSameProblem ? 0.5 : 1
          }}
        >
          {isLoadingProblem ? '가져오는 중...' : '문제 가져오기'}
        </button>
        <button
          onClick={onSubmitToBOJ}
          disabled={isSubmitting || !problemNumber.trim()}
          style={{
            height: '24px',
            padding: '0 12px',
            backgroundColor: 'var(--accent-color)',
            color: 'var(--button-text)',
            border: 'none',
            borderRadius: '3px',
            cursor: 'pointer',
            fontSize: '11px',
            fontWeight: 500
          }}
        >
          {isSubmitting ? '제출 중...' : '백준 제출'}
        </button>
      </div>
    </div>
  );
}

