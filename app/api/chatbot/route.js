import { NextResponse } from 'next/server';
import { ChatOpenAI } from '@langchain/openai';
import { ChatPromptTemplate, MessagesPlaceholder } from '@langchain/core/prompts';
import { InMemoryChatMessageHistory } from '@langchain/core/chat_history';
import { RunnableWithMessageHistory } from '@langchain/core/runnables';
import { HumanMessage, AIMessage } from '@langchain/core/messages';

export async function POST(request) {
  try {
    const { messages, hideAnswer } = await request.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: 'Messages array is required' },
        { status: 400 }
      );
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'OpenAI API key is not configured' },
        { status: 500 }
      );
    }

    // 시스템 프롬프트와 대화 기록을 분리
    const systemMessage = messages.find(msg => msg.role === 'system');
    const conversationMessages = messages.filter(msg => msg.role !== 'system');

    // 현재 사용자 메시지 (마지막 메시지)
    const currentUserMessage = conversationMessages[conversationMessages.length - 1];
    if (!currentUserMessage || currentUserMessage.role !== 'user') {
      return NextResponse.json(
        { error: 'Last message must be from user' },
        { status: 400 }
      );
    }

    // ChatOpenAI 모델 초기화 (스트리밍 활성화)
    const model = new ChatOpenAI({
      openAIApiKey: apiKey,
      modelName: 'gpt-4o-mini',
      temperature: 0.7,
      maxTokens: 2000,
      streaming: true,
    });

    // 프롬프트 템플릿 생성
    const prompt = ChatPromptTemplate.fromMessages([
      ['system', systemMessage?.content || 'You are a helpful assistant.'],
      new MessagesPlaceholder('history'),
      ['human', '{question}'],
    ]);

    // 체인 생성 (프롬프트 + LLM)
    const chain = prompt.pipe(model);

    // 대화 기록을 InMemoryChatMessageHistory에 로드
    const chatHistory = new InMemoryChatMessageHistory();
    
    // 기존 대화 기록 로드
    for (let i = 0; i < conversationMessages.length - 1; i += 2) {
      const userMsg = conversationMessages[i];
      const assistantMsg = conversationMessages[i + 1];
      
      if (userMsg && userMsg.role === 'user') {
        await chatHistory.addMessage(new HumanMessage(userMsg.content));
      }
      if (assistantMsg && assistantMsg.role === 'assistant') {
        await chatHistory.addMessage(new AIMessage(assistantMsg.content));
      }
    }

    // 세션 ID 생성 (클라이언트별로 고유한 세션 사용)
    const sessionId = 'default-session';

    // RunnableWithMessageHistory로 메모리 관리 체인 생성
    const chainWithHistory = new RunnableWithMessageHistory({
      runnable: chain,
      getMessageHistory: async () => chatHistory,
      inputMessagesKey: 'question',
      historyMessagesKey: 'history',
    });

    // SSE 스트리밍 응답 생성
    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        
        try {
          // RunnableWithMessageHistory의 공식적인 stream 메서드 사용
          const streamResponse = await chainWithHistory.stream(
            { question: currentUserMessage.content },
            { configurable: { sessionId: sessionId } }
          );

          // 스트림 데이터 처리
          for await (const chunk of streamResponse) {
            let text = '';
            
            // RunnableWithMessageHistory.stream()의 응답 형식 처리
            // chunk는 보통 AIMessageChunk 형식이거나 문자열일 수 있음
            if (typeof chunk === 'string') {
              text = chunk;
            } else if (chunk && typeof chunk === 'object') {
              // content 속성 확인 (AIMessageChunk의 일반적인 응답 형식)
              if (chunk.response !== undefined) {
                text = typeof chunk.response === 'string' ? chunk.response : String(chunk.response);
              } else if (chunk.content !== undefined) {
                // AIMessageChunk 형식
                text = typeof chunk.content === 'string' ? chunk.content : String(chunk.content);
              } else if (chunk.text !== undefined) {
                text = typeof chunk.text === 'string' ? chunk.text : String(chunk.text);
              } else if (chunk.output !== undefined) {
                text = typeof chunk.output === 'string' ? chunk.output : String(chunk.output);
              } else {
                // 객체의 모든 속성 확인
                const keys = Object.keys(chunk);
                for (const key of keys) {
                  if (key === 'response' || key === 'content' || key === 'text' || key === 'output') {
                    const value = chunk[key];
                    if (typeof value === 'string') {
                      text = value;
                      break;
                    }
                  }
                }
              }
            }

            if (text) {
              // SSE 형식으로 전송
              const data = `data: ${JSON.stringify({ text, done: false })}\n\n`;
              controller.enqueue(encoder.encode(data));
            }
          }

          // RunnableWithMessageHistory가 자동으로 메모리에 응답을 저장하므로 수동 저장 불필요
          // 메모리는 이미 chainWithHistory 내부에서 관리됨

          // 완료 신호 전송
          const doneData = `data: ${JSON.stringify({ text: '', done: true })}\n\n`;
          controller.enqueue(encoder.encode(doneData));
          controller.close();
        } catch (error) {
          const errorData = `data: ${JSON.stringify({ error: error.message, done: true })}\n\n`;
          controller.enqueue(encoder.encode(errorData));
          controller.close();
        }
      },
    });

    // SSE 헤더 설정
    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    console.error('Chatbot API error:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    );
  }
}
