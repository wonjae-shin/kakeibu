# 카드 알림 자동 등록 설정 가이드

카드 결제 알림을 자동으로 가계부에 전송하는 방법입니다.
**Android 전용** — iOS는 시스템 제약으로 지원 불가

---

## 1단계: JWT 토큰 확인

앱에 로그인 후 브라우저 개발자 도구(F12) → Console에서:

```js
localStorage.getItem('token')
```

출력된 토큰 값을 복사해두세요. (예: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`)

> 토큰은 로그인할 때마다 갱신됩니다. 만료 시 재설정 필요.

---

## 방법 A: MacroDroid (추천, 무료)

### 설치
- Play Store에서 **MacroDroid** 검색 후 설치

### 설정 순서

1. **MacroDroid 앱 열기** → 매크로 추가 (+)

2. **트리거 설정**
   - 트리거 추가 → **알림 수신**
   - 앱 선택: 카드사 앱 선택 (신한카드, KB국민카드 등)
   - 알림 패키지: 여러 개 선택 가능

3. **조건 설정** (선택)
   - 알림 텍스트에 `원` 포함 → 결제 알림만 필터

4. **액션 설정**
   - 액션 추가 → **HTTP 요청**
   - URL: `http://15.165.159.251:4000/api/notifications/ingest`
   - 메서드: `POST`
   - 헤더:
     ```
     Content-Type: application/json
     Authorization: Bearer [복사한 토큰]
     ```
   - 바디:
     ```json
     {
       "text": "{notification_text}",
       "appName": "{app_name}"
     }
     ```
   - `{notification_text}` → MacroDroid 변수: `{nvText}` 또는 `{nvContent}`
   - `{app_name}` → MacroDroid 변수: `{nvAppLabel}`

5. **매크로 저장** → 활성화

---

## 방법 B: Tasker + AutoNotification 플러그인

### 설치
- Play Store에서 **Tasker** (유료), **AutoNotification** (유료) 설치

### 설정 순서

1. **AutoNotification** → Intercept → 카드사 앱 선택

2. **Tasker 프로필** 생성
   - 이벤트 → Plugin → AutoNotification → Intercept

3. **Task 생성**
   - HTTP Request 액션 추가
   - URL: `http://15.165.159.251:4000/api/notifications/ingest`
   - Method: POST
   - Headers: `Authorization: Bearer [토큰]`
   - Body: `{"text":"%antitle %antext","appName":"%anapplication"}`

---

## 지원 카드사

| 카드사 | 패키지명 |
|--------|---------|
| 신한카드 | com.shinhan.smartcaremgr |
| KB국민카드 | com.kbcard.kbcardclient |
| 현대카드 | com.hyundaicard.hcard |
| 삼성카드 | com.samsung.android.samsungpay |
| 롯데카드 | com.lccard.android.lottecardapp |
| 하나카드 | com.hanacard.mobileapp |
| 우리카드 | nh.smart.banking |
| 농협카드 | nh.smart.banking |

---

## 작동 방식

```
카드 결제
  → 카드사 앱 푸시 알림 발송
  → MacroDroid/Tasker가 알림 캐치
  → 가계부 서버로 HTTP POST
  → 서버에서 금액/가맹점 파싱
  → 앱 알림 탭에 "대기중" 표시
  → 사용자가 카테고리 선택 후 "등록"
```

---

## 테스트 방법

아래 curl로 알림 수동 전송 테스트 가능:

```bash
curl -X POST http://15.165.159.251:4000/api/notifications/ingest \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer [토큰]" \
  -d '{"text":"신한카드 승인 30,000원 스타벅스 잔액 1,200,000원","appName":"신한카드"}'
```

성공 시 앱 하단 알림 탭에 뱃지가 표시됩니다.