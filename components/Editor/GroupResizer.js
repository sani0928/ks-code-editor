'use client';

import { useRef, useEffect } from 'react';

/**
 * 에디터 그룹 간 너비 조절 리사이저 컴포넌트
 */
export default function GroupResizer({ 
  leftGroupId, 
  rightGroupId, 
  onResize 
}) {
  const resizerRef = useRef(null);
  const isResizingRef = useRef(false);

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isResizingRef.current) return;

      const container = document.getElementById('editor-container');
      if (!container) return;

      const containerRect = container.getBoundingClientRect();
      const containerWidth = containerRect.width;
      const mouseX = e.clientX - containerRect.left;

      // 최소 너비 200px, 최대 너비는 containerWidth - 200px
      const minWidth = 200;
      const maxWidth = containerWidth - minWidth;

      // 마우스 위치를 퍼센트로 변환
      const leftPercent = Math.max(
        (minWidth / containerWidth) * 100,
        Math.min(
          (maxWidth / containerWidth) * 100,
          (mouseX / containerWidth) * 100
        )
      );
      const rightPercent = 100 - leftPercent;

      onResize(leftGroupId, rightGroupId, leftPercent, rightPercent);
    };

    const handleMouseUp = () => {
      if (isResizingRef.current) {
        isResizingRef.current = false;
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
      }
    };

    // 항상 이벤트 리스너 등록 (isResizingRef로 제어)
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [leftGroupId, rightGroupId, onResize]);

  const handleMouseDown = (e) => {
    e.preventDefault();
    e.stopPropagation();
    isResizingRef.current = true;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  };

  return (
    <div
      ref={resizerRef}
      onMouseDown={handleMouseDown}
      style={{
        width: '4px',
        backgroundColor: 'var(--border-color)',
        cursor: 'col-resize',
        flexShrink: 0,
        position: 'relative',
        zIndex: 10,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = 'var(--accent-color)';
      }}
      onMouseLeave={(e) => {
        if (!isResizingRef.current) {
          e.currentTarget.style.backgroundColor = 'var(--border-color)';
        }
      }}
    />
  );
}

