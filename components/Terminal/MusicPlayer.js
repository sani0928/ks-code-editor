'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { PiSkipBack, PiSkipForward, PiPlay, PiStop } from 'react-icons/pi';
import { saveMusicState, loadMusicState } from '../../lib/storage';

/**
 * 음악 플레이어 컴포넌트
 * 서버 비용 절감을 위한 지연 로딩 및 최적화 포함
 */
export default function MusicPlayer({ isCompact = false }) {
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const musicRef = useRef(null);
  const tracksRef = useRef(Array.from({ length: 17 }, (_, i) => `Track_${i + 1}.mp3`));
  const isInitialLoadRef = useRef(true);
  const lastLoadedTrackRef = useRef(-1);

  // 17개 트랙 파일 목록
  const tracks = tracksRef.current;

  // 다음 곡 함수 (ref로 최신 상태 참조)
  const handleNextRef = useRef(() => {});
  const currentTrackIndexRef = useRef(0);
  const loadTrackRef = useRef(null);
  
  // currentTrackIndexRef 업데이트
  useEffect(() => {
    currentTrackIndexRef.current = currentTrackIndex;
  }, [currentTrackIndex]);

  // 음악 인스턴스 초기화 (지연 로딩: 재생 버튼 클릭 시에만 생성)
  const initializeMusic = useCallback(() => {
    if (!musicRef.current) {
      const music = new Audio();
      music.preload = 'none'; // 자동 다운로드 방지
      music.volume = 1; // 음량은 항상 1로 고정
      
      // 트랙 종료 시 자동으로 다음 곡 재생
      music.addEventListener('ended', () => {
        handleNextRef.current();
      });

      musicRef.current = music;
    }
    return musicRef.current;
  }, []);

  // 현재 트랙 로드
  const loadTrack = useCallback(async (trackIndex, shouldPlay = false) => {
    // 이미 같은 트랙이 로드되어 있으면 스킵
    if (lastLoadedTrackRef.current === trackIndex && musicRef.current?.src) {
      if (shouldPlay && musicRef.current.paused) {
        try {
          await musicRef.current.play();
          setIsPlaying(true);
        } catch (error) {
          if (error.name !== 'AbortError') {
            console.error('재생 실패:', error);
          }
          setIsPlaying(false);
        }
      }
      return;
    }
    
    const music = initializeMusic();
    const trackPath = `/musics/${tracks[trackIndex]}`;
    
    // 이전 소스 정리
    if (!music.paused) {
      music.pause();
    }
    
    // 음악이 완전히 정지될 때까지 대기
    await new Promise(resolve => {
      if (music.paused) {
        resolve();
      } else {
        music.addEventListener('pause', resolve, { once: true });
        setTimeout(resolve, 50); // 타임아웃으로 안전장치
      }
    });
    
    music.src = '';
    music.load();
    
    // 새 트랙 로드
    music.src = trackPath;
    music.currentTime = 0; // 항상 처음부터 시작
    lastLoadedTrackRef.current = trackIndex;
    
    // 재생해야 하는 경우
    if (shouldPlay) {
      try {
        // 음악이 로드될 때까지 대기
        await new Promise((resolve, reject) => {
          const handleCanPlay = () => {
            music.removeEventListener('canplay', handleCanPlay);
            music.removeEventListener('error', handleError);
            resolve();
          };
          const handleError = () => {
            music.removeEventListener('canplay', handleCanPlay);
            music.removeEventListener('error', handleError);
            reject(new Error('음악 로드 실패'));
          };
          
          if (music.readyState >= 2) { // HAVE_CURRENT_DATA 이상
            resolve();
          } else {
            music.addEventListener('canplay', handleCanPlay, { once: true });
            music.addEventListener('error', handleError, { once: true });
            // 타임아웃으로 안전장치
            setTimeout(() => {
              music.removeEventListener('canplay', handleCanPlay);
              music.removeEventListener('error', handleError);
              resolve(); // 타임아웃 시에도 진행
            }, 1000);
          }
        });
        
        await music.play();
        setIsPlaying(true);
      } catch (error) {
        // AbortError는 무시 (pause로 인한 중단은 정상)
        if (error.name !== 'AbortError') {
          console.error('재생 실패:', error);
        }
        setIsPlaying(false);
      }
    }
  }, [initializeMusic, tracks]);

  // loadTrackRef 업데이트 (loadTrack 정의 이후)
  useEffect(() => {
    loadTrackRef.current = loadTrack;
  }, [loadTrack]);

  // 다음 곡 (트랙 종료 시 자동 호출)
  const handleNext = useCallback(async () => {
    const currentIndex = currentTrackIndexRef.current;
    const newIndex = currentIndex === tracks.length - 1 ? 0 : currentIndex + 1;
    setCurrentTrackIndex(newIndex);
    // 트랙이 끝나면 자동으로 다음 곡 재생
    setIsPlaying(true); // 즉시 UI 업데이트
    if (loadTrackRef.current) {
      try {
        await loadTrackRef.current(newIndex, true);
      } catch (error) {
        setIsPlaying(false); // 재생 실패 시 되돌림
      }
    }
  }, [tracks.length]);

  // handleNextRef 업데이트
  useEffect(() => {
    handleNextRef.current = handleNext;
  }, [handleNext]);

  // 재생/정지 토글
  const handlePlayPause = useCallback(async () => {
    const music = initializeMusic();
    
    if (isPlaying) {
      // 정지 시 처음부터 재생하도록 리셋
      music.pause();
      music.currentTime = 0;
      setIsPlaying(false);
    } else {
      // 첫 재생 시 트랙 로드
      const hasSource = music.src && music.src !== window.location.href && !music.src.endsWith('/');
      if (!hasSource) {
        await loadTrack(currentTrackIndex, true);
      } else {
        // 이미 로드된 트랙이 있으면 처음부터 재생
        music.currentTime = 0;
        try {
          await music.play();
          setIsPlaying(true);
        } catch (error) {
          console.error('재생 실패:', error);
          setIsPlaying(false);
        }
      }
    }
  }, [isPlaying, initializeMusic, loadTrack, currentTrackIndex]);

  // 이전 곡
  const handlePrevious = useCallback(async () => {
    const newIndex = currentTrackIndex === 0 ? tracks.length - 1 : currentTrackIndex - 1;
    setCurrentTrackIndex(newIndex);
    // 정지 상태에서도 클릭하면 재생
    setIsPlaying(true); // 즉시 UI 업데이트
    try {
      await loadTrack(newIndex, true);
    } catch (error) {
      setIsPlaying(false); // 재생 실패 시 되돌림
    }
  }, [tracks.length, currentTrackIndex, loadTrack]);

  // 다음 곡 버튼 클릭 핸들러
  const handleNextClick = useCallback(async () => {
    const newIndex = currentTrackIndex === tracks.length - 1 ? 0 : currentTrackIndex + 1;
    setCurrentTrackIndex(newIndex);
    // 정지 상태에서도 클릭하면 재생
    setIsPlaying(true); // 즉시 UI 업데이트
    try {
      await loadTrack(newIndex, true);
    } catch (error) {
      setIsPlaying(false); // 재생 실패 시 되돌림
    }
  }, [tracks.length, currentTrackIndex, loadTrack]);

  // 초기 로드: localStorage에서 트랙 인덱스 복원
  useEffect(() => {
    if (typeof window !== 'undefined' && isInitialLoadRef.current) {
      const savedState = loadMusicState();
      if (savedState) {
        setCurrentTrackIndex(savedState.trackIndex);
      }
      // 재접속 시 항상 정지 상태로 시작
      setIsPlaying(false);
      isInitialLoadRef.current = false;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // 초기 로드만 실행되도록 빈 배열 유지

  // 트랙 변경 시 localStorage에 저장 (초기 로드 제외)
  useEffect(() => {
    if (!isInitialLoadRef.current && typeof window !== 'undefined') {
      saveMusicState(currentTrackIndex);
    }
  }, [currentTrackIndex]);

  // 트랙 변경 시 음악 소스 업데이트
  useEffect(() => {
    if (musicRef.current && isPlaying && !isInitialLoadRef.current) {
      // 현재 트랙과 마지막으로 로드한 트랙이 다를 때만 로드
      if (lastLoadedTrackRef.current !== currentTrackIndex) {
        loadTrack(currentTrackIndex, true);
      }
    }
  }, [currentTrackIndex, isPlaying, loadTrack]);

  // 컴포넌트 언마운트 시 정리
  useEffect(() => {
    return () => {
      if (musicRef.current) {
        musicRef.current.pause();
        musicRef.current.src = '';
        musicRef.current = null;
      }
    };
  }, []);

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: isCompact ? '4px' : '8px',
      fontSize: isCompact ? '11px' : '12px',
      flexShrink: 0
    }}>
      {/* 현재 트랙 번호 표시 */}
      {!isCompact && (
        <div style={{
          fontSize: '11px',
          color: 'var(--color-text-primary)',
          fontFamily: "'Consolas', 'Courier New', monospace",
          fontWeight: 500,
          minWidth: '50px',
          flexShrink: 0
        }}>
          Track {currentTrackIndex + 1}
        </div>
      )}

      {/* 이전 곡 버튼 */}
      <button
        onClick={handlePrevious}
        style={{
          padding: isCompact ? '3px 4px' : '4px 6px',
          backgroundColor: 'transparent',
          color: 'var(--color-text-primary)',
          border: 'none',
          outline: 'none',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: isCompact ? '12px' : '14px',
          lineHeight: '1',
          minWidth: isCompact ? '22px' : '26px',
          minHeight: isCompact ? '20px' : '22px',
          boxSizing: 'border-box',
          flexShrink: 0
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.color = 'var(--color-accent-primary)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.color = 'var(--color-text-primary)';
        }}
      >
        <PiSkipBack />
      </button>

      {/* 재생/정지 버튼 */}
      <button
        onClick={handlePlayPause}
        style={{
          padding: isCompact ? '3px 4px' : '4px 6px',
          backgroundColor: 'transparent',
          color: 'var(--color-text-primary)',
          border: 'none',
          outline: 'none',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: isCompact ? '12px' : '14px',
          lineHeight: '1',
          minWidth: isCompact ? '22px' : '26px',
          minHeight: isCompact ? '20px' : '22px',
          boxSizing: 'border-box',
          flexShrink: 0
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.color = 'var(--color-accent-primary)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.color = 'var(--color-text-primary)';
        }}
        title={isPlaying ? '정지' : '재생'}
      >
        {isPlaying ? <PiStop /> : <PiPlay />}
      </button>

      {/* 다음 곡 버튼 */}
      <button
        onClick={handleNextClick}
        style={{
          padding: isCompact ? '3px 4px' : '4px 6px',
          backgroundColor: 'transparent',
          color: 'var(--color-text-primary)',
          border: 'none',
          outline: 'none',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: isCompact ? '12px' : '14px',
          lineHeight: '1',
          minWidth: isCompact ? '22px' : '26px',
          minHeight: isCompact ? '20px' : '22px',
          boxSizing: 'border-box',
          flexShrink: 0
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.color = 'var(--color-accent-primary)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.color = 'var(--color-text-primary)';
        }}
      >
        <PiSkipForward />
      </button>
    </div>
  );
}
