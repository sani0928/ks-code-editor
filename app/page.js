'use client';

import { useState, useEffect, useRef, useCallback, Fragment } from 'react';
import TitleBar from '../components/UI/TitleBar';
import FileExplorer from '../components/Sidebar/FileExplorer';
import EditorGroup from '../components/Editor/EditorGroup';
import NewGroupDropZone from '../components/Editor/NewGroupDropZone';
import GroupResizer from '../components/Editor/GroupResizer';
import OutputPanel from '../components/Terminal/OutputPanel';
import StatusBar from '../components/UI/StatusBar';
import { useFiles } from '../hooks/useFiles';
import { getLanguageFromFile, isCodeFile } from '../lib/fileManager';
import { applyCSSVariables } from '../lib/theme';
import { runPythonCode, runJavaScriptCode, escapeHtml } from '../lib/codeRunner';
import { 
  saveProblemNumber, 
  loadProblemNumber,
  saveUserId,
  loadUserId,
  saveEditorGroups,
  loadEditorGroups,
  saveActiveGroupId,
  loadActiveGroupId,
  saveTheme,
  loadTheme
} from '../lib/storage';
import { skeletonCodes } from '../constants/skeletonCode';

export default function Home() {
  const { files, currentFile, openTabs, setFiles, setCurrentFile, setOpenTabs, updateFile, openFile } = useFiles();
  
  const [output, setOutput] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [cursorPosition, setCursorPosition] = useState('Ln 1, Col 1');
  const [pyodide, setPyodide] = useState(null);
  const [isPyodideReady, setIsPyodideReady] = useState(false);
  const [problemNumber, setProblemNumber] = useState('');
  const [currentProblemNumber, setCurrentProblemNumber] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingProblem, setIsLoadingProblem] = useState(false);
  const [problemHtmlViewMode, setProblemHtmlViewMode] = useState(true);
  const [userId, setUserId] = useState('');
  const [currentUserId, setCurrentUserId] = useState('');
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);
  
  const editorRefs = useRef({});
  const isResizingRef = useRef(false);
  
  // 에디터 그룹 관리
  const [editorGroups, setEditorGroups] = useState([{ id: 0, tabs: ['파이쑝.py'], activeTab: '파이쑝.py', width: '100%' }]);
  
  const [activeGroupId, setActiveGroupId] = useState(0);
  
  // 클라이언트에서만 localStorage에서 값 로드
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedProblemNumber = loadProblemNumber();
      if (savedProblemNumber) {
        setProblemNumber(savedProblemNumber);
        setCurrentProblemNumber(savedProblemNumber);
      }
      
      const savedUserId = loadUserId();
      if (savedUserId) {
        setUserId(savedUserId);
        setCurrentUserId(savedUserId);
      }
      
      const savedEditorGroups = loadEditorGroups();
      if (savedEditorGroups && savedEditorGroups.length > 0) {
        setEditorGroups(savedEditorGroups);
      }
      
      const savedActiveGroupId = loadActiveGroupId();
      if (savedActiveGroupId !== null) {
        setActiveGroupId(savedActiveGroupId);
      }
    }
  }, []);

  // 문제 번호가 있고 HTML 파일이 없으면 자동으로 문제 불러오기
  useEffect(() => {
    if (typeof window === 'undefined' || !currentProblemNumber || isLoadingProblem) {
      return;
    }

    // HTML 파일이 있는지 확인 (profile.html 제외, 빈 파일 제외)
    const hasHtmlFile = Object.keys(files).some(filename => 
      filename.endsWith('.html') && 
      filename !== 'style.css' && 
      filename !== 'profile.html' &&
      filename !== 'problem.html' &&
      files[filename] && 
      files[filename].trim() !== ''
    );

    // 문제 번호가 있지만 HTML 파일이 없으면 자동으로 불러오기
    if (currentProblemNumber && !hasHtmlFile) {
      const loadProblem = async () => {
        setIsLoadingProblem(true);
        try {
          const response = await fetch('/api/crawl-problem', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ problemId: currentProblemNumber.trim() }),
          });

          if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || '문제를 가져오는데 실패했습니다.');
          }

          const data = await response.json();
          
          if (data.success && data.problemHtml) {
            const newFiles = { ...files };
            
            // 문제 이름으로 파일명 변경 (특수문자 제거)
            const problemTitle = (data.problemInfo.title || `문제 ${currentProblemNumber}`)
              .replace(/[<>:"/\\|?*]/g, '_')
              .trim();
            const problemFilename = `${problemTitle}.html`;
            
            // 기존 problem.html 또는 같은 이름의 문제 파일이 있으면 삭제 (profile.html 제외)
            Object.keys(newFiles).forEach(key => {
              if (key === 'problem.html' || (key.endsWith('.html') && key !== 'style.css' && key !== 'profile.html')) {
                delete newFiles[key];
              }
            });
            
            newFiles[problemFilename] = data.problemHtml;
            
            // 예제 입력 1을 input.txt에 자동으로 넣기
            if (data.problemInfo && data.problemInfo.sampleInputs && data.problemInfo.sampleInputs.length > 0) {
              const firstSampleInput = data.problemInfo.sampleInputs[0].trim();
              newFiles['input.txt'] = firstSampleInput;
            }
            
            setFiles(newFiles);

            // 새로고침 시 파일 유지
          }
        } catch (error) {
          console.error('문제 자동 로드 오류:', error);
        } finally {
          setIsLoadingProblem(false);
        }
      };

      loadProblem();
    }
  }, [currentProblemNumber, files, openTabs, activeGroupId, isLoadingProblem]);

  // 파일 다운로드 함수
  const handleDownloadFile = useCallback((filename, content) => {
    if (!filename || content === undefined || content === null) {
      return;
    }
    
    try {
      const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('파일 다운로드 오류:', error);
    }
  }, []);

  // Pyodide 초기화
  useEffect(() => {
    if (typeof window === 'undefined' || pyodide || isPyodideReady) {
      return;
    }

    const existingScript = document.querySelector('script[src*="pyodide.js"]');
    if (existingScript) {
      if (window.loadPyodide && !pyodide) {
        window.loadPyodide({
          indexURL: "https://cdn.jsdelivr.net/pyodide/v0.24.1/full/",
          stdout: () => {},
          stderr: () => {}
        }).then((pyodideInstance) => {
          setPyodide(pyodideInstance);
          setIsPyodideReady(true);
        }).catch((error) => {
          console.error("Pyodide 로드 오류:", error);
        });
      }
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/pyodide/v0.24.1/full/pyodide.js';
    script.async = true;
    script.id = 'pyodide-script';
    
    let isLoaded = false;
    
    script.onload = async () => {
      if (isLoaded) return;
      isLoaded = true;
      
      try {
        if (window.loadPyodide && !pyodide) {
          const pyodideInstance = await window.loadPyodide({
            indexURL: "https://cdn.jsdelivr.net/pyodide/v0.24.1/full/",
            stdout: () => {},
            stderr: () => {}
          });
          setPyodide(pyodideInstance);
          setIsPyodideReady(true);
        }
      } catch (error) {
        console.error("Pyodide 로드 오류:", error);
      }
    };
    
    script.onerror = (error) => {
      console.error("Pyodide 스크립트 로드 오류:", error);
    };
    
    document.body.appendChild(script);
  }, [pyodide, isPyodideReady]);

  // 테마 로드 및 적용
  useEffect(() => {
    if (typeof window !== 'undefined' && files['style.css']) {
      const savedTheme = loadTheme();
      if (savedTheme) {
        const newFiles = { ...files };
        newFiles['style.css'] = savedTheme;
        setFiles(newFiles);
      }
      applyCSSVariables(files['style.css']);
    }
  }, []);

  // style.css 변경 시 테마 적용
  useEffect(() => {
    if (files['style.css']) {
      applyCSSVariables(files['style.css']);
      saveTheme(files['style.css']);
    }
  }, [files['style.css']]);

  // 에디터 그룹 저장
  useEffect(() => {
    if (typeof window !== 'undefined') {
      saveEditorGroups(editorGroups);
    }
  }, [editorGroups]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      saveActiveGroupId(activeGroupId);
    }
  }, [activeGroupId]);


  // 유저 아이디 저장
  useEffect(() => {
    if (userId) {
      saveUserId(userId);
    }
  }, [userId]);

  // 유저 아이디 저장
  useEffect(() => {
    if (userId) {
      saveUserId(userId);
    }
  }, [userId]);

  // 키보드 단축키
  useEffect(() => {
    const handleKeyDown = (e) => {
      const isMonacoFocused = document.activeElement && 
        (document.activeElement.closest('.monaco-editor') || 
         document.activeElement.closest('.monaco-textarea') ||
         document.activeElement.classList.contains('monaco-inputbox'));

      if (isMonacoFocused) {
        // Ctrl+Z (undo), Ctrl+Shift+Z (redo), Ctrl+Y (redo)는 Monaco Editor가 처리
        if (e.ctrlKey && (e.key === 'z' || e.key === 'Z' || e.key === 'y' || e.key === 'Y')) {
          return;
        }
        // Ctrl+Shift+Z (redo) 명시적으로 허용
        if (e.ctrlKey && e.shiftKey && (e.key === 'z' || e.key === 'Z')) {
          return;
        }
        
        if (e.ctrlKey && e.key === 's') {
          e.preventDefault();
          const activeEditor = editorRefs.current[activeGroupId];
          const activeGroup = editorGroups.find(g => g.id === activeGroupId);
          if (activeGroup && activeGroup.activeTab && activeEditor) {
            const filename = activeGroup.activeTab;
            const content = activeEditor.getValue();
            updateFile(filename, content);
            
            // 코드 파일인 경우 다운로드
            if (isCodeFile(filename)) {
              handleDownloadFile(filename, content);
            }
          }
          return;
        }

        return;
      }

      if (e.ctrlKey && e.key === 's') {
        e.preventDefault();
        const activeEditor = editorRefs.current[activeGroupId];
        const activeGroup = editorGroups.find(g => g.id === activeGroupId);
        if (activeGroup && activeGroup.activeTab && activeEditor) {
          const filename = activeGroup.activeTab;
          const content = activeEditor.getValue();
          updateFile(filename, content);
          
          // 코드 파일인 경우 다운로드
          if (isCodeFile(filename)) {
            handleDownloadFile(filename, content);
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeGroupId, editorGroups, files, updateFile, handleDownloadFile]);

  // 터미널 리사이즈
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isResizingRef.current) return;
      const container = document.getElementById('editor-container');
      if (!container) return;
      const containerHeight = container.clientHeight;
      const mouseY = e.clientY;
      const containerTop = container.getBoundingClientRect().top;
      const newTerminalHeight = containerHeight - (mouseY - containerTop);
      const terminal = document.getElementById('terminal-container');
      if (terminal && newTerminalHeight > 100 && newTerminalHeight < containerHeight - 100) {
        terminal.style.height = newTerminalHeight + 'px';
      }
    };

    const handleMouseUp = () => {
      isResizingRef.current = false;
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  const handleOpenFile = (filename) => {
    openFile(filename);
    
    setEditorGroups(groups => groups.map(group => {
      if (group.id === activeGroupId) {
        const newTabs = group.tabs.includes(filename) ? group.tabs : [...group.tabs, filename];
        return { ...group, tabs: newTabs, activeTab: filename };
      }
      return group;
    }));
  };

  // 빈 그룹 삭제 후 처리 헬퍼 함수
  const handleEmptyGroupCleanup = (groups, deletedGroupId) => {
    if (groups.length === 0) {
      return [{ id: 0, tabs: ['파이쑝.py'], activeTab: '파이쑝.py', width: '100%' }];
    }
    
    // 삭제된 그룹이 활성 그룹이었으면 다른 그룹 활성화
    if (activeGroupId === deletedGroupId) {
      const nextGroup = groups[0];
      setActiveGroupId(nextGroup.id);
      setCurrentFile(nextGroup.activeTab);
    }
    
    // 그룹이 1개만 남으면 너비를 100%로
    if (groups.length === 1) {
      groups[0].width = '100%';
    }
    
    return groups;
  };

  // 탭 배열에서 특정 인덱스에 삽입하는 헬퍼 함수
  const insertTabAtIndex = (tabs, filename, insertIndex) => {
    const newTabs = [...tabs];
    const currentIndex = newTabs.indexOf(filename);
    
    if (currentIndex !== -1) {
      // 이미 있는 경우 순서만 변경
      newTabs.splice(currentIndex, 1);
      // insertIndex가 null이거나 유효하지 않은 경우 처리
      let finalIndex = insertIndex;
      if (insertIndex === null || insertIndex === undefined || insertIndex < 0) {
        finalIndex = newTabs.length;
      } else {
        finalIndex = insertIndex > currentIndex ? insertIndex - 1 : insertIndex;
      }
      // 인덱스 범위 체크
      finalIndex = Math.max(0, Math.min(finalIndex, newTabs.length));
      newTabs.splice(finalIndex, 0, filename);
    } else {
      // 새로 추가하는 경우
      let finalIndex = insertIndex;
      if (insertIndex === null || insertIndex === undefined || insertIndex < 0) {
        finalIndex = newTabs.length;
      }
      // 인덱스 범위 체크
      finalIndex = Math.max(0, Math.min(finalIndex, newTabs.length));
      newTabs.splice(finalIndex, 0, filename);
    }
    
    return newTabs;
  };

  const handleCloseTab = (filename, e, groupId) => {
    e.stopPropagation();
    
    setEditorGroups(groups => {
      const targetGroup = groups.find(g => g.id === groupId);
      if (!targetGroup) return groups;
      
      const updatedGroups = groups.map(group => {
        if (group.id === groupId) {
          const newTabs = group.tabs.filter(tab => tab !== filename);
          
          // 탭이 없으면 null 반환 (나중에 필터링)
          if (newTabs.length === 0) {
            return null;
          }
          
          const currentIndex = group.tabs.indexOf(filename);
          const nextFile = newTabs[currentIndex === 0 ? 0 : currentIndex - 1] || newTabs[0];
          
          return { ...group, tabs: newTabs, activeTab: nextFile };
        }
        return group;
      }).filter(group => group !== null);
      
      // 빈 그룹이 삭제된 경우 처리
      if (updatedGroups.length < groups.length) {
        return handleEmptyGroupCleanup(updatedGroups, groupId);
      }
      
      return updatedGroups;
    });

    const newTabs = openTabs.filter(tab => tab !== filename);
    setOpenTabs(newTabs);

    if (currentFile === filename) {
      const currentIndex = openTabs.indexOf(filename);
      const nextFile = newTabs[currentIndex === 0 ? 0 : currentIndex - 1];
      setCurrentFile(nextFile);
    }
  };

  const handleTabDrop = (item, targetGroupId, insertIndex = null) => {
    if (item.groupId === targetGroupId) {
      return;
    }

    setEditorGroups(groups => {
      const newGroups = groups.map(group => {
        if (group.id === item.groupId) {
          // 원본 그룹에서 탭 제거
          const newTabs = group.tabs.filter(tab => tab !== item.filename);
          // 탭이 없으면 null 반환 (나중에 필터링)
          if (newTabs.length === 0) {
            return null;
          }
          const nextActiveTab = newTabs[0] || null;
          return { ...group, tabs: newTabs, activeTab: nextActiveTab };
        } else if (group.id === targetGroupId) {
          // 대상 그룹에 탭 추가
          const newTabs = insertTabAtIndex(group.tabs, item.filename, insertIndex);
          return { ...group, tabs: newTabs, activeTab: item.filename };
        }
        return group;
      }).filter(group => group !== null);
      
      // 빈 그룹이 삭제된 경우 처리
      if (newGroups.length < groups.length) {
        if (newGroups.length === 0) {
          // 그룹이 하나도 없으면 기본 그룹 생성 (드롭된 탭 포함)
          const defaultGroup = [{ id: 0, tabs: [item.filename], activeTab: item.filename, width: '100%' }];
          setActiveGroupId(0);
          setCurrentFile(item.filename);
          return defaultGroup;
        }
        
        // 삭제된 그룹이 활성 그룹이었으면 대상 그룹 활성화
        const wasActiveGroup = activeGroupId === item.groupId;
        const cleanedGroups = handleEmptyGroupCleanup(newGroups, item.groupId);
        
        if (wasActiveGroup) {
          const nextGroup = cleanedGroups.find(g => g.id === targetGroupId) || cleanedGroups[0];
          setActiveGroupId(nextGroup.id);
          setCurrentFile(item.filename);
        }
        
        return cleanedGroups;
      }
      
      // 빈 그룹이 삭제되지 않은 경우에도 활성 그룹 업데이트
      setCurrentFile(item.filename);
      setActiveGroupId(targetGroupId);
      
      return newGroups;
    });
  };

  const handleTabReorder = (filename, groupId, newIndex) => {
    setEditorGroups(groups => {
      return groups.map(group => {
        if (group.id === groupId) {
          const tabs = insertTabAtIndex(group.tabs, filename, newIndex);
          return { ...group, tabs };
        }
        return group;
      });
    });
  };

  const handleFileDrop = (filename, targetGroupId, insertIndex = null) => {
    // 파일이 이미 열려있는지 확인
    if (!openTabs.includes(filename)) {
      setOpenTabs([...openTabs, filename]);
    }

    setEditorGroups(groups => groups.map(group => {
      if (group.id === targetGroupId) {
        // 파일이 이미 있으면 순서만 변경, 없으면 새로 추가
        const newTabs = insertTabAtIndex(group.tabs, filename, insertIndex);
        return { ...group, tabs: newTabs, activeTab: filename };
      }
      return group;
    }));

    setCurrentFile(filename);
    setActiveGroupId(targetGroupId);
  };

  const handleNewGroupDrop = (item) => {
    if (editorGroups.length >= 2) return;

    const filename = item.filename;
    
    // 안전한 그룹 ID 생성
    const maxId = editorGroups.length > 0 
      ? Math.max(...editorGroups.map(g => g.id)) 
      : -1;
    const newGroupId = maxId + 1;
    
    setEditorGroups(groups => {
      const newGroups = groups.map(group => ({
        ...group,
        width: '50%'
      }));

      // 탭인 경우에만 원본 그룹에서 제거
      if (item.type === 'tab' && item.groupId !== undefined) {
        const sourceGroupIndex = newGroups.findIndex(g => g.id === item.groupId);
        if (sourceGroupIndex !== -1) {
          const sourceGroup = newGroups[sourceGroupIndex];
          const newTabs = sourceGroup.tabs.filter(tab => tab !== filename);
          
          // 빈 그룹이 되는 경우 처리
          if (newTabs.length === 0) {
            // 빈 그룹은 제거하지 않고 유지 (새 그룹이 생성되므로)
            // 하지만 실제로는 새 그룹이 생성되므로 빈 그룹을 제거해야 함
            newGroups.splice(sourceGroupIndex, 1);
          } else {
            const nextActiveTab = newTabs[0] || null;
            newGroups[sourceGroupIndex] = { ...sourceGroup, tabs: newTabs, activeTab: nextActiveTab };
          }
        }
      }

      // 새 그룹 추가
      newGroups.push({
        id: newGroupId,
        tabs: [filename],
        activeTab: filename,
        width: '50%'
      });

      // 그룹이 1개만 남은 경우 너비 조정
      if (newGroups.length === 1) {
        newGroups[0].width = '100%';
      }

      return newGroups;
    });

    // 파일이 탭에 없으면 추가
    if (!openTabs.includes(filename)) {
      setOpenTabs([...openTabs, filename]);
    }

    setCurrentFile(filename);
    setActiveGroupId(newGroupId);
  };

  const handleGroupResize = (leftGroupId, rightGroupId, leftPercent, rightPercent) => {
    setEditorGroups(groups => groups.map(group => {
      if (group.id === leftGroupId) {
        return { ...group, width: `${leftPercent}%` };
      } else if (group.id === rightGroupId) {
        return { ...group, width: `${rightPercent}%` };
      }
      return group;
    }));
  };

  const handleEditorChange = (value, groupId) => {
    if (value !== undefined) {
      const group = editorGroups.find(g => g.id === groupId);
      if (group && group.activeTab) {
        updateFile(group.activeTab, value);
        
        if (group.activeTab === 'style.css') {
          applyCSSVariables(value);
        }
      }
    }
  };

  const handleEditorMount = (editor, groupId) => {
    editorRefs.current[groupId] = editor;
    
    if (groupId === activeGroupId) {
      editor.focus();
    }
    
    if (window.monaco && files['style.css']) {
      applyCSSVariables(files['style.css']);
    }
    
    editor.onDidChangeCursorPosition((e) => {
      const position = e.position;
      const group = editorGroups.find(g => g.id === groupId);
      if (group && group.id === activeGroupId && group.activeTab) {
        setCursorPosition(`Ln ${position.lineNumber}, Col ${position.column}`);
      }
    });
  };

  const handleRunCode = async () => {
    const activeGroup = editorGroups.find(g => g.id === activeGroupId);
    if (!activeGroup || !activeGroup.activeTab) {
      setOutput('실행할 파일이 없습니다.');
      return;
    }

    const fileToRun = activeGroup.activeTab;
    const code = files[fileToRun] || '';
    
    if (!code.trim()) {
      setOutput('실행할 코드가 없습니다.');
      return;
    }

    const language = getLanguageFromFile(fileToRun);
    const inputText = files['input.txt'] || '';

    setIsRunning(true);
    setOutput('');

    try {
      if (language === 'python') {
        await runPythonCode(code, inputText, pyodide);
        const result = await runPythonCode(code, inputText, pyodide);
        setOutput(escapeHtml(result));
      } else if (language === 'javascript') {
        const result = runJavaScriptCode(code, inputText);
        setOutput(escapeHtml(result));
      } else {
        setOutput(`${language} 언어는 실행을 지원하지 않습니다.`);
      }
    } catch (error) {
      setOutput(`<div class="output-error">${escapeHtml(error.message)}</div>`);
    } finally {
      setIsRunning(false);
    }
  };

  const handleLoadProblem = async () => {
    if (!problemNumber.trim()) {
      alert('문제 번호를 입력하세요.');
      return;
    }

    setIsLoadingProblem(true);

    try {
      const response = await fetch('/api/crawl-problem', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ problemId: problemNumber.trim() }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || '문제를 가져오는데 실패했습니다.');
      }

      const data = await response.json();
      
      if (data.success && data.problemHtml) {
        const newFiles = { ...files };
        
        // 문제 이름으로 파일명 변경 (특수문자 제거)
        const problemTitle = (data.problemInfo.title || `문제 ${problemNumber}`)
          .replace(/[<>:"/\\|?*]/g, '_')
          .trim();
        const problemFilename = `${problemTitle}.html`;
        
        // 기존 problem.html 또는 같은 이름의 문제 파일이 있으면 삭제 (profile.html 제외)
        Object.keys(newFiles).forEach(key => {
          if (key === 'problem.html' || (key.endsWith('.html') && key !== 'style.css' && key !== 'profile.html')) {
            // 탭에서도 제거
            setOpenTabs(prev => prev.filter(tab => tab !== key));
            // 그룹에서도 제거
            setEditorGroups(groups => groups.map(group => ({
              ...group,
              tabs: group.tabs.filter(tab => tab !== key),
              activeTab: group.activeTab === key ? (group.tabs.find(t => t !== key) || null) : group.activeTab
            })));
            delete newFiles[key];
          }
        });
        
        newFiles[problemFilename] = data.problemHtml;
        
        // 예제 입력 1을 input.txt에 자동으로 넣기
        if (data.problemInfo && data.problemInfo.sampleInputs && data.problemInfo.sampleInputs.length > 0) {
          const firstSampleInput = data.problemInfo.sampleInputs[0].trim();
          newFiles['input.txt'] = firstSampleInput;
        }
        
        setFiles(newFiles);
        setCurrentProblemNumber(problemNumber.trim());
        
        // 문제 가져오기 성공 시에만 문제 번호 저장
        saveProblemNumber(problemNumber.trim());

        // 문제 파일 열기
        if (!openTabs.includes(problemFilename)) {
          setOpenTabs([...openTabs, problemFilename]);
        }
        
        setEditorGroups(groups => groups.map(group => {
          if (group.id === activeGroupId) {
            const newTabs = group.tabs.includes(problemFilename) ? group.tabs : [...group.tabs, problemFilename];
            return { ...group, tabs: newTabs, activeTab: problemFilename };
          }
          return group;
        }));
        
        setCurrentFile(problemFilename);

        alert(`문제 ${problemNumber} 정보를 가져왔습니다! (solved.ac 제공)`);
      } else {
        throw new Error('문제 정보를 가져올 수 없습니다.');
      }
    } catch (error) {
      console.error('문제 가져오기 오류:', error);
      alert('문제를 가져올 수 없습니다. 번호를 확인하세요.');
    } finally {
      setIsLoadingProblem(false);
    }
  };

  const handleLoadProfile = async () => {
    if (!userId.trim()) {
      alert('유저 아이디를 입력하세요.');
      return;
    }

    setIsLoadingProfile(true);

    try {
      const response = await fetch('/api/crawl-userprofile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ handle: userId.trim() }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || '프로필을 가져오는데 실패했습니다.');
      }

      const data = await response.json();
      
      if (data.success && data.profileHtml) {
        const newFiles = { ...files };
        
        // profile.html 파일 업데이트
        newFiles['profile.html'] = data.profileHtml;
        
        setFiles(newFiles);
        setCurrentUserId(userId.trim());

        // 프로필 파일 열기
        if (!openTabs.includes('profile.html')) {
          setOpenTabs([...openTabs, 'profile.html']);
        }
        
        setEditorGroups(groups => groups.map(group => {
          if (group.id === activeGroupId) {
            const newTabs = group.tabs.includes('profile.html') ? group.tabs : [...group.tabs, 'profile.html'];
            return { ...group, tabs: newTabs, activeTab: 'profile.html' };
          }
          return group;
        }));
        
        setCurrentFile('profile.html');

        alert(`프로필 정보를 가져왔습니다! (solved.ac 제공)`);
      } else {
        throw new Error('프로필 정보를 가져올 수 없습니다.');
      }
    } catch (error) {
      console.error('프로필 가져오기 오류:', error);
      alert('프로필 정보를 가져올 수 없습니다. 아이디를 확인하세요.');
    } finally {
      setIsLoadingProfile(false);
    }
  };

  const handleSubmitToBOJ = async () => {
    if (!problemNumber.trim()) {
      alert('문제 번호를 입력하세요.');
      return;
    }

    const activeEditor = editorRefs.current[activeGroupId];
    if (!activeEditor) {
      alert('코드를 작성해주세요.');
      return;
    }

    const code = activeEditor.getValue();
    if (!code.trim()) {
      alert('코드가 비어있습니다.');
      return;
    }

    setIsSubmitting(true);

    try {
      await navigator.clipboard.writeText(code);
      
      alert(`코드가 클립보드에 복사되었습니다!\n\n확인 버튼을 누르면 백준 제출 페이지로 이동합니다.\n코드 입력란에 Ctrl+V로 붙여넣으세요.`);
      
      const problemUrl = `https://www.acmicpc.net/submit/${problemNumber}`;
      window.open(problemUrl, '_blank');
      
      setIsSubmitting(false);
    } catch (error) {
      console.error('클립보드 복사 실패:', error);
      
      const problemUrl = `https://www.acmicpc.net/submit/${problemNumber}`;
      
      alert(`클립보드 복사에 실패했습니다.\n\n확인 버튼을 누르면 코드가 표시된 새 창과 백준 제출 페이지가 열립니다.`);
      
      const root = document.documentElement;
      const bgPrimary = getComputedStyle(root).getPropertyValue('--bg-primary').trim();
      const bgSecondary = getComputedStyle(root).getPropertyValue('--bg-secondary').trim();
      const bgTertiary = getComputedStyle(root).getPropertyValue('--bg-tertiary').trim();
      const textPrimary = getComputedStyle(root).getPropertyValue('--text-primary').trim();
      const fileSpecialColor = getComputedStyle(root).getPropertyValue('--file-special-color').trim();
      
      const codeWindow = window.open('', '_blank');
      codeWindow.document.write(`
        <html>
          <head>
            <title>백준 제출용 코드 - 문제 ${problemNumber}</title>
            <style>
              body { 
                font-family: monospace; 
                padding: 20px; 
                background: ${bgPrimary}; 
                color: ${textPrimary};
              }
              pre { 
                background: ${bgSecondary}; 
                padding: 15px; 
                border-radius: 5px;
                white-space: pre-wrap;
                word-wrap: break-word;
              }
              .info {
                margin-bottom: 20px;
                padding: 10px;
                background: ${bgTertiary};
                border-radius: 5px;
              }
              a {
                color: ${fileSpecialColor};
                text-decoration: none;
              }
              a:hover {
                text-decoration: underline;
              }
            </style>
          </head>
          <body>
            <div class="info">
              <h2>백준 문제 ${problemNumber} 제출용 코드</h2>
              <p>아래 코드를 복사하여 <a href="${problemUrl}" target="_blank">백준 제출 페이지</a>에 붙여넣으세요.</p>
            </div>
            <pre>${escapeHtml(code)}</pre>
            <div class="info">
              <button onclick="navigator.clipboard.writeText(\`${code.replace(/`/g, '\\`').replace(/\$/g, '\\$')}\`)">코드 복사</button>
            </div>
          </body>
        </html>
      `);
      
      window.open(problemUrl, '_blank');
      
      setIsSubmitting(false);
    }
  };

  const handleResetTheme = () => {
    const defaultTheme = skeletonCodes['style.css'];
    updateFile('style.css', defaultTheme);
    applyCSSVariables(defaultTheme);
    
    const styleCssGroup = editorGroups.find(g => g.activeTab === 'style.css');
    if (styleCssGroup && editorRefs.current[styleCssGroup.id]) {
      editorRefs.current[styleCssGroup.id].setValue(defaultTheme);
    }
  };

  const handleTabClick = (filename, groupId) => {
    setCurrentFile(filename);
    setActiveGroupId(groupId);
    setEditorGroups(groups => groups.map(g => 
      g.id === groupId ? { ...g, activeTab: filename } : g
    ));
  };

  const handleEditorClick = (filename, groupId) => {
    setCurrentFile(filename);
    setActiveGroupId(groupId);
  };

  const handleTabDoubleClick = (filename) => {
    if (filename === 'style.css') {
      handleResetTheme();
    } else if (filename && filename.endsWith('.html')) {
      setProblemHtmlViewMode(!problemHtmlViewMode);
    }
  };

  const handleResizeStart = () => {
    isResizingRef.current = true;
  };

  const activeGroup = editorGroups.find(g => g.id === activeGroupId);
  const activeFile = activeGroup?.activeTab || currentFile;
  const language = getLanguageFromFile(activeFile);

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      width: '100%',
      maxWidth: '100%',
      height: '100%',
      overflow: 'hidden',
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      margin: '0 auto'
    }}>
      <TitleBar
        problemNumber={problemNumber}
        onProblemNumberChange={setProblemNumber}
        onLoadProblem={handleLoadProblem}
        onSubmitToBOJ={handleSubmitToBOJ}
        isLoadingProblem={isLoadingProblem}
        isSubmitting={isSubmitting}
        currentProblemNumber={currentProblemNumber}
        userId={userId}
        onUserIdChange={setUserId}
        onLoadProfile={handleLoadProfile}
        isLoadingProfile={isLoadingProfile}
        currentUserId={currentUserId}
      />

      <div style={{
        display: 'flex',
        flex: 1,
        overflow: 'hidden',
        minWidth: 0,
        minHeight: 0
      }}>
        <div style={{
          width: '200px',
          minWidth: '200px',
          maxWidth: '200px',
          flexShrink: 0,
          backgroundColor: 'var(--bg-secondary)',
          borderRight: '1px solid var(--border-color)',
          display: 'flex',
          flexDirection: 'column'
        }}>
          <div style={{
            padding: '10px',
            fontSize: '11px',
            fontWeight: 600,
            textTransform: 'uppercase',
            color: 'var(--text-primary)',
            borderBottom: '1px solid var(--border-color)'
          }}>
            Explorer
          </div>
          <FileExplorer
            files={files}
            currentFile={currentFile}
            onFileClick={handleOpenFile}
          />
        </div>

        <div 
          id="editor-container" 
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            backgroundColor: 'var(--bg-primary)',
            position: 'relative',
            minWidth: 0,
            minHeight: 0,
            overflow: 'hidden'
          }}
        >
          <div style={{ 
            display: 'flex',
            flexDirection: 'row',
            position: 'relative',
            zIndex: 1,
            flex: 1,
            minHeight: 0,
            overflow: 'hidden'
          }}>
            {/* 새 그룹 생성 영역 */}
            <NewGroupDropZone
              onDrop={handleNewGroupDrop}
              isVisible={editorGroups.length === 1}
            />
            
            {editorGroups.map((group, groupIndex) => (
              <Fragment key={group.id}>
                <EditorGroup
                  group={group}
                  files={files}
                  onEditorChange={handleEditorChange}
                  onEditorMount={handleEditorMount}
                  onTabClick={handleTabClick}
                  onTabClose={handleCloseTab}
                  onTabDoubleClick={handleTabDoubleClick}
                  onTabDrop={handleTabDrop}
                  onTabReorder={handleTabReorder}
                  onFileDrop={handleFileDrop}
                  onEditorClick={handleEditorClick}
                  isActive={activeGroupId === group.id}
                  problemHtmlViewMode={problemHtmlViewMode}
                  isNewGroupDropZoneVisible={editorGroups.length === 1}
                />
                {/* 두 그룹 사이에 리사이저 추가 */}
                {groupIndex < editorGroups.length - 1 && (
                  <GroupResizer
                    leftGroupId={group.id}
                    rightGroupId={editorGroups[groupIndex + 1].id}
                    onResize={handleGroupResize}
                  />
                )}
              </Fragment>
            ))}
          </div>

          <div
            style={{
              height: '4px',
              backgroundColor: 'var(--border-color)',
              cursor: 'ns-resize',
              position: 'relative'
            }}
            id="resize-handle"
            onMouseDown={handleResizeStart}
          />

          <div id="terminal-container" style={{
            height: '300px',
            display: 'flex',
            flexDirection: 'column',
            backgroundColor: 'var(--bg-primary)',
            borderTop: '1px solid var(--border-color)'
          }}>
            <OutputPanel
              output={output}
              isRunning={isRunning}
              onRunCode={handleRunCode}
            />
          </div>
        </div>
      </div>

      <StatusBar
        cursorPosition={cursorPosition}
        language={language}
      />
    </div>
  );
}

