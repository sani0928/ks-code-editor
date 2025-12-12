'use client';

import { useState, useEffect, useRef } from 'react';
import { createInitialFiles, isCodeFile } from '../lib/fileManager';
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
  const [files, setFiles] = useState(null);
  const [currentFile, setCurrentFile] = useState('파이쑝.py');
  const [openTabs, setOpenTabs] = useState(['파이쑝.py']);
  const isInitializedRef = useRef(false);

  // 초기 로드: localStorage에서 파일 로드
  useEffect(() => {
    if (typeof window !== 'undefined' && !isInitializedRef.current) {
      const savedFiles = loadFiles();
      const initialFiles = createInitialFiles();
      
      if (savedFiles && Object.keys(savedFiles).length > 0) {
        const mergedFiles = { ...initialFiles };
        Object.keys(savedFiles).forEach(filename => {
          mergedFiles[filename] = savedFiles[filename];
        });
        setFiles(mergedFiles);
      } else {
        setFiles(initialFiles);
      }
      
      const savedCurrentFile = loadCurrentFile();
      if (savedCurrentFile) {
        setCurrentFile(savedCurrentFile);
      }
      
      const savedOpenTabs = loadOpenTabs();
      if (savedOpenTabs && savedOpenTabs.length > 0) {
        setOpenTabs(savedOpenTabs);
      }
      
      isInitializedRef.current = true;
    }
  }, []);

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
    setFiles(prev => {
      const newFiles = {
        ...prev,
        [filename]: content
      };
      // 코드 파일 변경 시에만 저장
      if (isInitializedRef.current && typeof window !== 'undefined') {
        if (isCodeFile(filename)) {
          saveFiles(newFiles);
        }
      }
      return newFiles;
    });
  };

  const addFile = (filename, content = '') => {
    setFiles(prev => ({
      ...prev,
      [filename]: content
    }));
  };

  const openFile = (filename) => {
    if (!files || !files[filename]) {
      addFile(filename);
    }
    if (!openTabs.includes(filename)) {
      setOpenTabs(prev => [...prev, filename]);
    }
    setCurrentFile(filename);
  };

  // files가 null이면 빈 객체 반환 (hydration 에러 방지)
  return {
    files: files || {},
    currentFile,
    openTabs,
    setFiles,
    setCurrentFile,
    setOpenTabs,
    updateFile,
    addFile,
    openFile,
    isInitialized: isInitializedRef.current
  };
}

