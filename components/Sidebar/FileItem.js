'use client';

import { useDrag } from 'react-dnd';
import Image from 'next/image';
import { GoCodeReview } from 'react-icons/go';

const ItemTypes = {
  FILE: 'file',
};

/**
 * 파일 아이템 컴포넌트
 */
export default function FileItem({ 
  filename, 
  isActive, 
  onClick, 
  isSpecial = false 
}) {
  const [{ isDragging }, drag] = useDrag({
    type: ItemTypes.FILE,
    item: { filename, type: 'file' },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });
  const isPython = filename === '파이쑝.py';
  const isC = filename === '씨.c';
  const isCpp = filename === '씨쁠쁠.cpp';
  const isJava = filename === '자바칩.java';
  const isJavaScript = filename === '자바스크립뚜.js';
  const isReadme = filename === 'README.md';
  const isProblemHtml = filename.endsWith('.html') && filename !== 'style.css';
  const isInputTxt = filename === 'input.txt';
  const isStyleCss = filename === 'style.css';
  const isChatbot = filename === '옜다정답.ai';

  const getFileIcon = () => {
    if (isPython) {
      return <Image src="/icons/python.png" alt="Python" width={16} height={16} style={{ display: 'inline-block' }} />;
    }
    if (isC) {
      return <Image src="/icons/c.png" alt="C" width={16} height={16} style={{ display: 'inline-block' }} />;
    }
    if (isCpp) {
      return <Image src="/icons/cpp.png" alt="C++" width={16} height={16} style={{ display: 'inline-block' }} />;
    }
    if (isJava) {
      return <Image src="/icons/java.png" alt="Java" width={16} height={16} style={{ display: 'inline-block' }} />;
    }
    if (isJavaScript) {
      return <Image src="/icons/javascrpt.png" alt="JavaScript" width={16} height={16} style={{ display: 'inline-block' }} />;
    }
    if (isStyleCss) {
      return <Image src="/icons/css.png" alt="CSS" width={16} height={16} style={{ display: 'inline-block' }} />;
    }
    if (isChatbot) {
      return <GoCodeReview size={16} style={{ display: 'inline-block', color: 'white' }} />;
    }
    if (isProblemHtml) return '🌐';
    if (isReadme) return '📝';
    return '📄';
  };

  return (
    <div
      ref={drag}
      style={{
        padding: '4px 10px',
        cursor: 'pointer',
        fontSize: '13px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        color: isSpecial ? 'var(--color-accent-file)' : 'var(--color-text-primary)',
        backgroundColor: isActive ? 'var(--color-bg-header)' : 'transparent',
        opacity: isDragging ? 0.5 : 1,
      }}
      onClick={onClick}
      onMouseEnter={(e) => {
        if (!isActive) {
          e.currentTarget.style.backgroundColor = 'var(--color-file-item-hover-bg)';
        }
      }}
      onMouseLeave={(e) => {
        if (!isActive) {
          e.currentTarget.style.backgroundColor = 'transparent';
        }
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
        <span style={{ 
          marginRight: '6px', 
          width: '16px', 
          height: '16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0
        }}>
          {getFileIcon()}
        </span>
        <span>{filename}</span>
      </div>
    </div>
  );
}

