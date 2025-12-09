"use client";

import { useRef, useCallback, useEffect } from "react";

/**
 * 에디터 그룹 간 너비 조절 리사이저 컴포넌트
 */
export default function GroupResizer({ leftGroupId, rightGroupId, onResize }) {
  const resizerRef = useRef(null);
  const isResizingRef = useRef(false);
  const rafRef = useRef(null);
  const onResizeRef = useRef(onResize);

  // onResize가 변경될 때마다 ref 업데이트
  useEffect(() => {
    onResizeRef.current = onResize;
  }, [onResize]);

  const handleMouseMove = useCallback(
    (e) => {
      if (!isResizingRef.current) return;

      // requestAnimationFrame으로 업데이트 최적화 (60fps로 제한)
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }

      rafRef.current = requestAnimationFrame(() => {
        if (!isResizingRef.current) return;

        const container = document.getElementById("editor-container");
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

        onResizeRef.current(
          leftGroupId,
          rightGroupId,
          leftPercent,
          rightPercent
        );
      });
    },
    [leftGroupId, rightGroupId]
  );

  const handleMouseUp = useCallback(() => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }

    if (isResizingRef.current) {
      isResizingRef.current = false;
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);

      // 리사이징 종료 시 iframe 이벤트 다시 활성화
      document.querySelectorAll("iframe").forEach((iframe) => {
        iframe.style.pointerEvents = "auto";
      });
    }
  }, [handleMouseMove]);

  const handleMouseDown = useCallback(
    (e) => {
      e.preventDefault();
      e.stopPropagation();
      isResizingRef.current = true;
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";

      // 리사이징 중 iframe이 마우스 이벤트를 가로채는 것을 방지
      document.querySelectorAll("iframe").forEach((iframe) => {
        iframe.style.pointerEvents = "none";
      });

      // mousedown 시에만 이벤트 리스너 등록
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    },
    [handleMouseMove, handleMouseUp]
  );

  return (
    <div
      ref={resizerRef}
      onMouseDown={handleMouseDown}
      style={{
        width: "4px",
        backgroundColor: "var(--border-color)",
        cursor: "col-resize",
        flexShrink: 0,
        position: "relative",
        zIndex: 10,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = "var(--accent-color)";
      }}
      onMouseLeave={(e) => {
        if (!isResizingRef.current) {
          e.currentTarget.style.backgroundColor = "var(--border-color)";
        }
      }}
    />
  );
}
