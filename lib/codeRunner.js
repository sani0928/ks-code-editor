/**
 * 코드 실행 유틸리티 (Pyodide)
 */

/**
 * Python 코드 실행
 * @param {string} code - 실행할 Python 코드
 * @param {string} inputText - 입력 텍스트
 * @param {Object} pyodide - Pyodide 인스턴스
 * @returns {Promise<string>} 실행 결과
 */
export async function runPythonCode(code, inputText, pyodide) {
  if (!pyodide) {
    throw new Error('Python 실행 환경을 로드하는 중...');
  }

  const inputLines = inputText.split('\n').filter(line => line.trim() !== '');
  pyodide.globals.set('_input_lines', inputLines);

  const setupCode = `
import sys
from io import StringIO
import builtins

# 출력 캡처 설정
_stdout = StringIO()
sys.stdout = _stdout

# 입력 처리
_input_index = 0
_input_lines = _input_lines if '_input_lines' in globals() else []

def custom_input(prompt=''):
    global _input_index
    if _input_index < len(_input_lines):
        result = _input_lines[_input_index]
        _input_index += 1
        return result
    return ''

# input 함수 교체 (builtins 모듈 사용)
builtins.input = custom_input

# sys.stdin.readline도 커스텀 함수로 교체
class CustomStdin:
    def __init__(self):
        self._index = 0
        self._lines = _input_lines if '_input_lines' in globals() else []
    
    def readline(self):
        global _input_index
        if _input_index < len(self._lines):
            result = self._lines[_input_index]
            _input_index += 1
            return result + '\\n'  # readline은 줄바꿈 포함
        return '\\n'
    
    def read(self, size=-1):
        global _input_index
        if size == -1:
            # 전체 읽기
            result = '\\n'.join(self._lines[_input_index:])
            _input_index = len(self._lines)
            return result
        else:
            # 지정된 크기만큼 읽기
            if _input_index < len(self._lines):
                result = self._lines[_input_index]
                _input_index += 1
                return result[:size]
            return ''
    
    def readlines(self):
        global _input_index
        result = []
        while _input_index < len(self._lines):
            result.append(self._lines[_input_index] + '\\n')
            _input_index += 1
        return result

sys.stdin = CustomStdin()
  `;

  try {
    pyodide.runPython(setupCode);
    pyodide.runPython(code);
    const stdout = pyodide.runPython('_stdout.getvalue()');
    
    try {
      pyodide.runPython('sys.stdout = sys.__stdout__');
    } catch (e) {
      // 복원 실패는 무시
    }
    
    return stdout || '';
  } catch (error) {
    try {
      pyodide.runPython('sys.stdout = sys.__stdout__');
    } catch (e) {
      // 복원 실패는 무시
    }
    throw error;
  }
}

/**
 * JavaScript 코드 실행
 * @param {string} code - 실행할 JavaScript 코드
 * @param {string} inputText - 입력 텍스트
 * @returns {string} 실행 결과
 */
export function runJavaScriptCode(code, inputText) {
  const originalLog = console.log;
  const originalError = console.error;
  let outputText = '';

  // 입력 처리
  const inputLines = inputText.split('\n').filter(line => line.trim() !== '');
  let inputIndex = 0;

  // readline 함수 제공 (백준 스타일 입력 처리)
  const readline = () => {
    if (inputIndex < inputLines.length) {
      return inputLines[inputIndex++];
    }
    return '';
  };

  // readline을 전역으로 제공
  const originalReadline = globalThis.readline;
  globalThis.readline = readline;

  console.log = function(...args) {
    outputText += args.map(arg =>
      typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
    ).join(' ') + '\n';
    originalLog.apply(console, args);
  };

  console.error = function(...args) {
    outputText += 'ERROR: ' + args.map(arg =>
      typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
    ).join(' ') + '\n';
    originalError.apply(console, args);
  };

  try {
    // 입력 처리를 위한 헬퍼 함수들을 코드에 주입
    const wrappedCode = `
// 입력 처리 헬퍼 함수
const inputLines = ${JSON.stringify(inputLines)};
let inputIndex = 0;

// readline 함수 (백준 스타일)
function readline() {
  if (inputIndex < inputLines.length) {
    return inputLines[inputIndex++];
  }
  return '';
}

// readline을 전역으로 제공
if (typeof globalThis !== 'undefined') {
  globalThis.readline = readline;
}

// 사용자 코드 실행
${code}
    `;

    eval(wrappedCode);
    return outputText || '코드가 실행되었습니다. (출력 없음)';
  } catch (error) {
    throw error;
  } finally {
    console.log = originalLog;
    console.error = originalError;
    if (originalReadline !== undefined) {
      globalThis.readline = originalReadline;
    } else {
      delete globalThis.readline;
    }
  }
}

/**
 * HTML 이스케이프
 * @param {string} text - 이스케이프할 텍스트
 * @returns {string} 이스케이프된 텍스트
 */
export function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

