'use client';

import { useRef } from 'react';
import { useDrag } from 'react-dnd';

const ItemTypes = {
  TAB: 'tab',
};

/**
 * 드래그 가능한 탭 컴포넌트
 */
export default function DraggableTab({ 
  filename, 
  groupId, 
  isActive, 
  onClose, 
  onClick, 
  onDoubleClick 
}) {
  const [{ isDragging }, drag] = useDrag({
    type: ItemTypes.TAB,
    item: { filename, groupId, type: 'tab' },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
    canDrag: () => {
      return clickTimeoutRef.current === null;
    },
  });

  const clickTimeoutRef = useRef(null);

  const handleClick = (e) => {
    if (clickTimeoutRef.current) {
      clearTimeout(clickTimeoutRef.current);
      clickTimeoutRef.current = null;
      if (onDoubleClick) {
        e.preventDefault();
        e.stopPropagation();
        onDoubleClick();
      }
    } else {
      clickTimeoutRef.current = setTimeout(() => {
        onClick();
        clickTimeoutRef.current = null;
      }, 300);
    }
  };

  return (
    <div
      ref={drag}
      style={{
        height: '35px',
        padding: '0 15px',
        display: 'flex',
        alignItems: 'center',
        backgroundColor: isActive ? 'var(--color-tab-active-bg)' : 'var(--color-bg-tab)',
        borderRight: '1px solid var(--color-border-default)',
        cursor: 'pointer',
        fontSize: '13px',
        color: isActive ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
        whiteSpace: 'nowrap',
        position: 'relative',
        opacity: isDragging ? 0.5 : 1,
      }}
      onClick={handleClick}
      onMouseEnter={(e) => {
        if (!isActive) {
          e.currentTarget.style.backgroundColor = 'var(--color-tab-hover-bg)';
        }
      }}
      onMouseLeave={(e) => {
        if (!isActive) {
          e.currentTarget.style.backgroundColor = 'var(--color-bg-tab)';
        }
      }}
    >
      <span>{filename}</span>
      <span
        style={{
          marginLeft: '8px',
          width: '16px',
          height: '16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: '5px',
          pointerEvents: 'auto',
          cursor: 'pointer'
        }}
        onClick={(e) => {
          e.stopPropagation();
          e.preventDefault();
          onClose(e);
        }}
        onMouseDown={(e) => {
          e.stopPropagation();
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = 'var(--color-tab-close-hover-bg)';
          e.currentTarget.style.color = 'var(--color-tab-close-hover-text)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'transparent';
          e.currentTarget.style.color = 'inherit';
        }}
      >
        ×
      </span>
    </div>
  );
}

