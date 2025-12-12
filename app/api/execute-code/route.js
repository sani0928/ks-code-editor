/**
 * 코드 실행 API 라우트 (Piston API 사용)
 * C++, C, Java, JavaScript 코드 실행을 지원합니다.
 */

/**
 * JavaScript 코드를 Piston API 형식에 맞게 전처리
 * /dev/stdin을 process.stdin으로 변환
 * @param {string} code - 원본 JavaScript 코드
 * @returns {string} 처리된 JavaScript 코드
 */
function processJavaScriptCode(code) {
  // /dev/stdin을 0 (stdin file descriptor)로 변환
  // require('fs').readFileSync('/dev/stdin') -> require('fs').readFileSync(0, 'utf-8')
  return code.replace(
    /require\(['"]fs['"]\)\.readFileSync\(['"]\/dev\/stdin['"]\)/g,
    "require('fs').readFileSync(0, 'utf-8')"
  );
}

/**
 * Java 코드를 Piston API 형식에 맞게 전처리
 * @param {string} code - 원본 Java 코드
 * @returns {string} 처리된 Java 코드
 */
function processJavaCode(code) {
  // Main 클래스가 있는지 확인
  const hasMainClass = /public\s+class\s+Main\b/.test(code);
  
  if (hasMainClass) {
    return code;
  }
  
  // 이미 다른 클래스가 있는지 확인
  const classMatch = code.match(/public\s+class\s+(\w+)/);
  if (classMatch && classMatch[1] !== 'Main') {
    // 클래스 이름을 Main으로 변경
    return code.replace(/public\s+class\s+(\w+)/, 'public class Main');
  }
  
  if (!classMatch) {
    // 클래스가 없으면 Main 클래스로 감싸기
    // main 메서드가 있는지 확인
    if (code.includes('public static void main')) {
      return `public class Main {\n${code}\n}`;
    } else {
      // main 메서드가 없으면 추가
      return `public class Main {\n    public static void main(String[] args) {\n${code}\n    }\n}`;
    }
  }
  
  return code;
}

export async function POST(request) {
  try {
    const { language, code, inputText } = await request.json();

    if (!language || !code) {
      return Response.json(
        { error: 'Language and code are required' },
        { status: 400 }
      );
    }

    // Piston API 언어 매핑
    const languageMap = {
      'cpp': { name: 'cpp', version: '10.2.0', filename: 'main.cpp' },
      'c': { name: 'c', version: '10.2.0', filename: 'main.c' },
      'java': { name: 'java', version: '15.0.2', filename: 'Main.java' },
      'javascript': { name: 'javascript', version: '18.15.0', filename: 'main.js' },
    };

    const langConfig = languageMap[language];
    if (!langConfig) {
      return Response.json(
        { error: `Unsupported language: ${language}` },
        { status: 400 }
      );
    }

    // 언어별 코드 전처리
    let processedCode = code;
    if (language === 'java') {
      processedCode = processJavaCode(code);
    } else if (language === 'javascript') {
      processedCode = processJavaScriptCode(code);
    }

    // Piston API 요청
    const pistonResponse = await fetch('https://emkc.org/api/v2/piston/execute', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        language: langConfig.name,
        version: langConfig.version,
        files: [
          {
            name: langConfig.filename,
            content: processedCode,
          },
        ],
        stdin: inputText || '',
        args: [],
        compile_timeout: 10000,
        run_timeout: 5000,
      }),
    });

    if (!pistonResponse.ok) {
      const errorData = await pistonResponse.json().catch(() => ({}));
      throw new Error(
        errorData.message || `Piston API error: ${pistonResponse.status}`
      );
    }

    const result = await pistonResponse.json();

    // 결과 처리
    let output = '';
    let hasError = false;

    if (result.compile && result.compile.stderr) {
      output += result.compile.stderr;
      hasError = true;
    }

    if (result.run) {
      if (result.run.stderr) {
        output += result.run.stderr;
        hasError = true;
      }
      if (result.run.stdout) {
        output += result.run.stdout;
      }
    }

    // 실행 시간 초과 또는 메모리 초과 체크
    if (result.run && result.run.signal) {
      if (result.run.signal === 'SIGKILL') {
        output = '실행 시간 초과 또는 메모리 초과';
        hasError = true;
      } else {
        output = `프로그램이 종료되었습니다 (신호: ${result.run.signal})`;
        hasError = true;
      }
    }

    return Response.json({
      success: true,
      output: output || '코드가 실행되었습니다. (출력 없음)',
      hasError,
      exitCode: result.run?.code || 0,
    });
  } catch (error) {
    console.error('Code execution error:', error);
    return Response.json(
      {
        success: false,
        error: error.message || '코드 실행 중 오류가 발생했습니다.',
      },
      { status: 500 }
    );
  }
}

