# n8n 퀴즈 자동 생성 가이드

n8n 워크플로로 Daily Arena 퀴즈와 카테고리(쇼츠) 퀴즈를 자동 생성하는 방법입니다.

---

## 1. 테이블 구조

### `public.quizzes`

| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | uuid | PK, 생략 시 자동 생성 |
| title | text | 퀴즈 제목 |
| category | text | `economy` \| `it` \| `sports` \| 기타 |
| difficulty | numeric(3,2) | 0.5 ~ 2.0 |
| quiz_date | date | **Daily Arena만** 사용 (해당 날짜) |
| daily_arena | boolean | true = Daily Arena, false = 쇼츠용 |
| created_at | timestamptz | 자동 |

### `public.quiz_questions`

| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | uuid | PK, 생략 시 자동 생성 |
| quiz_id | uuid | quizzes.id |
| sort_order | int | 1, 2, 3, … |
| question | text | 문제 문장 |
| options | jsonb | **문자열 배열** `["보기1","보기2","보기3","보기4"]` |
| correct_index | int | 0~3 (정답 인덱스) |
| explanation | text | 해석 (선택) |
| source_url | text | 관련 뉴스 URL (선택) |
| source_date | date | 뉴스 일자 (선택) |
| category | text | **쇼츠용** `economy` \| `it` \| `sports` \| 기타. 지정 시 문항 단위 카테고리 관리 |
| created_at | timestamptz | 자동 |

RLS가 켜져 있으므로 **INSERT는 service_role 키**로 해야 합니다. anon 키로는 퀴즈/문제 삽입이 불가합니다.

---

## 2. Daily Arena 퀴즈 (매일 1회)

- **규칙**: `daily_arena = true`, `quiz_date = 당일 날짜`, 문제 수는 보통 **10개**.
- **주의**: 같은 `quiz_date`에 퀴즈가 이미 있으면 중복 생성하지 않도록 워크플로에서 체크 권장.

### 2.1 퀴즈 1건 INSERT

```json
{
  "title": "Daily Arena 2025-03-14",
  "category": "daily",
  "difficulty": 1,
  "quiz_date": "2025-03-14",
  "daily_arena": true
}
```

Supabase REST: `POST /rest/v1/quizzes`  
Headers: `apikey: <SUPABASE_SERVICE_ROLE_KEY>`, `Authorization: Bearer <SUPABASE_SERVICE_ROLE_KEY>`, `Content-Type: application/json`, `Prefer: return=representation`

응답에 반환된 `id`를 다음 단계에서 사용.

### 2.2 문제들 INSERT

각 문제마다 한 번씩 `POST /rest/v1/quiz_questions`:

```json
{
  "quiz_id": "<위에서 받은 quiz id>",
  "sort_order": 1,
  "question": "다음 중 올바른 설명은?",
  "options": ["보기1", "보기2", "보기3", "보기4"],
  "correct_index": 0,
  "explanation": "정답 해석입니다."
}
```

`sort_order`를 1~10으로 두고 10개 넣으면 됩니다.

---

## 3. 카테고리(쇼츠) 퀴즈

- **규칙**: `daily_arena = false`, `quiz_date`는 비우거나 NULL. `category`는 `economy`, `it`, `sports` 등.
- 쇼츠는 **퀴즈당 4문항**이 기본입니다 (1 quiz = 4 rows in quiz_questions).

### 3.1 퀴즈 1건 INSERT

```json
{
  "title": "경제 퀴즈 – 금융 시장",
  "category": "economy",
  "difficulty": 1.2,
  "daily_arena": false
}
```

### 3.2 해당 퀴즈에 문제 4개 INSERT

`quiz_id`는 위에서 반환된 id. `sort_order` 1~4, `options`는 4개 문자열 배열, `correct_index` 0~3. **`category`는 쇼츠 문항 단위 관리용으로 반드시 지정** (예: `economy`, `it`, `sports`, `politics`, `culture`).

```json
{
  "quiz_id": "<quiz id>",
  "sort_order": 1,
  "category": "economy",
  "question": "다음 중 맞는 것은?",
  "options": ["금리 인상은 물가에 영향 없다", "주식은 단기 변동이 크다", "예금 보험은 없다", "환율은 수출에 무관하다"],
  "correct_index": 1,
  "explanation": "주식 시장은 단기 변동이 큰 편입니다.",
  "source_url": "https://example.com/news/123"
}
```

---

## 4. n8n에서 실행 방법

### 방법 A: Supabase 노드 사용

1. n8n에 Supabase 연동 추가 (Credentials). **Service Role Key** 사용 (프로젝트 설정 → API).
2. **Insert** 동작으로 `quizzes`에 1건 삽입 → 응답에서 `id` 추출.
3. **Loop** 또는 **SplitInBatches**로 문제 배열을 돌면서 **Insert** → `quiz_questions`에 삽입. 각 항목에 `quiz_id` 설정.

### 방법 B: HTTP Request 노드

1. **Supabase REST API**  
   - URL: `https://<PROJECT_REF>.supabase.co/rest/v1/quizzes`  
   - Method: POST  
   - Headers:  
     - `apikey`: Service Role Key  
     - `Authorization`: `Bearer <Service Role Key>`  
     - `Content-Type`: application/json  
     - `Prefer`: return=representation  
   - Body: 위 JSON 예시처럼 전달.

2. 퀴즈 생성 응답에서 `id`를 가져와 다음 노드에서 `quiz_questions`용 `POST .../rest/v1/quiz_questions` 호출 시 `quiz_id`로 사용.

### 스케줄

- **Daily Arena**: Cron 트리거로 매일 새벽(또는 원하는 시간) 1회 실행. 당일 `quiz_date`로 1개 퀴즈 + 10문항 삽입.
- **카테고리 퀴즈**: 주기적으로 실행하거나, 뉴스 수집/요약 파이프라인 끝단에서 퀴즈 1개(4문항) 생성해 삽입.

---

## 5. 보안

- **Service Role Key**는 절대 프론트엔드나 공개 저장소에 두지 말 것.
- n8n Credentials에만 저장하고, 가능하면 n8n 자체를 비공개 네트워크에서만 접근하도록 운영.

---

## 6. 참고

- 시드 예시: `supabase/migrations/20240313000010_seed_shorts_economy.sql`
- 앱에서 Daily Arena는 `daily_arena = true`이고 `quiz_date = 오늘`인 퀴즈 1개를 사용.
- 쇼츠는 `daily_arena = false`이고 `quiz_questions.category`(또는 `quizzes.category`)별로 문항 목록을 불러옵니다. 문항 INSERT 시 `category`를 지정하면 관리가 용이합니다.
