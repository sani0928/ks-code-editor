'use client';

import { useState, useEffect, useRef } from 'react';
import { loadProblemInfo, loadProfileInfo, loadChatbotMessages, saveChatbotMessages, clearChatbotMessages, saveChatbotSettings, loadChatbotSettings } from '../../lib/storage';
import { darkenColor } from '../../lib/colorUtils';

/**
 * 챗봇 뷰어 컴포넌트
 */
export default function ChatbotViewer() {
  const languages = ['Python', 'Java', 'C++', 'JavaScript'];

  // 초기 챗봇 설정을 localStorage에서 로드 (lazy initialization)
  const getInitialChatbotSettings = () => {
    if (typeof window !== 'undefined') {
      const savedSettings = loadChatbotSettings();
      if (savedSettings) {
        return {
          language: savedSettings.language && languages.includes(savedSettings.language) 
            ? savedSettings.language 
            : 'Python',
          hideAnswer: typeof savedSettings.hideAnswer === 'boolean' 
            ? savedSettings.hideAnswer 
            : false,
        };
      }
    }
    return { language: 'Python', hideAnswer: false }; // 기본값
  };

  const initialSettings = getInitialChatbotSettings();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [hideAnswer, setHideAnswer] = useState(initialSettings.hideAnswer);
  const [selectedLanguage, setSelectedLanguage] = useState(initialSettings.language);
  const [problemInfo, setProblemInfo] = useState(null);
  const [profileInfo, setProfileInfo] = useState(null);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // 스크롤을 맨 아래로
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // 문제 정보, 프로필 정보, 대화 기록 로드
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const loadedProblemInfo = loadProblemInfo();
      const loadedProfileInfo = loadProfileInfo();
      const loadedMessages = loadChatbotMessages();
      
      setProblemInfo(loadedProblemInfo);
      setProfileInfo(loadedProfileInfo);
      
      // 저장된 대화 기록이 있으면 로드 (시스템 메시지는 제외)
      if (loadedMessages && Array.isArray(loadedMessages) && loadedMessages.length > 0) {
        // 시스템 메시지를 제외한 대화 기록만 로드
        const conversationMessages = loadedMessages.filter(msg => msg.role !== 'system');
        if (conversationMessages.length > 0) {
          setMessages(conversationMessages);
        }
      }
    }
  }, []);

  // 언어 선택 또는 정답 가리기가 변경될 때 localStorage에 저장
  useEffect(() => {
    if (typeof window !== 'undefined') {
      saveChatbotSettings({
        language: selectedLanguage,
        hideAnswer: hideAnswer,
      });
    }
  }, [selectedLanguage, hideAnswer]);

  // 대화 기록이 변경될 때마다 localStorage에 저장 (시스템 메시지 제외)
  useEffect(() => {
    if (typeof window !== 'undefined' && messages.length > 0) {
      saveChatbotMessages(messages);
    }
  }, [messages]);

  // 시스템 프롬프트 생성 (상태 기반 - UI 표시용)
  const createSystemPrompt = () => {
    return createSystemPromptWithInfo(problemInfo, profileInfo, selectedLanguage);
  };

  // 시스템 프롬프트 생성 (파라미터 기반 - 실제 사용)
  const createSystemPromptWithInfo = (currentProblemInfo, currentProfileInfo, currentLanguage) => {
    let systemPrompt = 
    `당신은 알고리즘 문제 풀이를 도와주는 AI이며 이름은 옜다정답입니다.
    사용자가 문제를 이해하고 설명해주며 해결할 수 있도록 이끄는 것이 당신의 최우선 목표입니다.             
    사용자 프로필 정보와 문제 정보를 바탕으로 사용자 수준에 적절한 답변을 해주세요.
    사용자 티어와 문제 난이도(티어)를 고려하여 답변을 해주세요.
    코드 블록 외에는 볼드, 섹션을 포함한 마크다운 형식을 절대 사용하지 마세요. 일반 텍스트로만 작성해주세요.
    질문이 알고리즘 문제와 관련이 있는지 구별하여 적절한 답변을 해주세요. (알고리즘과 너무 멀리 떨어진 질문은 온건하게 거절하세요.)
    존댓말로 답변해주세요.
    `;

    // 사용자 정보 추가
    if (currentProfileInfo) {
      systemPrompt += `## 사용자 백준 프로필 정보
- 티어: ${currentProfileInfo.tier || '알 수 없음'}
- 해결한 문제 수: ${currentProfileInfo.solvedCount || '알 수 없음'}개
- 레이팅: ${currentProfileInfo.rating || '알 수 없음'}
- 사용 언어: ${currentLanguage || 'Python'}

`;
    } else {
      // 프로필 정보가 없어도 언어 정보는 포함
      systemPrompt += `## 사용자 정보
- 사용 언어: ${currentLanguage || 'Python'}

`;
    }

    // 문제 정보 추가
    if (currentProblemInfo) {
      systemPrompt += `## 현재 문제 정보
- 문제 번호: ${currentProblemInfo.problemId || '정보 없음'}
- 문제 제목: ${currentProblemInfo.title || '정보 없음'}
- 티어: ${currentProblemInfo.tier || '정보 없음'}

`;

      if (currentProblemInfo.problemDescription) {
        systemPrompt += `### 문제 설명
${currentProblemInfo.problemDescription}

`;
      }

      if (currentProblemInfo.inputDescription) {
        systemPrompt += `### 입력 설명
${currentProblemInfo.inputDescription}

`;
      }

      if (currentProblemInfo.outputDescription) {
        systemPrompt += `### 출력 설명
${currentProblemInfo.outputDescription}

`;
      }

      if (currentProblemInfo.sampleInputs && currentProblemInfo.sampleInputs.length > 0) {
        systemPrompt += `### 예제 입력/출력
`;
        currentProblemInfo.sampleInputs.forEach((input, index) => {
          systemPrompt += `예제 ${index + 1}:
입력:
${input}
`;
          if (currentProblemInfo.sampleOutputs && currentProblemInfo.sampleOutputs[index]) {
            systemPrompt += `출력:
${currentProblemInfo.sampleOutputs[index]}
`;
          }
        });
        systemPrompt += '\n';
      }
    }

    // 정답 가리기 모드에 따른 지시사항
    if (hideAnswer) {
      systemPrompt += `## 중요 지시사항
현재 "정답 가리기" 모드가 활성화되어 있습니다. 사용자가 직접 문제를 풀 수 있도록 도와주세요.
- 사용자가 요구하더라도 절대 직접적인 정답 코드를 제공하지 마세요.
- 힌트와 접근 방법을 단계별로 설명해주세요.
- 학생이 스스로 생각하고 풀 수 있도록 유도해주세요.
- 알고리즘 개념과 아이디어를 설명해주세요.
- 코드 예시를 제공할 때는 ${currentLanguage || 'Python'} 언어로 제공해주세요.
`;
    } else {
      systemPrompt += `## 중요 지시사항
사용자가 요청하면 정답 코드를 제공할 수 있습니다.
- 사용자의 요청에 맞게 문제를 설명해주세요.
- 사용자가 요구할 때 코드와 함께 설명해주세요.
- 코드의 각 부분이 무엇을 하는지 설명해주세요.
- 코드 예시를 제공할 때는 ${currentLanguage || 'Python'} 언어로 제공해주세요.
`;
    }

    return systemPrompt;
  };

  // 메시지 전송
  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    // 매번 최신 정보를 localStorage에서 다시 로드
    const latestProblemInfo = loadProblemInfo();
    const latestProfileInfo = loadProfileInfo();

    // 문제 정보와 프로필 정보 확인
    if (!latestProblemInfo || !latestProfileInfo) {
      alert('옜다정답 AI를 사용하려면 문제와 프로필 정보가 필요합니다.\n문제 번호와 유저 아이디를 입력하고 로드해주세요.');
      return;
    }

    // 상태 업데이트 (UI 표시용)
    setProblemInfo(latestProblemInfo);
    setProfileInfo(latestProfileInfo);

    const userMessage = input.trim();
    setInput('');
    setIsLoading(true);

    // 사용자 메시지 추가
    const newMessages = [
      ...messages,
      { role: 'user', content: userMessage }
    ];
    setMessages(newMessages);

    // 스트리밍 응답을 위한 assistant 메시지 초기화
    const assistantMessageId = Date.now();
    setMessages([
      ...newMessages,
      { role: 'assistant', content: '', id: assistantMessageId }
    ]);

    try {
      // 최신 정보로 시스템 프롬프트 생성
      const systemPrompt = createSystemPromptWithInfo(latestProblemInfo, latestProfileInfo, selectedLanguage);
      
      // 메시지 구성: 시스템 프롬프트는 첫 번째 메시지에만 포함
      // 이전 대화 기록(newMessages)에는 이미 모든 대화가 포함되어 있음
      const messagesToSend = [
        { role: 'system', content: systemPrompt },
        ...newMessages  // 이전 대화 기록 모두 포함 (user와 assistant 메시지)
      ];
      
      // 디버깅: 전송되는 메시지 수 확인 (개발 환경에서만)
      if (process.env.NODE_ENV === 'development') {
        console.log(`전송되는 메시지 수: ${messagesToSend.length}개 (시스템 프롬프트 1개 + 대화 ${newMessages.length}개)`);
      }

      const response = await fetch('/api/chatbot', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: messagesToSend,
          hideAnswer: hideAnswer,
        }),
      });

      if (!response.ok) {
        // 스트리밍이 아닌 경우 JSON 에러 응답 처리
        try {
          const errorText = await response.text();
          let error;
          try {
            error = JSON.parse(errorText);
          } catch {
            error = { error: errorText || '챗봇 응답을 가져오는데 실패했습니다.' };
          }
          throw new Error(error.error || '챗봇 응답을 가져오는데 실패했습니다.');
        } catch (parseError) {
          throw new Error('챗봇 응답을 가져오는데 실패했습니다.');
        }
      }

      // Content-Type 확인
      const contentType = response.headers.get('content-type');
      
      if (contentType && contentType.includes('text/event-stream')) {
        // SSE 스트리밍 응답 처리
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let accumulatedText = '';
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          
          if (done) {
            break;
          }

          // 버퍼에 추가
          const chunk = decoder.decode(value, { stream: true });
          buffer += chunk;
          
          // SSE 형식 파싱 (줄 단위로 처리)
          const lines = buffer.split('\n');
          // 마지막 줄은 완전하지 않을 수 있으므로 버퍼에 유지
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const jsonStr = line.slice(6).trim();
                if (!jsonStr) continue;
                
                const data = JSON.parse(jsonStr);
                
                if (data.error) {
                  throw new Error(data.error);
                }

                if (data.text) {
                  accumulatedText += data.text;
                  
                  // 실시간으로 메시지 업데이트
                  setMessages(prev => {
                    const updated = [...prev];
                    const assistantIndex = updated.findIndex(msg => msg.id === assistantMessageId);
                    if (assistantIndex !== -1) {
                      updated[assistantIndex] = {
                        ...updated[assistantIndex],
                        content: accumulatedText
                      };
                    }
                    return updated;
                  });
                }

                if (data.done) {
                  break;
                }
              } catch (parseError) {
                // JSON 파싱 오류는 무시 (불완전한 데이터일 수 있음)
                if (process.env.NODE_ENV === 'development') {
                  console.warn('SSE 파싱 경고:', parseError, 'Line:', line);
                }
              }
            }
          }
        }
        
        // 남은 버퍼 처리
        if (buffer.trim()) {
          const line = buffer.trim();
          if (line.startsWith('data: ')) {
            try {
              const jsonStr = line.slice(6).trim();
              if (jsonStr) {
                const data = JSON.parse(jsonStr);
                if (data.text) {
                  accumulatedText += data.text;
                  setMessages(prev => {
                    const updated = [...prev];
                    const assistantIndex = updated.findIndex(msg => msg.id === assistantMessageId);
                    if (assistantIndex !== -1) {
                      updated[assistantIndex] = {
                        ...updated[assistantIndex],
                        content: accumulatedText
                      };
                    }
                    return updated;
                  });
                }
              }
            } catch (parseError) {
              // 마지막 파싱 오류는 무시
            }
          }
        }

        // 최종 메시지 저장 (id 제거)
        setMessages(prev => {
          const updated = [...prev];
          const assistantIndex = updated.findIndex(msg => msg.id === assistantMessageId);
          if (assistantIndex !== -1) {
            const { id, ...messageWithoutId } = updated[assistantIndex];
            updated[assistantIndex] = messageWithoutId;
          }
          return updated;
        });
      } else {
        // 일반 JSON 응답 처리 (fallback)
        const data = await response.json();
        if (data.success && data.message) {
          setMessages(prev => {
            const updated = [...prev];
            const assistantIndex = updated.findIndex(msg => msg.id === assistantMessageId);
            if (assistantIndex !== -1) {
              updated[assistantIndex] = {
                role: 'assistant',
                content: data.message
              };
            }
            return updated;
          });
        } else {
          throw new Error('응답 형식이 올바르지 않습니다.');
        }
      }
    } catch (error) {
      console.error('챗봇 오류:', error);
      setMessages(prev => {
        const updated = [...prev];
        const assistantIndex = updated.findIndex(msg => msg.id === assistantMessageId);
        if (assistantIndex !== -1) {
          updated[assistantIndex] = {
            role: 'assistant',
            content: `오류가 발생했습니다: ${error.message}`
          };
        }
        return updated;
      });
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  // 새 대화 시작
  const handleNewChat = () => {
    if (window.confirm('새 대화를 시작하시겠습니까? 현재 대화 내용이 삭제됩니다.')) {
      setMessages([]);
      clearChatbotMessages();
    }
  };

  // 정답 가리기 토글 핸들러
  const handleHideAnswerChange = (checked) => {
    // 기존 대화 기록이 있는 경우 확인 메시지 표시
    if (messages.length > 0) {
      const action = checked ? '가리' : '허용하';
      if (window.confirm(`정답을 ${action}시면 현재 대화 내용이 삭제됩니다.\n새 대화를 시작하시겠습니까?`)) {
        setMessages([]);
        clearChatbotMessages();
        setHideAnswer(checked);
      }
    } else {
      // 대화 기록이 없으면 바로 상태 변경
      setHideAnswer(checked);
    }
  };

  // Enter 키로 전송 (Shift+Enter는 줄바꿈)
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // 마크다운 형식의 코드 블록 렌더링
  const renderMessage = (content) => {
    // 간단한 마크다운 처리 (코드 블록)
    const parts = content.split(/(```[\s\S]*?```|`[^`]+`)/);
    return parts.map((part, index) => {
      if (part.startsWith('```')) {
        const codeMatch = part.match(/```(\w+)?\n?([\s\S]*?)```/);
        if (codeMatch) {
          const language = codeMatch[1] || '';
          const code = codeMatch[2];
          return (
            <pre key={index} style={{
              backgroundColor: '#252526',
              padding: '15px',
              borderRadius: '5px',
              overflowX: 'auto',
              border: '1px solid #3e3e42',
              margin: '10px 0',
            }}>
              {language && <div style={{ color: '#858585', fontSize: '12px', marginBottom: '5px' }}>{language}</div>}
              <code style={{
                fontFamily: "'Consolas', 'Courier New', monospace",
                fontSize: '0.9em',
                whiteSpace: 'pre',
              }}>{code}</code>
            </pre>
          );
        }
      } else if (part.startsWith('`') && part.endsWith('`')) {
        const inlineCode = part.slice(1, -1);
        return (
          <code key={index} style={{
            backgroundColor: '#252526',
            padding: '2px 6px',
            borderRadius: '3px',
            fontFamily: "'Consolas', 'Courier New', monospace",
            fontSize: '0.9em',
          }}>{inlineCode}</code>
        );
      }
      // 일반 텍스트는 줄바꿈 처리 및 ** 볼드 마크다운 제거
      const cleanedPart = part.replace(/\*\*/g, '');
      return cleanedPart.split('\n').map((line, lineIndex, array) => (
        <span key={`${index}-${lineIndex}`}>
          {line}
          {lineIndex < array.length - 1 && <br />}
        </span>
      ));
    });
  };

  // 문제 정보나 프로필 정보가 없을 때
  if (!problemInfo || !profileInfo) {
    return (
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px',
        color: 'var(--color-text-primary)',
        textAlign: 'center',
      }}>
        <div style={{ fontSize: '18px', marginBottom: '20px', color: 'var(--color-accent-primary)' }}>
          옜다정답 AI를 사용하려면 문제와 프로필 정보가 필요합니다
        </div>
        <div style={{ fontSize: '14px', color: 'var(--color-text-secondary)', lineHeight: '1.6' }}>
          {!problemInfo && <div>• 문제 번호를 입력하고 "문제 가져오기"를 클릭해주세요</div>}
          {!profileInfo && <div>• 유저 아이디를 입력하고 "프로필 갱신"를 클릭해주세요</div>}
        </div>
      </div>
    );
  }

  return (
    <div style={{
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      backgroundColor: 'var(--color-bg-main)',
      overflow: 'hidden',
    }}>
      {/* 헤더 */}
      <div style={{
        padding: '10px 15px',
        borderBottom: '1px solid var(--color-border-default)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: 'var(--color-bg-header)',
      }}>
        <div style={{ 
          fontSize: '14px', 
          fontWeight: 600, 
          color: 'var(--color-text-primary)',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
        }}>
          <span>옜다정답 AI</span>
          {problemInfo && problemInfo.problemId && problemInfo.title && (
            <span style={{
              fontSize: '12px',
              fontWeight: 400,
              color: 'var(--color-text-secondary)',
              paddingLeft: '10px',
              borderLeft: '1px solid var(--color-border-default)',
            }}>
              문제 {problemInfo.problemId}: {problemInfo.title}
            </span>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          {/* 언어 선택 드롭다운 */}
          <select
            value={selectedLanguage}
            onChange={(e) => setSelectedLanguage(e.target.value)}
            style={{
              padding: '4px 8px',
              fontSize: '12px',
              backgroundColor: 'var(--color-bg-input)',
              color: 'var(--color-text-input)',
              border: '1px solid var(--color-border-input)',
              borderRadius: '4px',
              cursor: 'pointer',
              outline: 'none',
            }}
          >
            {languages.map((lang) => (
              <option key={lang} value={lang}>
                {lang}
              </option>
            ))}
          </select>
          {/* 정답 가리기 토글 */}
          <label style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '12px',
            color: 'var(--color-text-secondary)',
            cursor: 'pointer',
          }}>
            <input
              type="checkbox"
              checked={hideAnswer}
              onChange={(e) => handleHideAnswerChange(e.target.checked)}
              style={{ cursor: 'pointer' }}
            />
            정답 가리기
          </label>
          {/* 새 대화 버튼 */}
          <button
            onClick={handleNewChat}
            disabled={messages.length === 0}
            style={{
              padding: '5px 12px',
              fontSize: '12px',
              backgroundColor: messages.length === 0 ? 'var(--color-bg-sidebar)' : 'var(--color-button-secondary-bg)',
              color: 'var(--color-text-button)',
              border: 'none',
              borderRadius: '4px',
              cursor: messages.length === 0 ? 'default' : 'pointer',
              opacity: messages.length === 0 ? 0.5 : 1,
              transition: 'background-color 0.2s',
            }}
            onMouseEnter={(e) => {
              if (messages.length > 0) {
                e.currentTarget.style.backgroundColor = darkenColor('--color-button-secondary-bg');
              }
            }}
            onMouseLeave={(e) => {
              if (messages.length > 0) {
                e.currentTarget.style.backgroundColor = 'var(--color-button-secondary-bg)';
              }
            }}
          >
            새 대화
          </button>
        </div>
      </div>

      {/* 메시지 영역 */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        justifyContent: messages.length === 0 ? 'center' : 'flex-start',
        alignItems: messages.length === 0 ? 'center' : 'stretch',
      }}>
        {messages.length === 0 && (
          <div style={{
            textAlign: 'center',
            color: 'var(--color-text-secondary)',
            fontSize: '14px',
          }}>
            안녕하세요! 알고리즘 문제 풀이를 도와드리겠습니다.
            <br />
            해당 문제에 대해 궁금한 점을 저한테 알려주세요!
          </div>
        )}
        
        {messages.map((message, index) => {
          // assistant 메시지가 빈 문자열이면 렌더링하지 않음 (스트리밍 시작 전)
          if (message.role === 'assistant' && !message.content) {
            return null;
          }
          
          const isUser = message.role === 'user';
          const bubbleBg = isUser ? 'var(--color-accent-primary)' : 'var(--color-bg-card)';
          const bubbleColor = isUser ? '#ffffff' : 'var(--color-text-primary)';
          
          return (
            <div
              key={index}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: isUser ? 'flex-end' : 'flex-start',
                marginBottom: '4px',
              }}
            >
              <div style={{
                maxWidth: '80%',
                padding: '12px 16px',
                borderRadius: '18px',
                backgroundColor: bubbleBg,
                color: bubbleColor,
                fontSize: '14px',
                lineHeight: '1.6',
                wordWrap: 'break-word',
                whiteSpace: 'pre-wrap',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
              }}>
                {renderMessage(message.content)}
              </div>
            </div>
          );
        })}
        
        {isLoading && (!messages.length || messages[messages.length - 1]?.role !== 'assistant' || (messages[messages.length - 1]?.role === 'assistant' && !messages[messages.length - 1]?.content)) && (
          <div style={{
            display: 'flex',
            alignItems: 'flex-start',
            marginBottom: '4px',
          }}>
            <div style={{
              padding: '12px 16px',
              borderRadius: '18px',
              backgroundColor: 'var(--color-bg-card)',
              color: 'var(--color-text-secondary)',
              fontSize: '14px',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
            }}>
              생각 중...
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* 입력 영역 */}
      <div style={{
        padding: '16px 20px',
        borderTop: '1px solid var(--color-border-default)',
        backgroundColor: 'var(--color-bg-header)',
      }}>
        <div style={{
          display: 'flex',
          gap: '12px',
          alignItems: 'center',
          maxWidth: '100%',
        }}>
          <div style={{
            flex: 1,
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
          }}>
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={isLoading ? "탭을 닫거나 이동하면 답변이 중단됩니다 ..." : "질문을 입력하세요 ..."}
              disabled={isLoading}
              style={{
                width: '100%',
                minHeight: '52px',
                maxHeight: '140px',
                padding: '14px 16px',
                fontSize: '14px',
                fontFamily: 'inherit',
                lineHeight: '1.5',
                backgroundColor: 'var(--color-bg-input)',
                color: 'var(--color-text-primary)',
                border: '1px solid var(--color-border-input)',
                borderRadius: '12px',
                resize: 'none',
                outline: 'none',
                transition: 'all 0.2s ease',
                boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
              }}
              onFocus={(e) => {
                e.target.style.borderColor = 'var(--color-border-focus)';
                e.target.style.boxShadow = '0 0 0 3px rgba(74, 144, 226, 0.1)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = 'var(--color-border-input)';
                e.target.style.boxShadow = '0 1px 2px rgba(0, 0, 0, 0.05)';
              }}
            />
          </div>
          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            style={{
              padding: '14px 24px',
              minWidth: '80px',
              height: '52px',
              fontSize: '14px',
              fontWeight: 500,
              backgroundColor: (!input.trim() || isLoading) 
                ? 'var(--color-bg-sidebar)' 
                : 'var(--color-button-primary-bg)',
              color: (!input.trim() || isLoading)
                ? 'var(--color-text-secondary)'
                : 'var(--color-text-button)',
              border: 'none',
              borderRadius: '12px',
              cursor: (!input.trim() || isLoading) ? 'default' : 'pointer',
              opacity: (!input.trim() || isLoading) ? 0.6 : 1,
              whiteSpace: 'nowrap',
              transition: 'all 0.2s ease',
              boxShadow: (!input.trim() || isLoading) 
                ? 'none' 
                : '0 2px 4px rgba(0, 0, 0, 0.1)',
            }}
            onMouseEnter={(e) => {
              if (!(!input.trim() || isLoading)) {
                e.target.style.backgroundColor = darkenColor('--color-button-primary-bg');
                e.target.style.transform = 'translateY(-1px)';
                e.target.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.15)';
              }
            }}
            onMouseLeave={(e) => {
              if (!(!input.trim() || isLoading)) {
                e.target.style.backgroundColor = 'var(--color-button-primary-bg)';
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.1)';
              }
            }}
            onMouseDown={(e) => {
              if (!(!input.trim() || isLoading)) {
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = '0 1px 2px rgba(0, 0, 0, 0.1)';
              }
            }}
            onMouseUp={(e) => {
              if (!(!input.trim() || isLoading)) {
                e.target.style.transform = 'translateY(-1px)';
                e.target.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.15)';
              }
            }}
          >
            {isLoading ? '전송 중...' : '전송'}
          </button>
        </div>
      </div>
    </div>
  );
}

