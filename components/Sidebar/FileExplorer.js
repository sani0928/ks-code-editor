'use client';

import FileItem from './FileItem';
import { getSortedFileList, specialFiles } from '../../lib/fileManager';

/**
 * 파일 탐색기 컴포넌트
 */
export default function FileExplorer({ 
  files, 
  currentFile, 
  onFileClick,
  currentThemeMode,
  onThemeToggle
}) {
  const sortedFiles = getSortedFileList(files);
  
  // 구분선 위치 찾기 (첫 번째 특수 파일의 인덱스)
  const separatorIndex = sortedFiles.findIndex(f => 
    specialFiles.includes(f) || (f.endsWith('.html') && f !== 'style.css')
  );
  
  const regularFiles = separatorIndex >= 0 ? sortedFiles.slice(0, separatorIndex) : sortedFiles;
  const special = separatorIndex >= 0 ? sortedFiles.slice(separatorIndex) : [];

  return (
    <div style={{
      flex: 1,
      overflowY: 'auto',
      padding: '5px 0'
    }}>
      {regularFiles.map((filename) => (
        <FileItem
          key={filename}
          filename={filename}
          isActive={currentFile === filename}
          onClick={() => onFileClick(filename)}
          currentThemeMode={currentThemeMode}
          onThemeToggle={onThemeToggle}
        />
      ))}
      {special.length > 0 && (
        <>
          <div style={{
            height: '1px',
            backgroundColor: 'var(--color-border-default)',
            margin: '5px 10px'
          }} />
          {special.map((filename) => (
            <FileItem
              key={filename}
              filename={filename}
              isActive={currentFile === filename}
              onClick={() => onFileClick(filename)}
              isSpecial={true}
              currentThemeMode={currentThemeMode}
              onThemeToggle={onThemeToggle}
            />
          ))}
        </>
      )}
    </div>
  );
}

