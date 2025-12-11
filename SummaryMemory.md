# SummaryMemory 도입 계획

## 1. 개요

### 목적
- 긴 대화 기록에서 토큰 사용량 감소
- 대화가 길어져도 문맥 유지
- API 호출 비용 절감
- 사용자 경험 개선 (응답 속도 향상)

### 현재 상태
- **메모리 타입**: `BufferMemory` (모든 대화 기록을 그대로 전송)
- **저장 위치**: 클라이언트 `localStorage`
- **Langchain 버전**: `langchain@^0.1.0`
- **문제점**: 대화가 길어질수록 토큰 사용량이 선형적으로 증가

---

## 2. SummaryMemory란?

### 개념
- 대화 기록을 요약하여 저장하는 메모리 타입
- 오래된 대화는 요약으로 압축, 최근 대화는 상세히 유지
- LLM을 사용하여 대화 내용을 자동으로 요약

### 동작 방식
```
[대화 1-10] → 요약: "사용자가 DP 문제에 대해 질문하고, 힌트를 요청했습니다."
[대화 11-20] → 요약: "그래프 탐색 알고리즘에 대한 설명을 받았습니다."
[대화 21-30] → 상세 대화 (최근)
```

### 장점
- **토큰 절약**: 긴 대화에서 50-70% 토큰 절감 가능
- **문맥 유지**: 요약을 통해 전체 대화 맥락 보존
- **비용 절감**: API 호출 비용 감소

### 단점
- **초기 비용**: 요약 생성 시 추가 LLM 호출 필요
- **세부 정보 손실**: 요약 과정에서 일부 세부 정보 손실 가능
- **복잡도 증가**: 구현 및 관리 복잡도 증가

---

## 3. 기술적 요구사항

### 3.1 Langchain 버전 확인
```bash
# 현재 버전
langchain: ^0.1.0
@langchain/core: ^0.1.23
@langchain/openai: ^0.0.14

# 확인 필요: ConversationSummaryMemory 지원 여부
# 만약 지원되지 않으면 업그레이드 필요
npm install langchain@latest @langchain/core@latest @langchain/openai@latest
```

### 3.2 필요한 패키지
- `langchain/memory` - ConversationSummaryMemory
- `@langchain/openai` - ChatOpenAI (요약 생성용)

### 3.3 서버리스 환경 고려사항
- **Stateless 동작**: SummaryMemory도 stateless로 동작 가능
- **요약 생성 시점**: API 호출 시점에 요약 생성
- **저장 위치**: 요약 결과를 클라이언트에 저장하여 재사용

---

## 4. 구현 계획

### 4.1 아키텍처 설계

#### 현재 구조
```
[클라이언트]
  ↓ 모든 대화 기록 전송
[API Route]
  ↓ BufferMemory에 로드
[Langchain Chain]
  ↓ 모든 대화를 컨텍스트로 포함
[OpenAI API]
```

#### SummaryMemory 적용 후
```
[클라이언트]
  ↓ 요약 + 최근 대화 전송
[API Route]
  ↓ SummaryMemory에 로드
  ↓ 필요시 요약 생성 (LLM 호출)
[Langchain Chain]
  ↓ 요약 + 최근 대화를 컨텍스트로 포함
[OpenAI API]
```

### 4.2 데이터 구조 변경

#### 현재 localStorage 구조
```javascript
// kscode_chatbot_messages
[
  { role: 'user', content: '...' },
  { role: 'assistant', content: '...' },
  // ... 모든 대화
]
```

#### SummaryMemory 적용 후
```javascript
// kscode_chatbot_messages
{
  summary: "대화 요약 내용...", // 오래된 대화 요약
  recentMessages: [ // 최근 N개 대화 (예: 10개)
    { role: 'user', content: '...' },
    { role: 'assistant', content: '...' },
  ],
  totalMessages: 25, // 전체 대화 수
}
```

### 4.3 하이브리드 전략

#### 대화 길이에 따른 메모리 타입 선택
```javascript
// 대화가 짧을 때: BufferMemory (요약 불필요)
// 대화가 길어질 때: SummaryMemory (요약 필요)

const MESSAGE_THRESHOLD = 20; // 20개 대화 이상일 때 요약 시작

const useSummaryMemory = messages.length > MESSAGE_THRESHOLD;
```

---

## 5. 단계별 구현 계획

### Phase 1: 준비 단계

#### 1.1 Langchain 버전 확인 및 업그레이드
```bash
# 버전 확인
npm list langchain @langchain/core @langchain/openai

# 필요시 업그레이드
npm install langchain@latest @langchain/core@latest @langchain/openai@latest
```

#### 1.2 ConversationSummaryMemory 지원 확인
```javascript
// 테스트 코드
import { ConversationSummaryMemory } from 'langchain/memory';

// 지원 여부 확인
try {
  const memory = new ConversationSummaryMemory({
    llm: model,
    returnMessages: true,
  });
  console.log('SummaryMemory 지원됨');
} catch (error) {
  console.error('SummaryMemory 미지원:', error);
}
```

### Phase 2: 스토리지 구조 변경

#### 2.1 storage.js 수정
```javascript
// lib/storage.js

// 기존 함수 유지 (하위 호환성)
export function saveChatbotMessages(messages) { ... }
export function loadChatbotMessages() { ... }

// 새로운 함수 추가
export function saveChatbotMessagesWithSummary(data) {
  // { summary, recentMessages, totalMessages } 형식으로 저장
}

export function loadChatbotMessagesWithSummary() {
  // 요약 + 최근 대화 로드
}
```

#### 2.2 마이그레이션 로직
```javascript
// 기존 형식 (배열) → 새 형식 (객체) 변환
function migrateChatbotMessages(oldMessages) {
  if (Array.isArray(oldMessages) && oldMessages.length > 20) {
    // 기존 대화를 새 형식으로 변환
    // 처음 10개는 요약 대상, 나머지는 recentMessages
  }
}
```

### Phase 3: API Route 수정

#### 3.1 app/api/chatbot/route.js 수정
```javascript
// 현재: BufferMemory
const memory = new BufferMemory({ ... });

// 변경: 조건부 SummaryMemory
const useSummary = conversationMessages.length > 20;

const memory = useSummary
  ? new ConversationSummaryMemory({
      llm: model,
      returnMessages: true,
      memoryKey: 'history',
    })
  : new BufferMemory({
      returnMessages: true,
      memoryKey: 'history',
    });

// 요약이 있는 경우 처리
if (useSummary && requestBody.summary) {
  // 기존 요약을 메모리에 로드
  memory.buffer = requestBody.summary;
}
```

#### 3.2 요약 생성 로직
```javascript
// 대화가 길어질 때 요약 생성
async function generateSummary(oldMessages, model) {
  // 오래된 대화를 요약
  const summaryMemory = new ConversationSummaryMemory({
    llm: model,
  });
  
  // 대화 기록을 메모리에 추가
  for (const msg of oldMessages) {
    if (msg.role === 'user') {
      summaryMemory.chatHistory.addUserMessage(msg.content);
    } else {
      summaryMemory.chatHistory.addAIChatMessage(msg.content);
    }
  }
  
  // 요약 생성
  const summary = await summaryMemory.loadMemoryVariables({});
  return summary.history || summary.summary;
}
```

### Phase 4: 클라이언트 수정

#### 4.1 ChatbotViewer.js 수정
```javascript
// 대화 저장 시 요약 포함
const handleSend = async () => {
  // ... 기존 로직 ...
  
  // 대화가 길어지면 요약 생성 요청
  if (messages.length > 20) {
    const response = await fetch('/api/chatbot/summarize', {
      method: 'POST',
      body: JSON.stringify({
        messages: messages.slice(0, -10), // 최근 10개 제외
      }),
    });
    const { summary } = await response.json();
    
    // 요약 + 최근 대화 저장
    saveChatbotMessagesWithSummary({
      summary,
      recentMessages: messages.slice(-10),
      totalMessages: messages.length,
    });
  }
};
```

#### 4.2 요약 표시 UI (선택사항)
```javascript
// 대화 상단에 요약 표시
{summary && (
  <div className="summary-banner">
    <details>
      <summary>이전 대화 요약 보기</summary>
      <p>{summary}</p>
    </details>
  </div>
)}
```

### Phase 5: 최적화 및 테스트

#### 5.1 성능 측정
- 토큰 사용량 비교 (BufferMemory vs SummaryMemory)
- API 응답 시간 측정
- 비용 절감 효과 분석

#### 5.2 에러 처리
- 요약 생성 실패 시 fallback (BufferMemory 사용)
- 네트워크 오류 처리
- 데이터 마이그레이션 실패 처리

---

## 6. 구현 세부사항

### 6.1 요약 생성 API 엔드포인트 (선택사항)

```javascript
// app/api/chatbot/summarize/route.js
export async function POST(request) {
  const { messages } = await request.json();
  
  const model = new ChatOpenAI({
    openAIApiKey: process.env.OPENAI_API_KEY,
    modelName: 'gpt-3.5-turbo',
    temperature: 0,
  });
  
  const memory = new ConversationSummaryMemory({
    llm: model,
  });
  
  // 대화 기록 로드
  for (const msg of messages) {
    if (msg.role === 'user') {
      memory.chatHistory.addUserMessage(msg.content);
    } else {
      memory.chatHistory.addAIChatMessage(msg.content);
    }
  }
  
  // 요약 생성
  const summary = await memory.loadMemoryVariables({});
  
  return NextResponse.json({
    summary: summary.history || summary.summary,
  });
}
```

### 6.2 요약 생성 시점 전략

#### 옵션 1: 클라이언트에서 주기적 요약
```javascript
// 20개 대화마다 요약 생성
if (messages.length % 20 === 0) {
  generateSummary();
}
```

#### 옵션 2: 서버에서 필요시 요약
```javascript
// API 호출 시 대화가 길면 자동 요약
if (conversationMessages.length > 20) {
  // 오래된 대화 요약
  // 최근 10개만 상세히 유지
}
```

#### 옵션 3: 사용자 요청 시 요약
```javascript
// "대화 요약하기" 버튼 제공
const handleSummarize = async () => {
  // 요약 생성 요청
};
```

### 6.3 요약 품질 개선

#### 프롬프트 커스터마이징
```javascript
const SUMMARY_PROMPT = `다음 대화를 요약해주세요. 
중요한 정보(문제 번호, 알고리즘 유형, 사용자 약점 등)를 포함해주세요.
요약은 한국어로 작성해주세요.`;

const memory = new ConversationSummaryMemory({
  llm: model,
  prompt: SUMMARY_PROMPT,
});
```

---

## 7. 예상 효과

### 7.1 토큰 절감 효과

| 대화 수 | BufferMemory | SummaryMemory | 절감률 |
|---------|-------------|---------------|--------|
| 10개    | ~2,000 토큰 | ~2,000 토큰   | 0%     |
| 20개    | ~4,000 토큰 | ~3,000 토큰   | 25%    |
| 50개    | ~10,000 토큰 | ~4,000 토큰   | 60%    |
| 100개   | ~20,000 토큰 | ~5,000 토큰   | 75%    |

### 7.2 비용 절감 효과
- GPT-3.5 Turbo 기준: $0.0015 / 1K 토큰 (입력)
- 100개 대화 기준:
  - BufferMemory: ~$0.03 per request
  - SummaryMemory: ~$0.0075 per request
  - **절감: 약 75%**

### 7.3 응답 속도 개선
- 토큰 수 감소 → API 응답 시간 단축
- 예상: 20-30% 응답 속도 향상

---

## 8. 주의사항 및 고려사항

### 8.1 요약 품질
- **문제**: 요약 과정에서 중요한 세부 정보 손실 가능
- **해결**: 최근 N개 대화는 항상 상세히 유지

### 8.2 초기 비용
- **문제**: 요약 생성 시 추가 LLM 호출 필요
- **해결**: 대화가 일정 길이 이상일 때만 요약 생성

### 8.3 데이터 마이그레이션
- **문제**: 기존 사용자의 대화 기록 형식 변경 필요
- **해결**: 하위 호환성 유지, 점진적 마이그레이션

### 8.4 Langchain 버전 호환성
- **문제**: 현재 버전(0.1.0)에서 SummaryMemory 미지원 가능
- **해결**: 버전 확인 후 필요시 업그레이드

### 8.5 서버리스 환경 제약
- **문제**: 요약 생성 시 추가 API 호출로 인한 지연
- **해결**: 비동기 요약 생성, 클라이언트 캐싱

---

## 9. 롤백 계획

### 9.1 문제 발생 시
1. **즉시 롤백**: BufferMemory로 복귀
2. **데이터 복구**: 기존 형식으로 데이터 변환
3. **원인 분석**: 로그 확인 및 디버깅

### 9.2 점진적 배포
1. **A/B 테스트**: 일부 사용자만 SummaryMemory 사용
2. **모니터링**: 토큰 사용량, 에러율, 응답 시간 측정
3. **전면 적용**: 문제 없을 시 모든 사용자에게 적용

---

## 10. 향후 개선 방향

### 10.1 고급 메모리 타입
- **EntityMemory**: 사용자 정보(티어, 약점 등)를 엔티티로 추출
- **BufferWindowMemory**: 최근 N개 대화만 유지 (요약 없이)

### 10.2 하이브리드 메모리
- **Summary + Buffer**: 요약 + 최근 대화 조합
- **Summary + Entity**: 요약 + 엔티티 정보 조합

### 10.3 DB 연동
- **Vercel KV / PostgreSQL**: 서버 측 메모리 저장
- **장기 대화 기록**: DB에 저장하여 영구 보존

---

## 11. 체크리스트

### 구현 전
- [ ] Langchain 버전 확인 및 업그레이드
- [ ] ConversationSummaryMemory 지원 여부 확인
- [ ] 테스트 환경 구축

### 구현 중
- [ ] storage.js 수정 (새 데이터 구조)
- [ ] API Route 수정 (SummaryMemory 적용)
- [ ] ChatbotViewer.js 수정 (요약 처리)
- [ ] 마이그레이션 로직 구현
- [ ] 에러 처리 추가

### 구현 후
- [ ] 성능 테스트 (토큰 사용량, 응답 시간)
- [ ] 비용 분석
- [ ] 사용자 테스트
- [ ] 문서화

---

## 12. 참고 자료

- [Langchain Memory 문서](https://js.langchain.com/docs/modules/memory/)
- [ConversationSummaryMemory API](https://js.langchain.com/docs/api/memory/classes/ConversationSummaryMemory)
- [OpenAI Pricing](https://openai.com/pricing)

---

**작성일**: 2024년
**작성자**: AI Assistant
**상태**: 계획 단계

