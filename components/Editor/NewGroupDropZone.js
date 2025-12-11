'use client';

import { useDrop, useDragLayer } from 'react-dnd';

const ItemTypes = {
  TAB: 'tab',
  FILE: 'file',
};

/**
 * 새 그룹 생성 드롭 영역 컴포넌트
 */
export default function NewGroupDropZone({ onDrop, isVisible }) {
  const [{ isOver }, drop] = useDrop({
    accept: [ItemTypes.TAB, ItemTypes.FILE],
    drop: (item) => {
      onDrop(item);
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  });

  const isDragging = useDragLayer((monitor) => monitor.isDragging());

  if (!isVisible || !isDragging) return null;

  const getAccentColorWithOpacity = (opacity) => {
    try {
      const root = document.documentElement;
      const accentColor = getComputedStyle(root).getPropertyValue('--color-accent-primary').trim();
      if (accentColor.startsWith('#')) {
        const r = parseInt(accentColor.slice(1, 3), 16);
        const g = parseInt(accentColor.slice(3, 5), 16);
        const b = parseInt(accentColor.slice(5, 7), 16);
        return `rgba(${r}, ${g}, ${b}, ${opacity})`;
      }
      return accentColor;
    } catch (e) {
      return `rgba(0, 122, 204, ${opacity})`;
    }
  };

  return (
    <div
      ref={drop}
      style={{
        position: 'absolute',
        left: '50%',
        top: '35px',
        right: 0,
        bottom: 0,
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '14px',
        color: 'var(--color-accent-primary)',
        fontWeight: 'bold',
        pointerEvents: 'auto',
        backgroundColor: isOver ? getAccentColorWithOpacity(0.2) : getAccentColorWithOpacity(0.1),
      }}
    >
    </div>
  );
}

