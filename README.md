# NQ (News Quotient)

Gamified News Platform — 뉴스 퀴즈로 지적 성장을 증명하고, 대학/지역 간 경쟁을 즐기는 서비스입니다.

## Tech Stack

- **Frontend**: Next.js 14 (App Router), Tailwind CSS, Framer Motion, Shadcn-style UI
- **Backend/DB**: Supabase (Auth, PostgreSQL, Realtime)
- **Automation**: n8n (뉴스 스크래핑 & AI 퀴즈 생성)

## 설정

1. Supabase 프로젝트 생성 후 `.env.local`에 다음 추가:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

2. Supabase SQL Editor에서 `supabase/migrations/` 내 `.sql` 파일들을 **순서대로** 실행하세요 (01 ~ 10).  
   (참고: `.env.example`에 필요한 환경 변수 목록이 있습니다.)

3. **Edge Function 배포** (마이그레이션 8번 이후 필수 — 아레나/쇼츠 XP·레벨·스트릭 적용):
   - 터미널에서 한 번만: `npx supabase login` (브라우저에서 로그인)
   - 프로젝트 연결: `npx supabase link --project-ref <프로젝트참조ID>`  
     (참조 ID: 대시보드 URL의 `https://app.supabase.com/project/여기` 또는 Settings → General)
   - **시크릿 설정**: Supabase 대시보드 → **Project Settings** → **Edge Functions** → **Secrets**에서  
     `SUPABASE_ANON_KEY` 추가, 값은 **anon public** 키(API 설정에서 복사, `.env.local`의 `NEXT_PUBLIC_SUPABASE_ANON_KEY`와 동일).
   - 배포: `npx supabase functions deploy submit-quiz`

4. **비밀번호 찾기** 사용 시: Supabase 대시보드 → **Authentication** → **URL Configuration** → **Redirect URLs**에  
   `https://your-domain.com/auth/callback` (또는 로컬: `http://localhost:3000/auth/callback`) 추가.

5. 개발 서버 실행:

```bash
npm install
npm run dev
```

(Edge Function 배포 후 아레나 제출 시 서버에서 XP/레벨/등급/스트릭이 반영됩니다.)

## 주요 기능

- **Daily Arena**: 매일 10문항 공통 퀴즈, 전체 랭킹 반영
- **Category Shorts**: 경제/IT/스포츠 등 카테고리별 무제한 퀴즈, XP/레벨 반영
- **nq 지수**: `nq = (정답률 × 난이도) + log(연속+1)`
- **Rivalry Dashboard**: 대학·지역별 평균 nq 랭킹
- **Share**: 인스타 스토리용 nq 인증 카드 이미지 생성

## 폴더 구조

- `app/(auth)/` — 로그인, 회원가입, 온보딩
- `app/(main)/` — 아레나, 쇼츠, 대결, 프로필
- `components/ui/` — Button, Card, Skeleton, Tabs 등
- `components/quiz/` — 퀴즈 카드, 쇼츠 스와이퍼
- `components/rivalry/` — 대결 대시보드
- `components/share/` — nq 인증 카드
- `lib/supabase/` — 클라이언트/서버/미들웨어, 타입
- `supabase/migrations/` — DB 스키마, 시드, RPC
- `supabase/functions/` — Edge Function (submit-quiz)

## 배포

- **권장**: [Vercel](https://vercel.com)에 연결 후 배포. Next.js 14 App Router 기본 설정으로 동작합니다.
- **환경 변수**: Vercel 프로젝트 설정에서 다음 변수를 추가하세요.  
  `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` (값은 Supabase 대시보드 → Project Settings → API에서 복사).
- **DB**: 배포 전에 Supabase에서 마이그레이션(01~10)을 모두 실행해 두세요.
- **Edge Function**: `submit-quiz`는 Supabase 쪽에서 별도 배포(`npx supabase functions deploy submit-quiz`)가 필요합니다.
- **Redirect URL**: 비밀번호 찾기 사용 시 Supabase **Authentication → URL Configuration**에 배포 도메인 기준 `https://your-domain.com/auth/callback`을 추가하세요.

## n8n 연동

Daily Arena·카테고리(쇼츠) 퀴즈를 n8n으로 자동 생성할 수 있습니다.  
뉴스 스크래핑 → LLM으로 4지선다 퀴즈 생성 → Supabase `quizzes`, `quiz_questions`에 INSERT.  
**상세 가이드**: [docs/N8N_QUIZ.md](docs/N8N_QUIZ.md) — 테이블 구조, Daily Arena/카테고리 규칙, REST API 예시, n8n 노드 사용법.
