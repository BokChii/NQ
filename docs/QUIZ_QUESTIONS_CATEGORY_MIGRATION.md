# quiz_questions.category 마이그레이션 안내

## 적용된 변경

- `quiz_questions` 테이블에 `category` 컬럼 추가
- 기존 데이터는 `quizzes.category`로 backfill
- 쇼츠 조회 시 `quiz_questions.category` 우선, 없으면 `quizzes.category` 사용

## 마이그레이션 실행

```bash
npx supabase db push
# 또는
npx supabase migration up
```

로컬 Supabase 사용 시:

```bash
npx supabase db reset
```

## n8n 워크플로우 수정

쇼츠 문항 INSERT 시 `category`를 반드시 포함하세요:

```json
{
  "quiz_id": "<quiz id>",
  "sort_order": 1,
  "category": "economy",
  "question": "...",
  "options": ["...", "...", "...", "..."],
  "correct_index": 0,
  "explanation": "...",
  "source_url": "..."
}
```

**지원 카테고리**: `economy`, `it`, `sports`, `politics`, `culture`

## 새 시드/스크립트 작성 시

`quiz_questions` INSERT에 `category` 컬럼을 포함하면 됩니다. 마이그레이션 `20240313000014` 이후에 실행되는 시드만 해당됩니다.
