## 배포

### Vercel 배포

1. [Vercel](https://vercel.com)에 프로젝트를 연결합니다.
2. 환경 변수를 설정합니다:
   - **Settings** → **Environment Variables**로 이동
   - 다음 환경 변수를 추가:
     ```
     NEXT_PUBLIC_SITE_URL=https://ks-code-editor.com
     ```
3. 배포가 완료되면 자동으로 프로덕션 환경으로 빌드됩니다.

### 환경 변수

프로젝트는 개발 환경과 프로덕션 환경을 자동으로 구분합니다:

- **개발 환경** (`npm run dev`): `http://localhost:3000` 자동 사용
- **프로덕션 환경**: `NEXT_PUBLIC_SITE_URL` 환경 변수 사용 (기본값: `https://ks-code-editor.com`)

환경 변수는 다음 파일에서 사용됩니다:
- `app/layout.js` - SEO 메타데이터
- `app/robots.ts` - robots.txt 생성
- `app/sitemap.ts` - sitemap.xml 생성

### 로컬 개발 시 환경 변수 설정 (선택사항)

로컬에서도 프로덕션과 동일한 환경을 테스트하려면 `.env.local` 파일을 생성하세요:

```bash
# .env.local
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```
