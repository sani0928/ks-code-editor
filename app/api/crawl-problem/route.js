import * as cheerio from 'cheerio';

export async function POST(request) {
  try {
    const { problemId } = await request.json();

    if (!problemId) {
      return Response.json({ error: 'Problem ID is required' }, { status: 400 });
    }

    // 1. solved.ac API로 티어 정보 가져오기
    const tierResponse = await fetch(`https://solved.ac/api/v3/problem/show?problemId=${problemId}`);
    let tier = null;
    if (tierResponse.ok) {
      const tierData = await tierResponse.json();
      const level = tierData.level;
      if (level) {
        const romanNumerals = { 1: "V", 2: "IV", 3: "III", 4: "II", 5: "I" };
        let tierName, tierLevel;
        
        if (level <= 5) {
          tierName = "Bronze";
          tierLevel = level;
        } else if (level <= 10) {
          tierName = "Silver";
          tierLevel = level - 5;
        } else if (level <= 15) {
          tierName = "Gold";
          tierLevel = level - 10;
        } else if (level <= 20) {
          tierName = "Platinum";
          tierLevel = level - 15;
        } else if (level <= 25) {
          tierName = "Diamond";
          tierLevel = level - 20;
        } else if (level <= 30) {
          tierName = "Ruby";
          tierLevel = level - 25;
        } else {
          tier = "Master";
        }
        
        if (!tier) {
          tier = `${tierName} ${romanNumerals[tierLevel]}`;
        }
      }
    }

    // 2. 백준 문제 페이지 크롤링
    const url = `https://www.acmicpc.net/problem/${problemId}`;
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });

    if (!response.ok) {
      return Response.json({ error: 'Problem not found' }, { status: 404 });
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    // 문제 정보 추출
    const title = $('#problem_title').text().trim();
    
    // 문제 통계 정보 추출
    const problemInfo = {
      timeLimit: null,
      memoryLimit: null,
      submissions: null,
      correctAnswers: null,
      correctUsers: null,
      correctRate: null
    };
    
    const infoTable = $('#problem_title').closest('div').nextAll('table').first();
    const tableToUse = infoTable.length > 0 ? infoTable : $('table').first();
    
    if (tableToUse.length > 0) {
      const rows = tableToUse.find('tr');
      
      if (rows.length >= 2) {
        const headerRow = rows.eq(0);
        const headers = headerRow.find('th, td').map((i, el) => $(el).text().trim()).get();
        
        const dataRow = rows.eq(1);
        const values = dataRow.find('td').map((i, el) => $(el).text().trim()).get();
        
        headers.forEach((header, index) => {
          if (index < values.length) {
            const value = values[index];
            const headerLower = header.toLowerCase();
            
            if (headerLower.includes('시간') || headerLower.includes('time')) {
              problemInfo.timeLimit = value;
            } else if (headerLower.includes('메모리') || headerLower.includes('memory')) {
              problemInfo.memoryLimit = value;
            } else if (headerLower.includes('제출') || headerLower.includes('submission')) {
              problemInfo.submissions = value;
            } else if ((headerLower.includes('정답') || headerLower.includes('correct')) && 
                       !headerLower.includes('비율') && !headerLower.includes('rate') && 
                       !headerLower.includes('맞힌') && !headerLower.includes('맞은') &&
                       !headerLower.includes('people')) {
              problemInfo.correctAnswers = value;
            } else if (headerLower.includes('맞힌 사람') || headerLower.includes('맞은 사람') || 
                       (headerLower.includes('people') && headerLower.includes('right'))) {
              problemInfo.correctUsers = value;
            } else if (headerLower.includes('정답 비율') || headerLower.includes('rate') || 
                       headerLower.includes('정답률')) {
              problemInfo.correctRate = value;
            }
          }
        });
      }
    }
    
    // 이미지 URL을 절대 경로로 변환하는 함수
    const convertImageUrls = (html) => {
      if (!html) return '';
      const $html = cheerio.load(html);
      $html('img').each((i, img) => {
        const $img = $html(img);
        const src = $img.attr('src') || '';
        if (src && !src.startsWith('http')) {
          const fullUrl = src.startsWith('/') 
            ? `https://www.acmicpc.net${src}`
            : `https://www.acmicpc.net/${src}`;
          $img.attr('src', fullUrl);
        }
      });
      return $html.html();
    };
    
    const problemDescriptionHtml = $('#problem_description').html() || '';
    const inputDescriptionHtml = $('#problem_input').html() || '';
    const outputDescriptionHtml = $('#problem_output').html() || '';
    
    const problemDescription = convertImageUrls(problemDescriptionHtml);
    const inputDescription = convertImageUrls(inputDescriptionHtml);
    const outputDescription = convertImageUrls(outputDescriptionHtml);

    // 예제 입력/출력 추출
    const sampleInputs = [];
    const sampleOutputs = [];

    $('pre[id^="sample-input"]').each((i, elem) => {
      sampleInputs.push($(elem).text());
    });
    $('pre[id^="sample-output"]').each((i, elem) => {
      sampleOutputs.push($(elem).text());
    });

    if (sampleInputs.length === 0) {
      $('pre.sampledata').each((i, elem) => {
        const text = $(elem).text();
        if (i % 2 === 0) {
          sampleInputs.push(text);
        } else {
          sampleOutputs.push(text);
        }
      });
    }

    // HTML 이스케이프 함수
    function escapeHtml(text) {
      if (!text) return '';
      const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
      };
      return String(text).replace(/[&<>"']/g, m => map[m]);
    }

    // 티어별 색상 반환 함수
    function getTierColor(tierName) {
      if (!tierName) return '#007acc';
      
      const tier = tierName.toLowerCase();
      if (tier.includes('bronze')) return '#AD5600'; // 브론즈 - 황동색
      if (tier.includes('silver')) return '#435F7A'; // 실버 - 은색
      if (tier.includes('gold')) return '#EC9A00'; // 골드 - 금색
      if (tier.includes('platinum')) return '#27E2A4'; // 플래티넘 - 청록색
      if (tier.includes('diamond')) return '#00B4FC'; // 다이아몬드 - 파란색
      if (tier.includes('ruby')) return '#FF0062'; // 루비 - 분홍색
      if (tier.includes('master')) return '#000000'; // 마스터 - 검은색
      
      return '#007acc'; // 기본 색상
    }

    // problem.html 내용 생성 (HTML 형식 - 이미지 포함)
    let problemHtml = `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>문제 ${problemId}: ${escapeHtml(title || '제목 없음')}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      max-width: 1200px;
      margin: 0 auto;
      padding: 20px;
      background-color: #1e1e1e;
      color: #cccccc;
    }
    h1 {
      color: #4ec9b0;
      border-bottom: 2px solid #3e3e42;
      padding-bottom: 10px;
    }
    h2 {
      color: #4ec9b0;
      margin-top: 30px;
      border-bottom: 1px solid #3e3e42;
      padding-bottom: 5px;
    }
    h3 {
      color: #cccccc;
      margin-top: 20px;
    }
    .tier {
      display: inline-block;
      color: white;
      padding: 4px 12px;
      border-radius: 4px;
      font-size: 14px;
      margin-bottom: 20px;
      font-weight: 600;
    }
    pre {
      background-color: #252526;
      padding: 15px;
      border-radius: 5px;
      overflow-x: auto;
      border: 1px solid #3e3e42;
    }
    code {
      background-color: #252526;
      padding: 2px 6px;
      border-radius: 3px;
      font-family: 'Consolas', 'Courier New', monospace;
    }
    img {
      max-width: 100%;
      height: auto;
      margin: 10px 0;
      border: 1px solid #3e3e42;
      border-radius: 5px;
    }
    hr {
      border: none;
      border-top: 1px solid #3e3e42;
      margin: 30px 0;
    }
  </style>
</head>
<body>
  <h1>문제 ${problemId}: ${escapeHtml(title || '제목 없음')}</h1>
  ${tier ? `<div class="tier" style="background-color: ${getTierColor(tier)};">${escapeHtml(tier)}</div>` : ''}
  
  ${(problemInfo.timeLimit || problemInfo.memoryLimit || problemInfo.submissions || 
      problemInfo.correctAnswers || problemInfo.correctUsers || problemInfo.correctRate) ? `
  <table style="width: 100%; border-collapse: collapse; margin: 20px 0; background-color: #252526; border: 1px solid #3e3e42; border-radius: 5px;">
    <thead>
      <tr style="background-color: #2d2d30;">
        <th style="padding: 10px; text-align: left; border: 1px solid #3e3e42; color: #4ec9b0;">시간 제한</th>
        <th style="padding: 10px; text-align: left; border: 1px solid #3e3e42; color: #4ec9b0;">메모리 제한</th>
        <th style="padding: 10px; text-align: left; border: 1px solid #3e3e42; color: #4ec9b0;">제출</th>
        <th style="padding: 10px; text-align: left; border: 1px solid #3e3e42; color: #4ec9b0;">정답</th>
        <th style="padding: 10px; text-align: left; border: 1px solid #3e3e42; color: #4ec9b0;">맞힌 사람</th>
        <th style="padding: 10px; text-align: left; border: 1px solid #3e3e42; color: #4ec9b0;">정답 비율</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td style="padding: 10px; border: 1px solid #3e3e42; color: #cccccc;">${problemInfo.timeLimit ? escapeHtml(problemInfo.timeLimit) : '-'}</td>
        <td style="padding: 10px; border: 1px solid #3e3e42; color: #cccccc;">${problemInfo.memoryLimit ? escapeHtml(problemInfo.memoryLimit) : '-'}</td>
        <td style="padding: 10px; border: 1px solid #3e3e42; color: #cccccc;">${problemInfo.submissions ? escapeHtml(problemInfo.submissions) : '-'}</td>
        <td style="padding: 10px; border: 1px solid #3e3e42; color: #cccccc;">${problemInfo.correctAnswers ? escapeHtml(problemInfo.correctAnswers) : '-'}</td>
        <td style="padding: 10px; border: 1px solid #3e3e42; color: #cccccc;">${problemInfo.correctUsers ? escapeHtml(problemInfo.correctUsers) : '-'}</td>
        <td style="padding: 10px; border: 1px solid #3e3e42; color: #cccccc;">${problemInfo.correctRate ? escapeHtml(problemInfo.correctRate) : '-'}</td>
      </tr>
    </tbody>
  </table>
  ` : ''}
  
  <hr>`;

    if (problemDescription) {
      problemHtml += `\n  <h2>문제 설명</h2>\n  <div>${problemDescription}</div>\n`;
    }

    if (inputDescription) {
      problemHtml += `\n  <h2>입력</h2>\n  <div>${inputDescription}</div>\n`;
    }

    if (outputDescription) {
      problemHtml += `\n  <h2>출력</h2>\n  <div>${outputDescription}</div>\n`;
    }

    // 예제 입력과 출력을 번갈아가면서 표시
    const maxExamples = Math.max(sampleInputs.length, sampleOutputs.length);
    if (maxExamples > 0) {
      for (let i = 0; i < maxExamples; i++) {
        problemHtml += `\n  <h2>예제 ${i + 1}</h2>\n`;
        
        if (i < sampleInputs.length) {
          problemHtml += `\n  <h3>예제 입력 ${i + 1}</h3>\n  <pre><code>${escapeHtml(sampleInputs[i])}</code></pre>\n`;
        }
        
        if (i < sampleOutputs.length) {
          problemHtml += `\n  <h3>예제 출력 ${i + 1}</h3>\n  <pre><code>${escapeHtml(sampleOutputs[i])}</code></pre>\n`;
        }
      }
    }

    problemHtml += `\n</body>\n</html>`;

    return Response.json({
      success: true,
      problemHtml: problemHtml,
      problemInfo: {
        problemId,
        title,
        tier,
        problemDescription,
        inputDescription,
        outputDescription,
        sampleInputs,
        sampleOutputs,
        statistics: problemInfo
      }
    });

  } catch (error) {
    console.error('Crawling error:', error);
    return Response.json(
      { error: 'Failed to crawl problem', message: error.message },
      { status: 500 }
    );
  }
}

