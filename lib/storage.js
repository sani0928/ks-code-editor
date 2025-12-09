/**
 * localStorage 유틸리티 함수
 */

const STORAGE_KEYS = {
  THEME: 'kscode_theme',
  PROBLEM_NUMBER: 'kscode_problem_number',
  USER_ID: 'kscode_user_id',
  FILES: 'kscode_files',
  CURRENT_FILE: 'kscode_current_file',
  OPEN_TABS: 'kscode_open_tabs',
  EDITOR_GROUPS: 'kscode_editor_groups',
  ACTIVE_GROUP_ID: 'kscode_active_group_id',
  MUSIC: 'kscode_music',
};

/**
 * 테마 저장
 * @param {string} theme - CSS 테마 내용
 */
export function saveTheme(theme) {
  try {
    localStorage.setItem(STORAGE_KEYS.THEME, theme);
  } catch (error) {
    console.error('테마 저장 실패:', error);
  }
}

/**
 * 테마 로드
 * @returns {string|null} 저장된 테마 또는 null
 */
export function loadTheme() {
  try {
    return localStorage.getItem(STORAGE_KEYS.THEME);
  } catch (error) {
    console.error('테마 로드 실패:', error);
    return null;
  }
}

/**
 * 문제 번호 저장
 * @param {string} problemNumber - 문제 번호
 */
export function saveProblemNumber(problemNumber) {
  try {
    localStorage.setItem(STORAGE_KEYS.PROBLEM_NUMBER, problemNumber);
  } catch (error) {
    console.error('문제 번호 저장 실패:', error);
  }
}

/**
 * 문제 번호 로드
 * @returns {string|null} 저장된 문제 번호 또는 null
 */
export function loadProblemNumber() {
  try {
    return localStorage.getItem(STORAGE_KEYS.PROBLEM_NUMBER);
  } catch (error) {
    console.error('문제 번호 로드 실패:', error);
    return null;
  }
}

/**
 * 코드 파일 확장자 확인
 * @param {string} filename - 파일명
 * @returns {boolean} 코드 파일 여부 (.py, .cpp, .java, .js만)
 */
function isCodeFile(filename) {
  if (!filename) return false;
  const ext = filename.split('.').pop()?.toLowerCase() || '';
  return ['py', 'cpp', 'java', 'js'].includes(ext);
}

/**
 * 파일들 저장 (코드 파일만 저장)
 * @param {Object} files - 파일 객체
 */
export function saveFiles(files) {
  try {
    // 코드 파일(.py, .cpp, .java, .js)만 필터링하여 저장
    const codeFiles = {};
    Object.keys(files).forEach(filename => {
      if (isCodeFile(filename)) {
        codeFiles[filename] = files[filename];
      }
    });
    // 코드 파일이 하나라도 있으면 저장
    if (Object.keys(codeFiles).length > 0) {
      localStorage.setItem(STORAGE_KEYS.FILES, JSON.stringify(codeFiles));
    }
  } catch (error) {
    console.error('파일 저장 실패:', error);
  }
}

/**
 * 파일들 로드
 * @returns {Object|null} 저장된 파일 객체 또는 null
 */
export function loadFiles() {
  try {
    const files = localStorage.getItem(STORAGE_KEYS.FILES);
    if (files) {
      return JSON.parse(files);
    }
    return null;
  } catch (error) {
    console.error('파일 로드 실패:', error);
    return null;
  }
}

/**
 * 현재 파일 저장
 * @param {string} filename - 현재 파일명
 */
export function saveCurrentFile(filename) {
  try {
    localStorage.setItem(STORAGE_KEYS.CURRENT_FILE, filename);
  } catch (error) {
    console.error('현재 파일 저장 실패:', error);
  }
}

/**
 * 현재 파일 로드
 * @returns {string|null} 저장된 현재 파일명 또는 null
 */
export function loadCurrentFile() {
  try {
    return localStorage.getItem(STORAGE_KEYS.CURRENT_FILE);
  } catch (error) {
    console.error('현재 파일 로드 실패:', error);
    return null;
  }
}

/**
 * 열린 탭들 저장
 * @param {string[]} tabs - 탭 배열
 */
export function saveOpenTabs(tabs) {
  try {
    localStorage.setItem(STORAGE_KEYS.OPEN_TABS, JSON.stringify(tabs));
  } catch (error) {
    console.error('열린 탭 저장 실패:', error);
  }
}

/**
 * 열린 탭들 로드
 * @returns {string[]|null} 저장된 탭 배열 또는 null
 */
export function loadOpenTabs() {
  try {
    const tabs = localStorage.getItem(STORAGE_KEYS.OPEN_TABS);
    return tabs ? JSON.parse(tabs) : null;
  } catch (error) {
    console.error('열린 탭 로드 실패:', error);
    return null;
  }
}

/**
 * 에디터 그룹 저장
 * @param {Array} groups - 에디터 그룹 배열
 */
export function saveEditorGroups(groups) {
  try {
    localStorage.setItem(STORAGE_KEYS.EDITOR_GROUPS, JSON.stringify(groups));
  } catch (error) {
    console.error('에디터 그룹 저장 실패:', error);
  }
}

/**
 * 에디터 그룹 로드
 * @returns {Array|null} 저장된 에디터 그룹 배열 또는 null
 */
export function loadEditorGroups() {
  try {
    const groups = localStorage.getItem(STORAGE_KEYS.EDITOR_GROUPS);
    return groups ? JSON.parse(groups) : null;
  } catch (error) {
    console.error('에디터 그룹 로드 실패:', error);
    return null;
  }
}

/**
 * 활성 그룹 ID 저장
 * @param {number} groupId - 활성 그룹 ID
 */
export function saveActiveGroupId(groupId) {
  try {
    localStorage.setItem(STORAGE_KEYS.ACTIVE_GROUP_ID, String(groupId));
  } catch (error) {
    console.error('활성 그룹 ID 저장 실패:', error);
  }
}

/**
 * 활성 그룹 ID 로드
 * @returns {number|null} 저장된 활성 그룹 ID 또는 null
 */
export function loadActiveGroupId() {
  try {
    const id = localStorage.getItem(STORAGE_KEYS.ACTIVE_GROUP_ID);
    return id ? parseInt(id, 10) : null;
  } catch (error) {
    console.error('활성 그룹 ID 로드 실패:', error);
    return null;
  }
}

/**
 * 유저 아이디 저장
 * @param {string} userId - 유저 아이디
 */
export function saveUserId(userId) {
  try {
    localStorage.setItem(STORAGE_KEYS.USER_ID, userId);
  } catch (error) {
    console.error('유저 아이디 저장 실패:', error);
  }
}

/**
 * 유저 아이디 로드
 * @returns {string|null} 저장된 유저 아이디 또는 null
 */
export function loadUserId() {
  try {
    return localStorage.getItem(STORAGE_KEYS.USER_ID);
  } catch (error) {
    console.error('유저 아이디 로드 실패:', error);
    return null;
  }
}

/**
 * 음악 상태 저장
 * @param {boolean} isPlaying - 재생 여부
 * @param {number} trackIndex - 현재 트랙 인덱스
 */
export function saveMusicState(isPlaying, trackIndex) {
  try {
    const musicState = {
      isPlaying,
      trackIndex,
    };
    localStorage.setItem(STORAGE_KEYS.MUSIC, JSON.stringify(musicState));
  } catch (error) {
    console.error('음악 상태 저장 실패:', error);
  }
}

/**
 * 음악 상태 로드
 * @returns {{ isPlaying: boolean, trackIndex: number }|null} 저장된 음악 상태 또는 null
 */
export function loadMusicState() {
  try {
    const musicState = localStorage.getItem(STORAGE_KEYS.MUSIC);
    if (musicState) {
      const parsed = JSON.parse(musicState);
      return {
        isPlaying: parsed.isPlaying === true,
        trackIndex: typeof parsed.trackIndex === 'number' ? parsed.trackIndex : 0,
      };
    }
    return null;
  } catch (error) {
    console.error('음악 상태 로드 실패:', error);
    return null;
  }
}

