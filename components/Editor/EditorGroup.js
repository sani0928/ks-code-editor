'use client';

import { useState, useRef, useEffect } from 'react';
import { useDrop } from 'react-dnd';
import MonacoEditor from './MonacoEditor';
import EditorTabs from './EditorTabs';
import ProblemViewer from '../Problem/ProblemViewer';
import { getLanguageFromFile } from '../../lib/fileManager';

const ItemTypes = {
  TAB: 'tab',
  FILE: 'file',
};

/**
 * 에디터 그룹 컴포넌트
 */
export default function EditorGroup({
  group,
  files,
  onEditorChange,
  onEditorMount,
  onTabClick,
  onTabClose,
  onTabDoubleClick,
  onTabDrop,
  onTabReorder,
  onFileDrop,
  onEditorClick,
  isActive,
  problemHtmlViewMode,
  isNewGroupDropZoneVisible = false,
}) {
  const [hoverIndex, setHoverIndex] = useState(null);
  const tabBarRef = useRef(null);

  const [{ isOver }, drop] = useDrop({
    accept: [ItemTypes.TAB, ItemTypes.FILE],
    drop: (item, monitor) => {
      if (item.type === 'file') {
        // 파일을 드롭한 경우 - hoverIndex 전달
        const insertIndex = hoverIndex !== null ? hoverIndex : group.tabs.length;
        onFileDrop(item.filename, group.id, insertIndex);
      } else if (item.groupId !== group.id) {
        // 다른 그룹에서 탭을 드롭한 경우 - hoverIndex 전달
        const insertIndex = hoverIndex !== null ? hoverIndex : group.tabs.length;
        onTabDrop(item, group.id, insertIndex);
      } else if (item.groupId === group.id && hoverIndex !== null) {
        // 같은 그룹 내에서 탭 순서 변경
        onTabReorder(item.filename, group.id, hoverIndex);
      }
      setHoverIndex(null);
    },
    hover: (item, monitor) => {
      // 실제로 이 drop target 위에 있는지 확인
      const isOverThisTarget = monitor.isOver({ shallow: true });
      if (!isOverThisTarget) {
        setHoverIndex(null);
        return;
      }

      if (!tabBarRef.current) return;

      const clientOffset = monitor.getClientOffset();
      if (!clientOffset) return;

      const tabBarRect = tabBarRef.current.getBoundingClientRect();
      
      // 마우스가 실제로 이 탭 바 영역 내에 있는지 확인
      const x = clientOffset.x - tabBarRect.left;
      const y = clientOffset.y - tabBarRect.top;
      
      if (x < 0 || x > tabBarRect.width || y < 0 || y > tabBarRect.height) {
        // 탭 바 영역 밖이면 인디케이터 표시하지 않음
        // 단, 새 그룹 드롭 존이 활성화되어 있고 탭 바 영역 밖이면 인디케이터 숨김
        if (isNewGroupDropZoneVisible) {
          setHoverIndex(null);
        }
        return;
      }
      
      // 탭 바 영역 내에 있으면 새 그룹 드롭 존이 활성화되어 있어도 인디케이터 표시

      // 각 탭의 위치를 계산하여 hover 인덱스 결정
      const tabs = Array.from(tabBarRef.current.children);
      let insertIndex = tabs.length;

      for (let i = 0; i < tabs.length; i++) {
        const tabRect = tabs[i].getBoundingClientRect();
        const tabLeft = tabRect.left - tabBarRect.left;
        const tabCenter = tabLeft + tabRect.width / 2;

        if (x < tabCenter) {
          insertIndex = i;
          break;
        }
      }

      // 파일을 드래그하는 경우 (EXPLORER에서)
      if (item.type === 'file') {
        // 파일은 항상 인덱스 표시
        setHoverIndex(insertIndex);
        return;
      }

      // 탭을 드래그하는 경우
      if (item.type === 'tab') {
        // 같은 그룹 내에서 드래그하는 경우
        if (item.groupId === group.id) {
          const currentIndex = group.tabs.indexOf(item.filename);
          // 같은 위치에 드롭하려는 경우는 무시
          if (insertIndex === currentIndex || insertIndex === currentIndex + 1) {
            setHoverIndex(null);
          } else {
            setHoverIndex(insertIndex);
          }
        } else {
          // 다른 그룹에서 드래그하는 경우 - 항상 인덱스 표시
          setHoverIndex(insertIndex);
        }
      }
    },
    collect: (monitor) => ({
      isOver: monitor.isOver({ shallow: true }),
    }),
  });

  // isOver가 false가 되면 hoverIndex 초기화 (다른 그룹으로 이동했을 때)
  useEffect(() => {
    if (!isOver && hoverIndex !== null) {
      setHoverIndex(null);
    }
  }, [isOver, hoverIndex]);

  const activeFile = group.activeTab;
  const language = activeFile ? getLanguageFromFile(activeFile) : 'plaintext';
  const isProblemHtml = activeFile && 
    activeFile.endsWith('.html') && 
    files[activeFile] && 
    (files[activeFile].includes('<!DOCTYPE html>') || files[activeFile].includes('<html'));

  return (
    <div
      ref={drop}
      style={{
        flex: group.width === '100%' ? '1 1 100%' : '1 1 50%',
        minWidth: '200px',
        maxWidth: group.width === '100%' ? '100%' : '50%',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        backgroundColor: (isOver || isActive) ? 'var(--bg-tertiary)' : 'var(--bg-primary)',
        cursor: 'default',
        overflow: 'hidden'
      }}
    >
      {/* 탭 바 */}
      <div 
        ref={(node) => {
          tabBarRef.current = node;
          drop(node);
        }}
        className="tab-bar-container"
        style={{
          height: '35px',
          backgroundColor: 'var(--bg-tertiary)',
          display: 'flex',
          alignItems: 'flex-end',
          overflowX: 'auto',
          overflowY: 'hidden',
          borderBottom: '1px solid var(--border-color)',
          position: 'relative'
        }}
      >
        {group.tabs.map((filename, index) => {
          const shouldEnableDoubleClick = (filename === 'style.css') || 
            (filename && filename.endsWith('.html') && files[filename] && 
             (files[filename].includes('<!DOCTYPE html>') || files[filename].includes('<html')));
          
          const showIndicator = hoverIndex === index;
          const isLastTab = index === group.tabs.length - 1;
          const showIndicatorAfter = isLastTab && hoverIndex === group.tabs.length;
          
          return (
            <div key={filename} style={{ position: 'relative' }}>
              {showIndicator && (
                <div
                  style={{
                    position: 'absolute',
                    left: 0,
                    top: 0,
                    bottom: 0,
                    width: 'var(--tab-drag-indicator-width, 2px)',
                    backgroundColor: 'var(--tab-drag-indicator-color, var(--accent-color))',
                    zIndex: 10,
                    pointerEvents: 'none'
                  }}
                />
              )}
              <EditorTabs
                filename={filename}
                groupId={group.id}
                isActive={group.activeTab === filename}
                onClose={(e) => onTabClose(filename, e, group.id)}
                onClick={() => onTabClick(filename, group.id)}
                onDoubleClick={shouldEnableDoubleClick ? () => onTabDoubleClick(filename) : undefined}
              />
              {showIndicatorAfter && (
                <div
                  style={{
                    position: 'absolute',
                    right: 0,
                    top: 0,
                    bottom: 0,
                    width: 'var(--tab-drag-indicator-width, 2px)',
                    backgroundColor: 'var(--tab-drag-indicator-color, var(--accent-color))',
                    zIndex: 10,
                    pointerEvents: 'none'
                  }}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* 에디터 영역 */}
      <div 
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          minHeight: 0,
          overflow: 'hidden'
        }}
        onClick={() => {
          if (onEditorClick && group.activeTab) {
            onEditorClick(group.activeTab, group.id);
          }
        }}
      >
        {activeFile ? (
          isProblemHtml ? (
            problemHtmlViewMode ? (
              <ProblemViewer html={files[activeFile] || ''} />
            ) : (
              <MonacoEditor
                key={`${group.id}-${activeFile}`}
                value={files[activeFile] || ''}
                language="html"
                onChange={(value) => onEditorChange(value, group.id)}
                onMount={(editor) => onEditorMount(editor, group.id)}
              />
            )
          ) : (
            <MonacoEditor
              key={`${group.id}-${activeFile}`}
              value={files[activeFile] || ''}
              language={language}
              onChange={(value) => onEditorChange(value, group.id)}
              onMount={(editor) => onEditorMount(editor, group.id)}
            />
          )
        ) : (
          <div style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--empty-editor-text)',
            fontSize: '14px'
          }}>
            파일을 열어주세요
          </div>
        )}
      </div>
    </div>
  );
}

