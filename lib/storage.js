/**
 * localStorage 유틸리티 함수
 */

import { isCodeFile } from './fileManager';

const STORAGE_KEYS = {
  THEME: 'kscode_theme',
  THEME_MODE: 'kscode_theme_mode',
  LAST_KNOWN_THEME: 'kscode_last_known_theme',
  PROBLEM_NUMBER: 'kscode_problem_number',
  USER_ID: 'kscode_user_id',
  FILES: 'kscode_files',
  CURRENT_FILE: 'kscode_current_file',
  OPEN_TABS: 'kscode_open_tabs',
  EDITOR_GROUPS: 'kscode_editor_groups',
  ACTIVE_GROUP_ID: 'kscode_active_group_id',
  MUSIC: 'kscode_music',
  PROBLEM_INFO: 'kscode_problem_info',
  PROFILE_INFO: 'kscode_profile_info',
  CHATBOT_MESSAGES: 'kscode_chatbot_messages',
  CHATBOT_SETTINGS: 'kscode_chatbot',
};

/**
 * localStorage 에러 핸들러
 * @param {Error} error - 에러 객체
 * @param {string} operation - 작업 설명
 */
function handleStorageError(error, operation) {
  console.error(`${operation} 실패:`, error);
}

/**
 * localStorage 래퍼 함수
 * @param {Function} operation - 실행할 localStorage 작업
 * @param {string} operationName - 작업 이름
 * @returns {*} 작업 결과
 */
function localStorageWrapper(operation, operationName) {
  try {
    return operation();
  } catch (error) {
    handleStorageError(error, operationName);
    return null;
  }
}

/**
 * 테마 저장
 * @param {string} theme - CSS 테마 내용
 */
export function saveTheme(theme) {
  localStorageWrapper(() => {
    localStorage.setItem(STORAGE_KEYS.THEME, theme);
  }, '테마 저장');
}

/**
 * 테마 로드
 * @returns {string|null} 저장된 테마 또는 null
 */
export function loadTheme() {
  return localStorageWrapper(() => {
    return localStorage.getItem(STORAGE_KEYS.THEME);
  }, '테마 로드');
}

/**
 * 테마 모드 저장
 * @param {string} themeMode - 테마 모드 ('dark', 'light', 'custom')
 */
export function saveThemeMode(themeMode) {
  localStorageWrapper(() => {
    localStorage.setItem(STORAGE_KEYS.THEME_MODE, themeMode);
  }, '테마 모드 저장');
}

/**
 * 테마 모드 로드
 * @returns {string} 저장된 테마 모드 또는 'dark' (기본값)
 */
export function loadThemeMode() {
  return localStorageWrapper(() => {
    return localStorage.getItem(STORAGE_KEYS.THEME_MODE) || 'dark';
  }, '테마 모드 로드');
}

/**
 * 마지막으로 알려진 테마 저장 (Custom 전에 Dark 또는 Light였던 것)
 * @param {string} theme - 테마 ('dark' 또는 'light')
 */
export function saveLastKnownTheme(theme) {
  localStorageWrapper(() => {
    if (theme === 'dark' || theme === 'light') {
      localStorage.setItem(STORAGE_KEYS.LAST_KNOWN_THEME, theme);
    }
  }, '마지막 테마 저장');
}

/**
 * 마지막으로 알려진 테마 로드
 * @returns {string} 저장된 마지막 테마 또는 'dark' (기본값)
 */
export function loadLastKnownTheme() {
  return localStorageWrapper(() => {
    return localStorage.getItem(STORAGE_KEYS.LAST_KNOWN_THEME) || 'dark';
  }, '마지막 테마 로드');
}

/**
 * 문제 번호 저장
 * @param {string} problemNumber - 문제 번호
 */
export function saveProblemNumber(problemNumber) {
  localStorageWrapper(() => {
    localStorage.setItem(STORAGE_KEYS.PROBLEM_NUMBER, problemNumber);
  }, '문제 번호 저장');
}

/**
 * 문제 번호 로드
 * @returns {string|null} 저장된 문제 번호 또는 null
 */
export function loadProblemNumber() {
  return localStorageWrapper(() => {
    return localStorage.getItem(STORAGE_KEYS.PROBLEM_NUMBER);
  }, '문제 번호 로드');
}

/**
 * 파일들 저장 (코드 파일만 저장)
 * @param {Object} files - 파일 객체
 */
export function saveFiles(files) {
  localStorageWrapper(() => {
    const codeFiles = {};
    Object.keys(files).forEach(filename => {
      if (isCodeFile(filename)) {
        codeFiles[filename] = files[filename];
      }
    });
    if (Object.keys(codeFiles).length > 0) {
      localStorage.setItem(STORAGE_KEYS.FILES, JSON.stringify(codeFiles));
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('localStorageChange', {
          detail: { key: STORAGE_KEYS.FILES }
        }));
      }
    }
  }, '파일 저장');
}

/**
 * 파일들 로드
 * @returns {Object|null} 저장된 파일 객체 또는 null
 */
export function loadFiles() {
  return localStorageWrapper(() => {
    const files = localStorage.getItem(STORAGE_KEYS.FILES);
    return files ? JSON.parse(files) : null;
  }, '파일 로드');
}

/**
 * 현재 파일 저장
 * @param {string} filename - 현재 파일명
 */
export function saveCurrentFile(filename) {
  localStorageWrapper(() => {
    localStorage.setItem(STORAGE_KEYS.CURRENT_FILE, filename);
  }, '현재 파일 저장');
}

/**
 * 현재 파일 로드
 * @returns {string|null} 저장된 현재 파일명 또는 null
 */
export function loadCurrentFile() {
  return localStorageWrapper(() => {
    return localStorage.getItem(STORAGE_KEYS.CURRENT_FILE);
  }, '현재 파일 로드');
}

/**
 * 열린 탭들 저장
 * @param {string[]} tabs - 탭 배열
 */
export function saveOpenTabs(tabs) {
  localStorageWrapper(() => {
    localStorage.setItem(STORAGE_KEYS.OPEN_TABS, JSON.stringify(tabs));
  }, '열린 탭 저장');
}

/**
 * 열린 탭들 로드
 * @returns {string[]|null} 저장된 탭 배열 또는 null
 */
export function loadOpenTabs() {
  return localStorageWrapper(() => {
    const tabs = localStorage.getItem(STORAGE_KEYS.OPEN_TABS);
    return tabs ? JSON.parse(tabs) : null;
  }, '열린 탭 로드');
}

/**
 * 에디터 그룹 저장
 * @param {Array} groups - 에디터 그룹 배열
 */
export function saveEditorGroups(groups) {
  localStorageWrapper(() => {
    localStorage.setItem(STORAGE_KEYS.EDITOR_GROUPS, JSON.stringify(groups));
  }, '에디터 그룹 저장');
}

/**
 * 에디터 그룹 로드
 * @returns {Array|null} 저장된 에디터 그룹 배열 또는 null
 */
export function loadEditorGroups() {
  return localStorageWrapper(() => {
    const groups = localStorage.getItem(STORAGE_KEYS.EDITOR_GROUPS);
    return groups ? JSON.parse(groups) : null;
  }, '에디터 그룹 로드');
}

/**
 * 활성 그룹 ID 저장
 * @param {number} groupId - 활성 그룹 ID
 */
export function saveActiveGroupId(groupId) {
  localStorageWrapper(() => {
    localStorage.setItem(STORAGE_KEYS.ACTIVE_GROUP_ID, String(groupId));
  }, '활성 그룹 ID 저장');
}

/**
 * 활성 그룹 ID 로드
 * @returns {number|null} 저장된 활성 그룹 ID 또는 null
 */
export function loadActiveGroupId() {
  return localStorageWrapper(() => {
    const id = localStorage.getItem(STORAGE_KEYS.ACTIVE_GROUP_ID);
    return id ? parseInt(id, 10) : null;
  }, '활성 그룹 ID 로드');
}

/**
 * 유저 아이디 저장
 * @param {string} userId - 유저 아이디
 */
export function saveUserId(userId) {
  localStorageWrapper(() => {
    localStorage.setItem(STORAGE_KEYS.USER_ID, userId);
  }, '유저 아이디 저장');
}

/**
 * 유저 아이디 로드
 * @returns {string|null} 저장된 유저 아이디 또는 null
 */
export function loadUserId() {
  return localStorageWrapper(() => {
    return localStorage.getItem(STORAGE_KEYS.USER_ID);
  }, '유저 아이디 로드');
}

/**
 * 음악 상태 저장 (현재 트랙 인덱스만 저장)
 * @param {number} trackIndex - 현재 트랙 인덱스
 */
export function saveMusicState(trackIndex) {
  localStorageWrapper(() => {
    localStorage.setItem(STORAGE_KEYS.MUSIC, JSON.stringify({ trackIndex }));
  }, '음악 상태 저장');
}

/**
 * 음악 상태 로드
 * @returns {{ trackIndex: number }|null} 저장된 음악 상태 또는 null
 */
export function loadMusicState() {
  return localStorageWrapper(() => {
    const musicState = localStorage.getItem(STORAGE_KEYS.MUSIC);
    if (musicState) {
      const parsed = JSON.parse(musicState);
      return {
        trackIndex: typeof parsed.trackIndex === 'number' ? parsed.trackIndex : 0,
      };
    }
    return null;
  }, '음악 상태 로드');
}

/**
 * 문제 정보 저장
 * @param {Object} problemInfo - 문제 정보 객체
 */
export function saveProblemInfo(problemInfo) {
  localStorageWrapper(() => {
    localStorage.setItem(STORAGE_KEYS.PROBLEM_INFO, JSON.stringify(problemInfo));
  }, '문제 정보 저장');
}

/**
 * 문제 정보 로드
 * @returns {Object|null} 저장된 문제 정보 또는 null
 */
export function loadProblemInfo() {
  return localStorageWrapper(() => {
    const problemInfo = localStorage.getItem(STORAGE_KEYS.PROBLEM_INFO);
    return problemInfo ? JSON.parse(problemInfo) : null;
  }, '문제 정보 로드');
}

/**
 * 프로필 정보 저장
 * @param {Object} profileInfo - 프로필 정보 객체
 */
export function saveProfileInfo(profileInfo) {
  localStorageWrapper(() => {
    localStorage.setItem(STORAGE_KEYS.PROFILE_INFO, JSON.stringify(profileInfo));
  }, '프로필 정보 저장');
}

/**
 * 프로필 정보 로드
 * @returns {Object|null} 저장된 프로필 정보 또는 null
 */
export function loadProfileInfo() {
  return localStorageWrapper(() => {
    const profileInfo = localStorage.getItem(STORAGE_KEYS.PROFILE_INFO);
    return profileInfo ? JSON.parse(profileInfo) : null;
  }, '프로필 정보 로드');
}

/**
 * 챗봇 대화 기록 저장
 * @param {Array} messages - 대화 메시지 배열
 */
export function saveChatbotMessages(messages) {
  localStorageWrapper(() => {
    localStorage.setItem(STORAGE_KEYS.CHATBOT_MESSAGES, JSON.stringify(messages));
  }, '챗봇 대화 기록 저장');
}

/**
 * 챗봇 대화 기록 로드
 * @returns {Array|null} 저장된 대화 메시지 배열 또는 null
 */
export function loadChatbotMessages() {
  return localStorageWrapper(() => {
    const messages = localStorage.getItem(STORAGE_KEYS.CHATBOT_MESSAGES);
    return messages ? JSON.parse(messages) : null;
  }, '챗봇 대화 기록 로드');
}

/**
 * 챗봇 대화 기록 삭제
 */
export function clearChatbotMessages() {
  localStorageWrapper(() => {
    localStorage.removeItem(STORAGE_KEYS.CHATBOT_MESSAGES);
  }, '챗봇 대화 기록 삭제');
}

/**
 * 챗봇 설정 저장 (언어, 정답 가리기)
 * @param {Object} settings - 챗봇 설정 객체 { language: string, hideAnswer: boolean }
 */
export function saveChatbotSettings(settings) {
  localStorageWrapper(() => {
    localStorage.setItem(STORAGE_KEYS.CHATBOT_SETTINGS, JSON.stringify(settings));
  }, '챗봇 설정 저장');
}

/**
 * 챗봇 설정 로드
 * @returns {Object|null} 저장된 챗봇 설정 또는 null { language: string, hideAnswer: boolean }
 */
export function loadChatbotSettings() {
  return localStorageWrapper(() => {
    const settings = localStorage.getItem(STORAGE_KEYS.CHATBOT_SETTINGS);
    return settings ? JSON.parse(settings) : null;
  }, '챗봇 설정 로드');
}

