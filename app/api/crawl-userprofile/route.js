import { escapeHtml, convertTierLevel, getTierColor } from '../../../lib/utils';

export async function POST(request) {
  try {
    const { handle } = await request.json();

    if (!handle) {
      return Response.json({ error: 'User handle is required' }, { status: 400 });
    }

    // solved.ac API로 사용자 정보 가져오기
    const response = await fetch(`https://solved.ac/api/v3/user/show?handle=${encodeURIComponent(handle)}`);
    
    if (!response.ok) {
      if (response.status === 404) {
        return Response.json({ error: 'User not found' }, { status: 404 });
      }
      return Response.json({ error: 'Failed to fetch user profile' }, { status: response.status });
    }

    const userData = await response.json();


    // 날짜 포맷팅
    function formatDate(dateString) {
      if (!dateString) return '-';
      const date = new Date(dateString);
      return date.toLocaleDateString('ko-KR', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
    }

    // 숫자 포맷팅
    function formatNumber(num) {
      if (num === null || num === undefined) return '-';
      return num.toLocaleString('ko-KR');
    }

    const tier = convertTierLevel(userData.tier);
    const tierColor = getTierColor(tier);

    // profile.html 내용 생성
    let profileHtml = `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(userData.handle)} - 프로필</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      max-width: 1200px;
      margin: 0 auto;
      padding: 20px;
      background-color: var(--color-bg-main, #1e1e1e);
      color: var(--color-text-primary, #cccccc);
    }
    h1 {
      border-bottom: 2px solid var(--color-border-default, #3e3e42);
      padding-bottom: 10px;
      margin-bottom: 20px;
    }
    h2 {
      color: var(--color-button-secondary-bg, #2d8474);
      margin-top: 30px;
      border-bottom: 1px solid var(--color-border-default, #3e3e42);
      padding-bottom: 5px;
    }
    .tier {
      display: inline-block;
      color: var(--color-text-button, #ffffff);
      padding: 6px 16px;
      border-radius: 4px;
      font-size: 16px;
      margin-bottom: 20px;
      font-weight: 600;
    }
    .bio {
      color: var(--color-text-secondary, #858585);
      font-size: 14px;
      margin-top: 10px;
      margin-bottom: 20px;
      line-height: 1.5;
    }
    .profile-info {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 15px;
      margin: 20px 0;
    }
    .info-item {
      background-color: var(--color-bg-sidebar, #252526);
      padding: 15px;
      border-radius: 5px;
      border: 1px solid var(--color-border-default, #3e3e42);
    }
    .info-label {
      color: var(--color-text-secondary, #858585);
      font-size: 12px;
      text-transform: uppercase;
      margin-bottom: 5px;
    }
    .info-value {
      color: var(--color-text-primary, #cccccc);
      font-size: 16px;
      font-weight: 600;
    }
    .rating-details {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      gap: 15px;
      margin: 20px auto;
      max-width: 800px;
    }
    .rating-item {
      background-color: var(--color-bg-sidebar, #252526);
      padding: 15px;
      border-radius: 5px;
      border: 1px solid var(--color-border-default, #3e3e42);
      text-align: center;
    }
    .rating-label {
      color: var(--color-text-secondary, #858585);
      font-size: 12px;
      margin-bottom: 8px;
    }
    .rating-value {
      color: var(--color-text-primary, #cccccc);
      font-size: 20px;
      font-weight: 600;
    }
    a {
      color: inherit;
      text-decoration: none;
    }
    a:hover {
      text-decoration: underline;
    }
  </style>
</head>
<body>
  <h1 style="color: ${tierColor};"><a href="https://solved.ac/profile/${encodeURIComponent(userData.handle)}" target="_blank" rel="noopener noreferrer">${escapeHtml(userData.handle)}</a></h1>
  ${tier ? `<div class="tier" style="background-color: ${tierColor};">${escapeHtml(tier)}</div>` : ''}
  <div class="bio">${userData.bio && userData.bio.trim() ? escapeHtml(userData.bio) : '자기소개가 없습니다.'}</div>
  
  <div class="profile-info">
    <div class="info-item">
      <div class="info-label">전체 레이팅</div>
      <div class="info-value">${formatNumber(userData.rating)}</div>
    </div>
    <div class="info-item">
      <div class="info-label">전체 순위</div>
      <div class="info-value">${formatNumber(userData.rank)}위</div>
    </div>
    <div class="info-item">
      <div class="info-label">Class</div>
      <div class="info-value">${userData.class !== null && userData.class !== undefined ? userData.class : '-'}</div>
    </div>
    <div class="info-item">
      <div class="info-label">해결한 문제 수</div>
      <div class="info-value">${formatNumber(userData.solvedCount)}개</div>
    </div>
    <div class="info-item">
      <div class="info-label">최대 연속 해결 일수</div>
      <div class="info-value">${formatNumber(userData.maxStreak)}일</div>
    </div>
    <div class="info-item">
      <div class="info-label">가입일</div>
      <div class="info-value">${formatDate(userData.joinedAt)}</div>
    </div>
  </div>

  <h2>전체 레이팅 세부 정보</h2>
  <div class="rating-details">
    <div class="rating-item">
      <div class="rating-label">문제 해결</div>
      <div class="rating-value">${formatNumber(userData.ratingByProblemsSum)}</div>
    </div>
    <div class="rating-item">
      <div class="rating-label">클래스</div>
      <div class="rating-value">${formatNumber(userData.ratingByClass)}</div>
    </div>
    <div class="rating-item">
      <div class="rating-label">해결한 문제 수</div>
      <div class="rating-value">${formatNumber(userData.ratingBySolvedCount)}</div>
    </div>
    <div class="rating-item">
      <div class="rating-label">투표 수</div>
      <div class="rating-value">${formatNumber(userData.ratingByVoteCount)}</div>
    </div>
  </div>
</body>
</html>`;

    return Response.json({
      success: true,
      profileHtml: profileHtml,
      profileInfo: {
        handle: userData.handle,
        joinedAt: userData.joinedAt,
        rank: userData.rank,
        solvedCount: userData.solvedCount,
        maxStreak: userData.maxStreak,
        class: userData.class,
        tier: tier,
        rating: userData.rating,
        ratingByProblemsSum: userData.ratingByProblemsSum,
        ratingByClass: userData.ratingByClass,
        ratingBySolvedCount: userData.ratingBySolvedCount,
        ratingByVoteCount: userData.ratingByVoteCount
      }
    });

  } catch (error) {
    console.error('User profile crawling error:', error);
    return Response.json(
      { error: 'Failed to fetch user profile', message: error.message },
      { status: 500 }
    );
  }
}

