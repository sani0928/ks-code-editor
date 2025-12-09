/**
 * 언어별 스켈레톤 코드 정의
 */

export const skeletonCodes = {
  '파이쑝.py': `# Python 예제 코드
# 입력 받기 예제
a, b = map(int, input().split())
print(f"{a} + {b} = {a + b}")`,

  '씨쁠쁠.cpp': `// C++ 예제 코드
#include <iostream>
#include <vector>
#include <algorithm>
using namespace std;

int main() {
    ios_base::sync_with_stdio(false);
    cin.tie(NULL);
    
    int a, b;
    cin >> a >> b;
    cout << a + b << endl;
    
    return 0;
}`,

  '자바칩.java': `// Java 예제 코드
import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        
        int a = sc.nextInt();
        int b = sc.nextInt();
        System.out.println(a + b);
        
        sc.close();
    }
}`,

  '자바스크립뚜.js': `// JavaScript 예제 코드
// readline() 함수로 입력 받기
const line = readline();
const [a, b] = line.split(' ').map(Number);
console.log(a + b);`,

  'README.md': `# KS Code Editor
KS Code Editor는 백준(BOJ) 문제를 편리하게 풀 수 있도록 도와주는 웹 기반 코드 에디터입니다.

## 키보드 단축키

### 편집 단축키
- Ctrl + Z: 실행 취소 (Undo)
- Ctrl + Shift + Z: 다시 실행 (Redo)
- Ctrl + Y: 다시 실행 (Redo)

### 파일 단축키
- Ctrl + S: 코드 파일 다운로드

## 기능

### 에디터 기능
- Monaco Editor 기반
- 다중 파일 편집
- 구문 강조
- 자동 완성
- 코드 폴딩
- 탭 드래그 앤 드롭

### 백준 문제 풀이
- 백준 문제 번호로 문제 정보 자동 불러오기
- 문제 HTML 미리보기 (탭 더블 클릭으로 미리보기/코드 전환)
- input.txt에 자동 입력 (예제 입력 1)
- 백준 제출 페이지로 코드 복사 및 이동

### 접근성 강화
- 백준 유저 프로필 미리보기 (탭 더블 클릭으로 미리보기/코드 전환)
- 커스텀 테마 설정
- 최근에 풀던 문제 번호 저장

## EXPLORER 탭 파일 정보

### 코드 실행
- **Python**: Pyodide를 사용한 브라우저 내 실행 지원
- **C++**: 미구현 (추후 서버 API 요청으로 구현 예정)
- **Java**: 미구현 (추후 서버 API 요청으로 구현 예정)
- **JavaScript**: 브라우저 네이티브 실행 지원

### 그 외
- **README.md**: KS Code Editor 서비스 설명서
- **profile.html**: 유저 프로필
- **problem.html**: 백준 문제 미리보기
- **input.txt**: 코드 실행 시 입력 값을 저장하는 txt 파일
- **style.css**: KS code Editor의 세부적인 커스텀 테마 색상 설정

## 추후 구현 계획

- 다양한 프로그래밍 언어 확장
- 기본 테마 제공 (Light, Dark 등) 및 커스텀 테마 저장
- LLM AI 모델을 활용한 알고리즘 공부 코칭 (Extension 컨셉)

*문의 및 피드백: kksan12@gmail.com*`,

  'profile.html': ``,

  'problem.html': ``,

  'input.txt': `10 20`,
  
  'style.css': `/* ============================================
   테마 설정 파일
   ============================================
   
   📌 색상 변경 방법:
   아래 :root 블록에서 CSS 변수의 색상 값을 직접 수정하세요.
   
   🎨 사용 가능한 CSS 변수:
   
   [배경색]
   - --bg-primary: 메인 배경색 (에디터 영역, 터미널)
   - --bg-secondary: 사이드바 배경색
   - --bg-tertiary: 탭 바, 헤더 배경색
   - --editor-bg: 에디터 내부 배경색 (Monaco Editor)
   
   [텍스트 색상]
   - --text-primary: 주요 텍스트 색상
   - --text-secondary: 보조 텍스트 색상 (비활성 탭)
   - --editor-text: 에디터 텍스트 색상
   - --button-text: 버튼 텍스트 색상
   - --statusbar-text: 상태바 텍스트 색상
   - --empty-editor-text: 빈 에디터 안내 텍스트 색상
   
   [테두리 및 구분선]
   - --border-color: 테두리 색상
   
   [강조 색상]
   - --accent-color: 강조 색상 (버튼, 상태바, 링크 등)
   - --file-special-color: 특수 파일 색상 (problem.html, input.txt)
   
   [탭]
   - --tab-hover-bg: 탭 호버 배경색
   - --tab-close-hover-bg: 탭 닫기 버튼 호버 배경색
   - --tab-close-hover-color: 탭 닫기 버튼 호버 텍스트 색상
   - --tab-drag-indicator-color: 탭 드래그 시 표시되는 인디케이터 색상
   - --tab-drag-indicator-width: 탭 드래그 인디케이터 너비 (기본값: 2px)
   
   [파일 탐색기]
   - --file-item-hover-bg: 파일 아이템 호버 배경색
   
   [버튼]
   - --button-load-bg: 로드 버튼 배경색
   - --button-hover-bg: 버튼 호버 배경색
   
   [스크롤바]
   - --scrollbar-track: 스크롤바 트랙 배경색
   - --scrollbar-thumb: 스크롤바 썸 색상
   - --scrollbar-thumb-hover: 스크롤바 썸 호버 색상
   
   💡 팁: style.css 탭을 더블 클릭하면 초기 테마로 리셋됩니다!
   ============================================ */

  :root {
      /* 배경색 */
      --bg-primary: #1e1e1e;
      --bg-secondary: #252526;
      --bg-tertiary: #2d2d30;
      --editor-bg: #1e1e1e;
      
      /* 텍스트 색상 */
      --text-primary: #cccccc;
      --text-secondary: #858585;
      --editor-text: #cccccc;
      --button-text: #ffffff;
      --statusbar-text: #ffffff;
      --empty-editor-text: #888888;
      
      /* 테두리 및 구분선 */
      --border-color: #3e3e42;
      
      /* 강조 색상 */
      --accent-color: #007acc;
      --file-special-color: #4ec9b0;
      
      /* 탭 */
      --tab-hover-bg: #2a2d2e;
      --tab-close-hover-bg: #3e3e42;
      --tab-close-hover-color: #cccccc;
      --tab-drag-indicator-color: #007acc;
      --tab-drag-indicator-width: 2px;
      
      /* 파일 탐색기 */
      --file-item-hover-bg: #2a2d2e;
      
      /* 버튼 */
      --button-load-bg: #4ec9b0;
      --button-hover-bg: #005a9e;
      
      /* 스크롤바 */
      --scrollbar-track: #252526;
      --scrollbar-thumb: #424242;
      --scrollbar-thumb-hover: #4e4e4e;
  }`,
};

/**
 * EXPLORER에서 표시할 파일 순서
 */
export const fileOrder = [
  '파이쑝.py',
  '씨쁠쁠.cpp',
  '자바칩.java',
  '자바스크립뚜.js',
  'README.md',
  // 구분선 이후
  // problem.html, input.txt, style.css는 동적으로 추가
];

/**
 * 특수 파일 목록 (구분선 이후 표시)
 * 순서: profile.html, (문제이름).html, input.txt, style.css
 */
export const specialFiles = ['profile.html', 'input.txt', 'style.css'];

