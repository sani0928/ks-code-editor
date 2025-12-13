"use client";

import { useState, useEffect, useRef, useCallback, Fragment } from "react";
import TitleBar from "../components/UI/TitleBar";
import FileExplorer from "../components/Sidebar/FileExplorer";
import EditorGroup from "../components/Editor/EditorGroup";
import NewGroupDropZone from "../components/Editor/NewGroupDropZone";
import GroupResizer from "../components/Editor/GroupResizer";
import OutputPanel from "../components/Terminal/OutputPanel";
import StatusBar from "../components/UI/StatusBar";
import { useFiles } from "../hooks/useFiles";
import { getLanguageFromFile, isCodeFile } from "../lib/fileManager";
import { applyCSSVariables, extractCSSVariables, detectThemeMode } from "../lib/theme";
import { escapeHtml } from "../lib/utils";
import {
  runPythonCode,
  runJavaScriptCode,
  runCppCode,
  runCCode,
  runJavaCode,
} from "../lib/codeRunner";
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
  loadTheme,
  saveThemeMode,
  loadThemeMode,
  saveLastKnownTheme,
  loadLastKnownTheme,
  saveProblemInfo,
  saveProfileInfo,
} from "../lib/storage";
import { skeletonCodes, themeTemplates } from "../constants/skeletonCode";

export default function Home() {
  const {
    files,
    currentFile,
    openTabs,
    setFiles,
    setCurrentFile,
    setOpenTabs,
    updateFile,
    openFile,
    isInitialized,
  } = useFiles();

  const [output, setOutput] = useState("");
  const [isRunning, setIsRunning] = useState(false);
  const [outputStatus, setOutputStatus] = useState(null); // 'success' | 'error' | null
  const [cursorPosition, setCursorPosition] = useState("Ln 1, Col 1");
  const [pyodide, setPyodide] = useState(null);
  const [isPyodideReady, setIsPyodideReady] = useState(false);
  const [problemNumber, setProblemNumber] = useState("");
  const [currentProblemNumber, setCurrentProblemNumber] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingProblem, setIsLoadingProblem] = useState(false);
  const [problemHtmlViewMode, setProblemHtmlViewMode] = useState(true);
  const [profileHtmlViewMode, setProfileHtmlViewMode] = useState(true);
  const [userId, setUserId] = useState("");
  const [currentUserId, setCurrentUserId] = useState("");
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [themeMode, setThemeMode] = useState('dark');
  const [lastKnownTheme, setLastKnownTheme] = useState('dark');

  const editorRefs = useRef({});
  const isResizingRef = useRef(false);
  const previousTerminalHeightRef = useRef(null);

  // 터미널 접기 상태 관리
  const [isTerminalCollapsed, setIsTerminalCollapsed] = useState(false);

  // 에디터 그룹 관리
  const [editorGroups, setEditorGroups] = useState([
    { id: 0, tabs: ["파이쑝.py"], activeTab: "파이쑝.py", width: "100%" },
  ]);

  const [activeGroupId, setActiveGroupId] = useState(0);

  // 모바일 화면 감지 (768px 이하)
  useEffect(() => {
    if (typeof window === "undefined") return;

    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    // 초기 체크
    checkMobile();
    
    // 화면 크기 변경 시 체크
    window.addEventListener("resize", checkMobile);

    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // 클라이언트에서만 localStorage에서 값 로드
  useEffect(() => {
    if (typeof window !== "undefined") {
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

  // localStorage 'kscode_files' 변화 감지하여 outputStatus 초기화
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleStorageChange = (e) => {
      // 다른 탭에서 'kscode_files'가 변경된 경우
      if (e.key === 'kscode_files' && !isRunning) {
        setOutputStatus(null); // 기본 색상으로 초기화
      }
    };

    // 같은 탭에서 localStorage 변경 감지를 위한 커스텀 이벤트
    const handleCustomStorageChange = (e) => {
      if (e.detail?.key === 'kscode_files' && !isRunning) {
        setOutputStatus(null); // 기본 색상으로 초기화
      }
    };

    // storage 이벤트 리스너 (다른 탭에서 변경된 경우)
    window.addEventListener('storage', handleStorageChange);
    // 커스텀 이벤트 리스너 (같은 탭에서 변경된 경우)
    window.addEventListener('localStorageChange', handleCustomStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('localStorageChange', handleCustomStorageChange);
    };
  }, [isRunning]);

  // 문제 번호가 있고 HTML 파일이 없으면 자동으로 문제 불러오기
  useEffect(() => {
    if (
      typeof window === "undefined" ||
      !currentProblemNumber ||
      isLoadingProblem
    ) {
      return;
    }

    // HTML 파일이 있는지 확인 (프로필 파일 제외, 빈 파일 제외)
    // 프로필 파일은 유저 아이디로 시작하는 .html 파일
    const hasHtmlFile = Object.keys(files).some(
      (filename) =>
        filename.endsWith(".html") &&
        filename !== "style.css" &&
        !(currentUserId && filename === `${currentUserId}.html`) &&
        filename !== "problem.html" &&
        files[filename] &&
        files[filename].trim() !== ""
    );

    // 문제 번호가 있지만 HTML 파일이 없으면 자동으로 불러오기
    if (currentProblemNumber && !hasHtmlFile) {
      const loadProblem = async () => {
        setIsLoadingProblem(true);
        try {
          const response = await fetch("/api/crawl-problem", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ problemId: currentProblemNumber.trim() }),
          });

          if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || "문제를 가져오는데 실패했습니다.");
          }

          const data = await response.json();

          if (data.success && data.problemHtml) {
            // 함수형 업데이트로 기존 파일 유지
            setFiles((prev) => {
              const newFiles = { ...prev };

              // 문제 이름으로 파일명 변경 (특수문자 제거)
              const problemTitle = (
                data.problemInfo.title || `문제 ${currentProblemNumber}`
              )
                .replace(/[<>:"/\\|?*]/g, "_")
                .trim();
              const problemFilename = `${problemTitle}.html`;

              // 기존 문제 HTML 파일 삭제
              const filesToRemove = removeOldHtmlFiles(newFiles, 'problem', problemFilename, currentUserId);
              filesToRemove.forEach(key => delete newFiles[key]);

              newFiles[problemFilename] = data.problemHtml;

              // 예제 입력 1을 input.txt에 자동으로 넣기
              if (
                data.problemInfo &&
                data.problemInfo.sampleInputs &&
                data.problemInfo.sampleInputs.length > 0
              ) {
                const firstSampleInput =
                  data.problemInfo.sampleInputs[0].trim();
                newFiles["input.txt"] = firstSampleInput;
              }

              return newFiles;
            });

            // 문제 정보 저장
            if (data.problemInfo) {
              saveProblemInfo(data.problemInfo);
            }

            // 새로고침 시 파일 유지
          }
        } catch (error) {
          console.error("문제 자동 로드 오류:", error);
        } finally {
          setIsLoadingProblem(false);
        }
      };

      loadProblem();
    }
  }, [currentProblemNumber, files, openTabs, activeGroupId, isLoadingProblem]);

  // 유저 ID가 있고 profile.html 파일이 없으면 자동으로 프로필 불러오기
  useEffect(() => {
    if (
      typeof window === "undefined" ||
      !currentUserId ||
      isLoadingProfile
    ) {
      return;
    }

    // 유저 아이디로 파일명 생성
    const profileFilename = `${currentUserId.trim()}.html`;
    
    // 프로필 파일이 있는지 확인 (빈 파일 제외)
    const hasProfileHtmlFile = 
      files[profileFilename] && 
      files[profileFilename].trim() !== "";

    // 유저 ID가 있지만 프로필 파일이 없으면 자동으로 불러오기
    if (currentUserId && !hasProfileHtmlFile) {
      const loadProfile = async () => {
        setIsLoadingProfile(true);
        try {
          const response = await fetch("/api/crawl-userprofile", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ handle: currentUserId.trim() }),
          });

          if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || "프로필을 가져오는데 실패했습니다.");
          }

          const data = await response.json();

          if (data.success && data.profileHtml) {
            // 함수형 업데이트로 기존 파일 유지
            setFiles((prev) => {
              const newFiles = { ...prev };

              // 기존 프로필 HTML 파일 삭제 (자동 로드: 파일만 삭제, 탭/그룹은 유지)
              const filesToRemove = removeOldHtmlFiles(newFiles, 'profile', profileFilename, currentUserId);
              filesToRemove.forEach(key => delete newFiles[key]);

              newFiles[profileFilename] = data.profileHtml;

              return newFiles;
            });
            
            // 프로필 정보 저장
            if (data.profileInfo) {
              saveProfileInfo(data.profileInfo);
            }

            // 새로고침 시 파일 유지
          }
        } catch (error) {
          console.error("프로필 자동 로드 오류:", error);
        } finally {
          setIsLoadingProfile(false);
        }
      };

      loadProfile();
    }
  }, [currentUserId, files, isLoadingProfile]);

  // 문제/프로필 파일에서 기존 HTML 파일 삭제 헬퍼 함수
  const removeOldHtmlFiles = useCallback((files, type, excludeFilename, currentUserId) => {
    const filesToRemove = [];
    
    Object.keys(files).forEach((key) => {
      if (type === 'problem') {
        // 문제 파일 삭제: problem.html 또는 문제 HTML 파일 (프로필 파일 제외)
        const isProfileFile = currentUserId && key === `${currentUserId}.html`;
        if (
          key === "problem.html" ||
          (key.endsWith(".html") &&
            key !== "style.css" &&
            !isProfileFile &&
            key !== excludeFilename)
        ) {
          filesToRemove.push(key);
        }
      } else if (type === 'profile') {
        // 프로필 파일 삭제: profile.html 또는 유저 아이디 형식의 .html 파일
        const isProfileFile = key === "profile.html" ||
          (key.endsWith(".html") &&
           key !== "style.css" &&
           key !== "problem.html" &&
           /^[a-zA-Z0-9_]+\.html$/.test(key));
        
        if (isProfileFile && key !== excludeFilename) {
          filesToRemove.push(key);
        }
      }
    });
    
    return filesToRemove;
  }, []);

  // 파일 다운로드 함수
  const handleDownloadFile = useCallback((filename, content) => {
    if (!filename || content === undefined || content === null) {
      return;
    }

    try {
      const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      link.style.display = "none";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("파일 다운로드 오류:", error);
    }
  }, []);

  // Pyodide 초기화
  useEffect(() => {
    if (typeof window === "undefined" || pyodide || isPyodideReady) {
      return;
    }

    const existingScript = document.querySelector('script[src*="pyodide.js"]');
    if (existingScript) {
      if (window.loadPyodide && !pyodide) {
        window
          .loadPyodide({
            indexURL: "https://cdn.jsdelivr.net/pyodide/v0.24.1/full/",
            stdout: () => {},
            stderr: () => {},
          })
          .then((pyodideInstance) => {
            setPyodide(pyodideInstance);
            setIsPyodideReady(true);
          })
          .catch((error) => {
            console.error("Pyodide 로드 오류:", error);
          });
      }
      return;
    }

    const script = document.createElement("script");
    script.src = "https://cdn.jsdelivr.net/pyodide/v0.24.1/full/pyodide.js";
    script.async = true;
    script.id = "pyodide-script";

    let isLoaded = false;

    script.onload = async () => {
      if (isLoaded) return;
      isLoaded = true;

      try {
        if (window.loadPyodide && !pyodide) {
          const pyodideInstance = await window.loadPyodide({
            indexURL: "https://cdn.jsdelivr.net/pyodide/v0.24.1/full/",
            stdout: () => {},
            stderr: () => {},
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

  // 초기 테마 모드 로드 및 검증
  useEffect(() => {
    if (typeof window !== "undefined" && isInitialized && files["style.css"]) {
      const savedThemeMode = loadThemeMode();
      const savedLastKnownTheme = loadLastKnownTheme();
      const detectedMode = detectThemeMode(files["style.css"]);
      
      // 실제 내용과 저장된 테마 모드가 다르면 감지된 모드로 설정
      if (detectedMode !== savedThemeMode) {
        setThemeMode(detectedMode);
        saveThemeMode(detectedMode);
        // Custom이 아닌 경우 lastKnownTheme 업데이트
        if (detectedMode !== 'custom') {
          setLastKnownTheme(detectedMode);
          saveLastKnownTheme(detectedMode);
        } else {
          // Custom인 경우 저장된 lastKnownTheme 사용
          setLastKnownTheme(savedLastKnownTheme);
        }
      } else {
        setThemeMode(savedThemeMode);
        if (savedThemeMode !== 'custom') {
          setLastKnownTheme(savedThemeMode);
        } else {
          setLastKnownTheme(savedLastKnownTheme);
        }
      }
    }
  }, [isInitialized, files["style.css"]]);

  // 테마 로드 및 적용 (초기 로드 시 한 번만)
  useEffect(() => {
    if (typeof window !== "undefined" && isInitialized && files["style.css"]) {
      const savedTheme = loadTheme();
      if (savedTheme && savedTheme !== files["style.css"]) {
        setFiles((prev) => ({
          ...prev,
          "style.css": savedTheme,
        }));
      }
      applyCSSVariables(files["style.css"]);
    }
  }, [isInitialized]); // files 의존성 제거

  // style.css 변경 시 테마 적용 및 모드 감지
  useEffect(() => {
    if (files["style.css"]) {
      applyCSSVariables(files["style.css"]);
      saveTheme(files["style.css"]);
      
      // 테마 모드 자동 감지
      const detectedMode = detectThemeMode(files["style.css"]);
      if (detectedMode !== themeMode) {
        const prevMode = themeMode;
        setThemeMode(detectedMode);
        saveThemeMode(detectedMode);
        
        // Dark/Light → Custom 전환 시 마지막 테마 저장
        if (detectedMode === 'custom' && (prevMode === 'dark' || prevMode === 'light')) {
          setLastKnownTheme(prevMode);
          saveLastKnownTheme(prevMode);
        }
        // Custom → Dark/Light 전환 시 마지막 테마 업데이트
        else if (detectedMode !== 'custom' && prevMode === 'custom') {
          setLastKnownTheme(detectedMode);
          saveLastKnownTheme(detectedMode);
        }
        // Dark/Light 간 전환 시 마지막 테마 업데이트
        else if (detectedMode !== 'custom') {
          setLastKnownTheme(detectedMode);
          saveLastKnownTheme(detectedMode);
        }
      }
    }
  }, [files["style.css"]]);

  // 에디터 그룹 저장
  useEffect(() => {
    if (typeof window !== "undefined") {
      saveEditorGroups(editorGroups);
    }
  }, [editorGroups]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      saveActiveGroupId(activeGroupId);
    }
  }, [activeGroupId]);


  // 키보드 단축키
  useEffect(() => {
    const handleKeyDown = (e) => {
      const isMonacoFocused =
        document.activeElement &&
        (document.activeElement.closest(".monaco-editor") ||
          document.activeElement.closest(".monaco-textarea") ||
          document.activeElement.classList.contains("monaco-inputbox"));

      if (isMonacoFocused) {
        // Ctrl+Z (undo), Ctrl+Shift+Z (redo), Ctrl+Y (redo)는 Monaco Editor가 처리
        if (
          e.ctrlKey &&
          (e.key === "z" || e.key === "Z" || e.key === "y" || e.key === "Y")
        ) {
          return;
        }
        // Ctrl+Shift+Z (redo) 명시적으로 허용
        if (e.ctrlKey && e.shiftKey && (e.key === "z" || e.key === "Z")) {
          return;
        }

        if (e.ctrlKey && e.key === "s") {
          e.preventDefault();
          const activeGroup = editorGroups.find((g) => g.id === activeGroupId);
          if (activeGroup && activeGroup.activeTab) {
            const filename = activeGroup.activeTab;
            const editorKey = `${activeGroupId}-${filename}`;
            const activeEditor = editorRefs.current[editorKey] || editorRefs.current[activeGroupId];
            if (activeEditor) {
              const content = activeEditor.getValue();
              updateFile(filename, content);

              // 코드 파일인 경우 다운로드
              if (isCodeFile(filename)) {
                handleDownloadFile(filename, content);
              }
            }
          }
          return;
        }

        return;
      }

      if (e.ctrlKey && e.key === "s") {
        e.preventDefault();
        const activeGroup = editorGroups.find((g) => g.id === activeGroupId);
        if (activeGroup && activeGroup.activeTab) {
          const filename = activeGroup.activeTab;
          const editorKey = `${activeGroupId}-${filename}`;
          const activeEditor = editorRefs.current[editorKey] || editorRefs.current[activeGroupId];
          if (activeEditor) {
            const content = activeEditor.getValue();
            updateFile(filename, content);

            // 코드 파일인 경우 다운로드
            if (isCodeFile(filename)) {
              handleDownloadFile(filename, content);
            }
          }
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeGroupId, editorGroups, files, updateFile, handleDownloadFile]);

  // 터미널 접기/펼치기 핸들러
  const handleTerminalCollapse = useCallback((collapsed) => {
    setIsTerminalCollapsed(collapsed);
    const terminal = document.getElementById("terminal-container");
    if (!terminal) return;

    if (collapsed) {
      // 닫힐 때: 현재 높이를 저장하고 헤더 높이(30px)로 설정
      const currentHeight = parseInt(terminal.style.height) || 300;
      previousTerminalHeightRef.current = currentHeight;
      terminal.style.height = "30px";
    } else {
      // 열릴 때: 저장된 높이로 복원 (없으면 300px)
      const restoredHeight = previousTerminalHeightRef.current || 300;
      terminal.style.height = restoredHeight + "px";
    }
  }, []);

  // 터미널 리사이즈
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isResizingRef.current || isTerminalCollapsed) return;
      const container = document.getElementById("editor-container");
      if (!container) return;
      const containerHeight = container.clientHeight;
      const mouseY = e.clientY;
      const containerTop = container.getBoundingClientRect().top;
      const newTerminalHeight = containerHeight - (mouseY - containerTop);
      const terminal = document.getElementById("terminal-container");
      if (
        terminal &&
        newTerminalHeight > 100 &&
        newTerminalHeight < containerHeight - 100
      ) {
        terminal.style.height = newTerminalHeight + "px";
      }
    };

    const handleMouseUp = () => {
      if (isResizingRef.current) {
        document.body.style.cursor = "";
        document.body.style.userSelect = "";
        isResizingRef.current = false;
      }
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isTerminalCollapsed]);

  const handleOpenFile = (filename) => {
    openFile(filename);

    setEditorGroups((groups) =>
      groups.map((group) => {
        if (group.id === activeGroupId) {
          const newTabs = group.tabs.includes(filename)
            ? group.tabs
            : [...group.tabs, filename];
          return { ...group, tabs: newTabs, activeTab: filename };
        }
        return group;
      })
    );
  };

  // 빈 그룹 삭제 후 처리 헬퍼 함수
  const handleEmptyGroupCleanup = (groups, deletedGroupId) => {
    if (groups.length === 0) {
      return [
        { id: 0, tabs: ["파이쑝.py"], activeTab: "파이쑝.py", width: "100%" },
      ];
    }

    // 삭제된 그룹이 활성 그룹이었으면 다른 그룹 활성화
    if (activeGroupId === deletedGroupId) {
      const nextGroup = groups[0];
      setActiveGroupId(nextGroup.id);
      setCurrentFile(nextGroup.activeTab);
    }

    // 그룹이 1개만 남으면 너비를 100%로
    if (groups.length === 1) {
      groups[0].width = "100%";
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
      if (
        insertIndex === null ||
        insertIndex === undefined ||
        insertIndex < 0
      ) {
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
      if (
        insertIndex === null ||
        insertIndex === undefined ||
        insertIndex < 0
      ) {
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

    setEditorGroups((groups) => {
      const targetGroup = groups.find((g) => g.id === groupId);
      if (!targetGroup) return groups;

      const updatedGroups = groups
        .map((group) => {
          if (group.id === groupId) {
            const newTabs = group.tabs.filter((tab) => tab !== filename);

            // 탭이 없으면 null 반환 (나중에 필터링)
            if (newTabs.length === 0) {
              return null;
            }

            const currentIndex = group.tabs.indexOf(filename);
            const nextFile =
              newTabs[currentIndex === 0 ? 0 : currentIndex - 1] || newTabs[0];

            return { ...group, tabs: newTabs, activeTab: nextFile };
          }
          return group;
        })
        .filter((group) => group !== null);

      // 빈 그룹이 삭제된 경우 처리
      if (updatedGroups.length < groups.length) {
        return handleEmptyGroupCleanup(updatedGroups, groupId);
      }

      return updatedGroups;
    });

    const newTabs = openTabs.filter((tab) => tab !== filename);
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

    setEditorGroups((groups) => {
      const newGroups = groups
        .map((group) => {
          if (group.id === item.groupId) {
            // 원본 그룹에서 탭 제거
            const newTabs = group.tabs.filter((tab) => tab !== item.filename);
            // 탭이 없으면 null 반환 (나중에 필터링)
            if (newTabs.length === 0) {
              return null;
            }
            const nextActiveTab = newTabs[0] || null;
            return { ...group, tabs: newTabs, activeTab: nextActiveTab };
          } else if (group.id === targetGroupId) {
            // 대상 그룹에 탭 추가
            const newTabs = insertTabAtIndex(
              group.tabs,
              item.filename,
              insertIndex
            );
            return { ...group, tabs: newTabs, activeTab: item.filename };
          }
          return group;
        })
        .filter((group) => group !== null);

      // 빈 그룹이 삭제된 경우 처리
      if (newGroups.length < groups.length) {
        if (newGroups.length === 0) {
          // 그룹이 하나도 없으면 기본 그룹 생성 (드롭된 탭 포함)
          const defaultGroup = [
            {
              id: 0,
              tabs: [item.filename],
              activeTab: item.filename,
              width: "100%",
            },
          ];
          setActiveGroupId(0);
          setCurrentFile(item.filename);
          return defaultGroup;
        }

        // 삭제된 그룹이 활성 그룹이었으면 대상 그룹 활성화
        const wasActiveGroup = activeGroupId === item.groupId;
        const cleanedGroups = handleEmptyGroupCleanup(newGroups, item.groupId);

        if (wasActiveGroup) {
          const nextGroup =
            cleanedGroups.find((g) => g.id === targetGroupId) ||
            cleanedGroups[0];
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
    setEditorGroups((groups) => {
      return groups.map((group) => {
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

    setEditorGroups((groups) =>
      groups.map((group) => {
        if (group.id === targetGroupId) {
          // 파일이 이미 있으면 순서만 변경, 없으면 새로 추가
          const newTabs = insertTabAtIndex(group.tabs, filename, insertIndex);
          return { ...group, tabs: newTabs, activeTab: filename };
        }
        return group;
      })
    );

    setCurrentFile(filename);
    setActiveGroupId(targetGroupId);
  };

  const handleNewGroupDrop = (item) => {
    if (editorGroups.length >= 2) return;

    const filename = item.filename;

    // 안전한 그룹 ID 생성
    const maxId =
      editorGroups.length > 0 ? Math.max(...editorGroups.map((g) => g.id)) : -1;
    const newGroupId = maxId + 1;

    setEditorGroups((groups) => {
      const newGroups = groups.map((group) => ({
        ...group,
        width: "50%",
      }));

      // 탭인 경우에만 원본 그룹에서 제거
      if (item.type === "tab" && item.groupId !== undefined) {
        const sourceGroupIndex = newGroups.findIndex(
          (g) => g.id === item.groupId
        );
        if (sourceGroupIndex !== -1) {
          const sourceGroup = newGroups[sourceGroupIndex];
          const newTabs = sourceGroup.tabs.filter((tab) => tab !== filename);

          // 빈 그룹이 되는 경우 처리
          if (newTabs.length === 0) {
            // 빈 그룹은 제거하지 않고 유지 (새 그룹이 생성되므로)
            // 하지만 실제로는 새 그룹이 생성되므로 빈 그룹을 제거해야 함
            newGroups.splice(sourceGroupIndex, 1);
          } else {
            const nextActiveTab = newTabs[0] || null;
            newGroups[sourceGroupIndex] = {
              ...sourceGroup,
              tabs: newTabs,
              activeTab: nextActiveTab,
            };
          }
        }
      }

      // 새 그룹 추가
      newGroups.push({
        id: newGroupId,
        tabs: [filename],
        activeTab: filename,
        width: "50%",
      });

      // 그룹이 1개만 남은 경우 너비 조정
      if (newGroups.length === 1) {
        newGroups[0].width = "100%";
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

  const handleGroupResize = useCallback(
    (leftGroupId, rightGroupId, leftPercent, rightPercent) => {
      setEditorGroups((groups) =>
        groups.map((group) => {
          if (group.id === leftGroupId) {
            return { ...group, width: `${leftPercent}%` };
          } else if (group.id === rightGroupId) {
            return { ...group, width: `${rightPercent}%` };
          }
          return group;
        })
      );
    },
    []
  );

  const handleEditorChange = useCallback((value, groupId) => {
    if (value !== undefined) {
      const group = editorGroups.find((g) => g.id === groupId);
      if (group && group.activeTab) {
        updateFile(group.activeTab, value);

        if (group.activeTab === "style.css") {
          applyCSSVariables(value);
        }
      }
    }
  }, [editorGroups, updateFile]);

  const handleEditorMount = useCallback((editor, groupId, filename) => {
    const editorKey = `${groupId}-${filename}`;
    editorRefs.current[editorKey] = editor;
    // 기존 그룹별 참조도 유지 (하위 호환성)
    editorRefs.current[groupId] = editor;

    if (groupId === activeGroupId) {
      editor.focus();
    }

    if (window.monaco && files["style.css"]) {
      applyCSSVariables(files["style.css"]);
    }

    editor.onDidChangeCursorPosition((e) => {
      const position = e.position;
      const group = editorGroups.find((g) => g.id === groupId);
      if (group && group.id === activeGroupId && group.activeTab === filename) {
        setCursorPosition(`Ln ${position.lineNumber}, Col ${position.column}`);
      }
    });
  }, [activeGroupId, editorGroups, files]);

  const handleRunCode = async () => {
    const activeGroup = editorGroups.find((g) => g.id === activeGroupId);
    if (!activeGroup || !activeGroup.activeTab) {
      setOutput("실행할 파일이 없습니다.");
      setOutputStatus(null);
      return;
    }

    const fileToRun = activeGroup.activeTab;
    const code = files[fileToRun] || "";

    if (!code.trim()) {
      setOutput("실행할 코드가 없습니다.");
      setOutputStatus(null);
      return;
    }

    const language = getLanguageFromFile(fileToRun);
    const inputText = files["input.txt"] || "";

    setIsRunning(true);
    setOutput("");
    setOutputStatus(null); // 실행 시작 시 초기화

    try {
      if (language === "python") {
        const result = await runPythonCode(code, inputText, pyodide);
        setOutput(escapeHtml(result));
        setOutputStatus('success'); // 성공
      } else if (language === "javascript") {
        const result = await runJavaScriptCode(code, inputText);
        setOutput(escapeHtml(result));
        setOutputStatus('success'); // 성공
      } else if (language === "cpp") {
        const result = await runCppCode(code, inputText);
        setOutput(escapeHtml(result));
        setOutputStatus('success'); // 성공
      } else if (language === "c") {
        const result = await runCCode(code, inputText);
        setOutput(escapeHtml(result));
        setOutputStatus('success'); // 성공
      } else if (language === "java") {
        const result = await runJavaCode(code, inputText);
        setOutput(escapeHtml(result));
        setOutputStatus('success'); // 성공
      } else {
        setOutput(`${language} 언어는 실행을 지원하지 않습니다.`);
        setOutputStatus(null);
      }
    } catch (error) {
      setOutput(`<div class="output-error">${escapeHtml(error.message)}</div>`);
      setOutputStatus('error'); // 에러
    } finally {
      setIsRunning(false);
    }
  };

  const handleLoadProblem = async () => {
    if (!problemNumber.trim()) {
      alert("문제 번호를 입력하세요.");
      return;
    }

    setIsLoadingProblem(true);

    try {
      const response = await fetch("/api/crawl-problem", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ problemId: problemNumber.trim() }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "문제를 가져오는데 실패했습니다.");
      }

      const data = await response.json();

      if (data.success && data.problemHtml) {
        // 문제 이름으로 파일명 변경 (특수문자 제거)
        const problemTitle = (data.problemInfo.title || `문제 ${problemNumber}`)
          .replace(/[<>:"/\\|?*]/g, "_")
          .trim();
        const problemFilename = `${problemTitle}.html`;

        // 함수형 업데이트로 기존 파일 유지
        setFiles((prev) => {
          const newFiles = { ...prev };

          // 기존 문제 HTML 파일 삭제
          const filesToRemove = removeOldHtmlFiles(newFiles, 'problem', problemFilename, currentUserId);
          filesToRemove.forEach(key => {
            // 탭에서도 제거
            setOpenTabs((prev) => prev.filter((tab) => tab !== key));
            // 그룹에서도 제거
            setEditorGroups((groups) =>
              groups.map((group) => ({
                ...group,
                tabs: group.tabs.filter((tab) => tab !== key),
                activeTab:
                  group.activeTab === key
                    ? group.tabs.find((t) => t !== key) || null
                    : group.activeTab,
              }))
            );
            delete newFiles[key];
          });

          newFiles[problemFilename] = data.problemHtml;

          // 예제 입력 1을 input.txt에 자동으로 넣기
          if (
            data.problemInfo &&
            data.problemInfo.sampleInputs &&
            data.problemInfo.sampleInputs.length > 0
          ) {
            const firstSampleInput = data.problemInfo.sampleInputs[0].trim();
            newFiles["input.txt"] = firstSampleInput;
          }

          return newFiles;
        });
        setCurrentProblemNumber(problemNumber.trim());

        // 문제 가져오기 성공 시에만 문제 번호 저장
        saveProblemNumber(problemNumber.trim());
        
        // 문제 정보 저장
        if (data.problemInfo) {
          saveProblemInfo(data.problemInfo);
        }

        // 문제 파일 열기
        if (!openTabs.includes(problemFilename)) {
          setOpenTabs([...openTabs, problemFilename]);
        }

        setEditorGroups((groups) =>
          groups.map((group) => {
            if (group.id === activeGroupId) {
              const newTabs = group.tabs.includes(problemFilename)
                ? group.tabs
                : [...group.tabs, problemFilename];
              return { ...group, tabs: newTabs, activeTab: problemFilename };
            }
            return group;
          })
        );

        setCurrentFile(problemFilename);

        alert(`문제 ${problemNumber} 정보를 가져왔습니다! (solved.ac 제공)`);
      } else {
        throw new Error("문제 정보를 가져올 수 없습니다.");
      }
    } catch (error) {
      console.error("문제 가져오기 오류:", error);
      alert("문제를 가져올 수 없습니다. 번호를 확인하세요.");
    } finally {
      setIsLoadingProblem(false);
    }
  };

  const handleLoadProfile = async () => {
    if (!userId.trim()) {
      alert("유저 아이디를 입력하세요.");
      return;
    }

    setIsLoadingProfile(true);

    try {
      const response = await fetch("/api/crawl-userprofile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ handle: userId.trim() }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "프로필을 가져오는데 실패했습니다.");
      }

      const data = await response.json();

      if (data.success && data.profileHtml) {
        // 유저 아이디로 파일명 변경
        const profileFilename = `${userId.trim()}.html`;

        // 함수형 업데이트로 기존 파일 유지
        setFiles((prev) => {
          const newFiles = { ...prev };

          // 기존 프로필 HTML 파일 삭제 (수동 로드: 파일 + 탭 + 그룹 모두 정리)
          const filesToRemove = removeOldHtmlFiles(newFiles, 'profile', profileFilename, currentUserId);
          filesToRemove.forEach(key => {
            // 탭에서도 제거
            setOpenTabs((prev) => prev.filter((tab) => tab !== key));
            // 그룹에서도 제거
            setEditorGroups((groups) =>
              groups.map((group) => ({
                ...group,
                tabs: group.tabs.filter((tab) => tab !== key),
                activeTab:
                  group.activeTab === key
                    ? group.tabs.find((t) => t !== key) || null
                    : group.activeTab,
              }))
            );
            delete newFiles[key];
          });

          newFiles[profileFilename] = data.profileHtml;

          return newFiles;
        });
        setCurrentUserId(userId.trim());
        
        // 프로필 가져오기 성공 시에만 유저 아이디 저장
        saveUserId(userId.trim());
        
        // 프로필 정보 저장
        if (data.profileInfo) {
          saveProfileInfo(data.profileInfo);
        }

        // 프로필 파일 열기
        if (!openTabs.includes(profileFilename)) {
          setOpenTabs([...openTabs, profileFilename]);
        }

        setEditorGroups((groups) =>
          groups.map((group) => {
            if (group.id === activeGroupId) {
              const newTabs = group.tabs.includes(profileFilename)
                ? group.tabs
                : [...group.tabs, profileFilename];
              return { ...group, tabs: newTabs, activeTab: profileFilename };
            }
            return group;
          })
        );

        setCurrentFile(profileFilename);

        alert(`프로필 정보를 가져왔습니다! (solved.ac 제공)`);
      } else {
        throw new Error("프로필 정보를 가져올 수 없습니다.");
      }
    } catch (error) {
      console.error("프로필 갱신 오류:", error);
      alert("프로필 정보를 가져올 수 없습니다. 아이디를 확인하세요.");
    } finally {
      setIsLoadingProfile(false);
    }
  };

  const handleSubmitToBOJ = async () => {
    if (!currentProblemNumber.trim()) {
      alert("문제 번호를 입력하세요.");
      return;
    }

    const activeGroup = editorGroups.find((g) => g.id === activeGroupId);
    if (!activeGroup || !activeGroup.activeTab) {
      alert("코드를 작성해주세요.");
      return;
    }
    const editorKey = `${activeGroupId}-${activeGroup.activeTab}`;
    const activeEditor = editorRefs.current[editorKey] || editorRefs.current[activeGroupId];
    if (!activeEditor) {
      alert("코드를 작성해주세요.");
      return;
    }

    const code = activeEditor.getValue();
    if (!code.trim()) {
      alert("복사할 코드 파일 탭을 열어주세요.");
      return;
    }

    setIsSubmitting(true);

    try {
      await navigator.clipboard.writeText(code);

      alert(
        `코드가 클립보드에 복사되었습니다!\n\n확인 버튼을 누르면 백준 제출 페이지로 이동합니다.\n코드 입력란에 Ctrl+V로 붙여넣으세요.`
      );

      const problemUrl = `https://www.acmicpc.net/submit/${currentProblemNumber}`;
      window.open(problemUrl, "_blank");

      setIsSubmitting(false);
    } catch (error) {
      console.error("클립보드 복사 실패:", error);

      const problemUrl = `https://www.acmicpc.net/submit/${currentProblemNumber}`;

      alert(
        `클립보드 복사에 실패했습니다.\n\n확인 버튼을 누르면 코드가 표시된 새 창과 백준 제출 페이지가 열립니다.`
      );

      const root = document.documentElement;
      const bgPrimary = getComputedStyle(root)
        .getPropertyValue("--color-bg-main")
        .trim();
      const bgSecondary = getComputedStyle(root)
        .getPropertyValue("--color-bg-sidebar")
        .trim();
      const bgTertiary = getComputedStyle(root)
        .getPropertyValue("--color-bg-header")
        .trim();
      const textPrimary = getComputedStyle(root)
        .getPropertyValue("--color-text-primary")
        .trim();
      const fileSpecialColor = getComputedStyle(root)
        .getPropertyValue("--color-accent-file")
        .trim();

      const codeWindow = window.open("", "_blank");
      codeWindow.document.write(`
        <html>
          <head>
            <title>백준 제출용 코드 - 문제 ${currentProblemNumber}</title>
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
              <h2>백준 문제 ${currentProblemNumber} 제출용 코드</h2>
              <p>아래 코드를 복사하여 <a href="${problemUrl}" target="_blank">백준 제출 페이지</a>에 붙여넣으세요.</p>
            </div>
            <pre>${escapeHtml(code)}</pre>
            <div class="info">
              <button onclick="navigator.clipboard.writeText(\`${code
                .replace(/`/g, "\\`")
                .replace(/\$/g, "\\$")}\`)">코드 복사</button>
            </div>
          </body>
        </html>
      `);

      window.open(problemUrl, "_blank");

      setIsSubmitting(false);
    }
  };


  /**
   * 테마 토글 함수 (dark ↔ light)
   * Custom 상태에서는 마지막으로 알려진 테마로 복원
   */
  const handleThemeToggle = () => {
    let nextMode;
    
    if (themeMode === 'custom') {
      // Custom 상태에서는 마지막으로 알려진 테마로 복원
      nextMode = lastKnownTheme === 'light' ? 'light' : 'dark';
    } else if (themeMode === 'dark') {
      nextMode = 'light';
    } else {
      nextMode = 'dark';
    }

    setThemeMode(nextMode);
    saveThemeMode(nextMode);
    setLastKnownTheme(nextMode);
    saveLastKnownTheme(nextMode);

    // dark 또는 light로 전환 시 해당 스켈레톤 코드로 style.css 업데이트
    const newTheme = themeTemplates[nextMode];
    updateFile("style.css", newTheme);
    applyCSSVariables(newTheme);

    // 에디터에 반영
    const styleCssGroup = editorGroups.find((g) => g.activeTab === "style.css");
    if (styleCssGroup) {
      const editorKey = `${styleCssGroup.id}-style.css`;
      const editor = editorRefs.current[editorKey] || editorRefs.current[styleCssGroup.id];
      if (editor) {
        editor.setValue(newTheme);
      }
    }
  };

  const handleResetTheme = () => {
    // 항상 Dark 테마로 리셋
    const defaultTheme = themeTemplates.dark;
    updateFile("style.css", defaultTheme);
    applyCSSVariables(defaultTheme);
    setThemeMode('dark');
    saveThemeMode('dark');
    setLastKnownTheme('dark');
    saveLastKnownTheme('dark');

    const styleCssGroup = editorGroups.find((g) => g.activeTab === "style.css");
    if (styleCssGroup) {
      const editorKey = `${styleCssGroup.id}-style.css`;
      const editor = editorRefs.current[editorKey] || editorRefs.current[styleCssGroup.id];
      if (editor) {
        editor.setValue(defaultTheme);
      }
    }
  };

  const handleTabClick = (filename, groupId) => {
    setCurrentFile(filename);
    setActiveGroupId(groupId);
    setEditorGroups((groups) =>
      groups.map((g) => (g.id === groupId ? { ...g, activeTab: filename } : g))
    );
  };

  const handleEditorClick = (filename, groupId) => {
    setCurrentFile(filename);
    setActiveGroupId(groupId);
  };

  const handleTabDoubleClick = (filename) => {
    if (filename && filename.endsWith(".html") && currentUserId && filename === `${currentUserId}.html`) {
      setProfileHtmlViewMode(!profileHtmlViewMode);
    } else if (filename && filename.endsWith(".html")) {
      setProblemHtmlViewMode(!problemHtmlViewMode);
    }
  };

  const handleResizeStart = () => {
    // 닫혀있을 때는 리사이즈 비활성화
    if (isTerminalCollapsed) return;
    
    isResizingRef.current = true;
    document.body.style.cursor = "ns-resize";
    document.body.style.userSelect = "none";
  };

  const activeGroup = editorGroups.find((g) => g.id === activeGroupId);
  const activeFile = activeGroup?.activeTab || currentFile;
  const language = getLanguageFromFile(activeFile);

  // 모바일 화면일 때 안내 문구만 표시
  if (isMobile) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: "100%",
          height: "100vh",
          backgroundColor: "var(--color-bg-main)",
          color: "var(--color-text-primary)",
          fontSize: "16px",
          textAlign: "center",
          padding: "20px",
        }}
      >
        <div>
          KS Code Editor는 모바일을 지원하지 않습니다.
          <br />
          데스크탑을 이용해주세요.
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        width: "100%",
        maxWidth: "100%",
        height: "100%",
        overflow: "hidden",
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        margin: "0 auto",
      }}
    >
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

      <div
        style={{
          display: "flex",
          flex: 1,
          overflow: "hidden",
          minWidth: 0,
          minHeight: 0,
        }}
      >
        <div
          style={{
            width: "200px",
            minWidth: "200px",
            maxWidth: "200px",
            flexShrink: 0,
            backgroundColor: "var(--color-bg-sidebar)",
            borderRight: "1px solid var(--color-border-default)",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div
            style={{
              padding: "10px",
              fontSize: "11px",
              fontWeight: 600,
              textTransform: "uppercase",
              color: "var(--color-text-primary)",
              borderBottom: "1px solid var(--color-border-default)",
            }}
          >
            Explorer
          </div>
          <FileExplorer
            files={files}
            currentFile={currentFile}
            onFileClick={handleOpenFile}
            currentThemeMode={themeMode}
            onThemeToggle={handleThemeToggle}
          />
        </div>

        <div
          id="editor-container"
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            backgroundColor: "var(--color-bg-main)",
            position: "relative",
            minWidth: 0,
            minHeight: 0,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "row",
              position: "relative",
              zIndex: 1,
              flex: 1,
              minHeight: 0,
              overflow: "hidden",
            }}
          >
            {/* 새 그룹 생성 영역 */}
            <NewGroupDropZone
              onDrop={handleNewGroupDrop}
              isVisible={editorGroups.length === 1}
            />

            {editorGroups.map((group, groupIndex) => (
              <Fragment key={group.id}>
                <EditorGroup
                  currentUserId={currentUserId}
                  currentProblemNumber={currentProblemNumber}
                  currentThemeMode={themeMode}
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
                  profileHtmlViewMode={profileHtmlViewMode}
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
              height: "4px",
              backgroundColor: "var(--color-border-default)",
              cursor: isTerminalCollapsed ? "default" : "ns-resize",
              position: "relative",
              pointerEvents: isTerminalCollapsed ? "none" : "auto",
            }}
            id="resize-handle"
            onMouseDown={handleResizeStart}
          />

          <div
            id="terminal-container"
            style={{
              height: "300px",
              display: "flex",
              flexDirection: "column",
              backgroundColor: "var(--color-bg-main)",
              borderTop: "1px solid var(--color-border-default)",
            }}
          >
            <OutputPanel
              output={output}
              isRunning={isRunning}
              onRunCode={handleRunCode}
              onCollapseChange={handleTerminalCollapse}
              outputStatus={outputStatus}
            />
          </div>
        </div>
      </div>

      <StatusBar cursorPosition={cursorPosition} language={language} filename={activeFile} />
    </div>
  );
}
