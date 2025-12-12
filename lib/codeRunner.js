/**
 * 코드 실행 유틸리티 (Pyodide, Piston API)
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
 * JavaScript 코드 실행 (Piston API 사용 - Node.js 환경)
 * 백준 스타일 코드(fs 모듈 사용)를 지원합니다.
 * @param {string} code - 실행할 JavaScript 코드
 * @param {string} inputText - 입력 텍스트
 * @returns {Promise<string>} 실행 결과
 */
export async function runJavaScriptCode(code, inputText) {
  return runCodeWithPiston('javascript', code, inputText);
}

/**
 * Piston API를 사용한 코드 실행 (C++, C, Java, JavaScript)
 * @param {string} language - 언어 ('cpp', 'c', 'java', 'javascript')
 * @param {string} code - 실행할 코드
 * @param {string} inputText - 입력 텍스트
 * @returns {Promise<string>} 실행 결과
 */
async function runCodeWithPiston(language, code, inputText) {
  const response = await fetch('/api/execute-code', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      language: language,
      code: code,
      inputText: inputText || '',
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || '코드 실행에 실패했습니다.');
  }

  const result = await response.json();

  if (!result.success) {
    throw new Error(result.error || '코드 실행에 실패했습니다.');
  }

  return result.output || '';
}

/**
 * C++ 코드 실행 (Piston API 사용)
 * @param {string} code - 실행할 C++ 코드
 * @param {string} inputText - 입력 텍스트
 * @returns {Promise<string>} 실행 결과
 */
export async function runCppCode(code, inputText) {
  return runCodeWithPiston('cpp', code, inputText);
}

/**
 * C 코드 실행 (Piston API 사용)
 * @param {string} code - 실행할 C 코드
 * @param {string} inputText - 입력 텍스트
 * @returns {Promise<string>} 실행 결과
 */
export async function runCCode(code, inputText) {
  return runCodeWithPiston('c', code, inputText);
}

/**
 * Java 코드 실행 (Piston API 사용)
 * @param {string} code - 실행할 Java 코드
 * @param {string} inputText - 입력 텍스트
 * @returns {Promise<string>} 실행 결과
 */
export async function runJavaCode(code, inputText) {
  return runCodeWithPiston('java', code, inputText);
}


