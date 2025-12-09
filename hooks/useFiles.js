'use client';

import { useState, useEffect } from 'react';
import { createInitialFiles } from '../lib/fileManager';
import { 
  saveFiles, 
  loadFiles, 
  saveCurrentFile, 
  loadCurrentFile,
  saveOpenTabs,
  loadOpenTabs
} from '../lib/storage';

/**
 * 파일 관리 훅
 */
export function useFiles() {
  // 초기 상태는 항상 동일하게 설정 (hydration 에러 방지)
  const [files, setFiles] = useState(createInitialFiles);
  const [currentFile, setCurrentFile] = useState('파이쑝.py');
  const [openTabs, setOpenTabs] = useState(['파이쑝.py']);
  const [isInitialized, setIsInitialized] = useState(false);

  // 클라이언트에서만 localStorage에서 값 로드 (HTML 파일 포함)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedFiles = loadFiles();
      if (savedFiles) {
        // 저장된 파일과 초기 파일 병합 (저장된 파일 우선)
        // 이렇게 하면 HTML 파일도 유지됨
        const initialFiles = createInitialFiles();
        // 빈 problem.html은 제외 (저장된 파일이 있으면 덮어쓰기)
        const mergedFiles = { ...initialFiles, ...savedFiles };
        // 빈 problem.html이 저장된 파일에 없으면 제거
        if (mergedFiles['problem.html'] === '' && !savedFiles['problem.html']) {
          delete mergedFiles['problem.html'];
        }
        setFiles(mergedFiles);
      }
      
      const savedCurrentFile = loadCurrentFile();
      if (savedCurrentFile) {
        setCurrentFile(savedCurrentFile);
      }
      
      const savedOpenTabs = loadOpenTabs();
      if (savedOpenTabs && savedOpenTabs.length > 0) {
        setOpenTabs(savedOpenTabs);
      }
      
      setIsInitialized(true);
    }
  }, []);

  // 파일 변경 시 localStorage에 저장 (초기화 후에만)
  useEffect(() => {
    if (typeof window !== 'undefined' && isInitialized) {
      saveFiles(files);
    }
  }, [files, isInitialized]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      saveCurrentFile(currentFile);
    }
  }, [currentFile]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      saveOpenTabs(openTabs);
    }
  }, [openTabs]);

  const updateFile = (filename, content) => {
    setFiles(prev => ({
      ...prev,
      [filename]: content
    }));
  };

  const addFile = (filename, content = '') => {
    setFiles(prev => ({
      ...prev,
      [filename]: content
    }));
  };

  const openFile = (filename) => {
    if (!files[filename]) {
      addFile(filename);
    }
    if (!openTabs.includes(filename)) {
      setOpenTabs(prev => [...prev, filename]);
    }
    setCurrentFile(filename);
  };

  return {
    files,
    currentFile,
    openTabs,
    setFiles,
    setCurrentFile,
    setOpenTabs,
    updateFile,
    addFile,
    openFile
  };
}

