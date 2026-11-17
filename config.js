// =====================================================================
//  너잘달 설정 파일  (README.md 의 순서대로 채워주세요)
// =====================================================================
window.APP_CONFIG = {
  // 앱 이름 (홈 화면 아이콘 아래 표시는 manifest.webmanifest 에서 변경)
  appName: "너잘달",

  // 1) Firebase 설정 — Firebase 콘솔 > 프로젝트 설정 > 내 앱(웹) 에서 복사
  //    비워두면 "데모 모드"(이 기기에만 저장)로 동작합니다.
  firebase: {
    apiKey: "AIzaSyC7Aydchhhi0cFDiPM1bUOrsGJrzWZkuvo",
    authDomain: "nejaldal.firebaseapp.com",
    projectId: "nejaldal",
    storageBucket: "nejaldal.firebasestorage.app",
    messagingSenderId: "1019913832010",
    appId: "1:1019913832010:web:114beb1b7ac41c621448b3",
  },

  // 2) 가족 비밀번호 해시 — 앱을 처음 열면 나오는 "비밀번호 만들기" 화면에서 복사
  passwordHash: "15f947de4eb887cc2a54291f13fc479b5a6dcf7555c756247f1bd30658a62ef9",

  // 3) 아침 알림용 VAPID 공개키 — README 의 "알림 키 만들기" 참고
  vapidPublicKey: "BLl4K0S7k8wgPgxF-BIkdfiltxZlNvonh8wyTE6JMJRiQy1N-REcTwDijuA4kIgUWnEbq5JrEsRKYFGQeyhXyVs",

  // 가족 구성원 (사진은 앱 안의 설정에서 등록)
  members: ["아빠", "엄마", "한나", "한영", "보현", "쫑이"],

  // 반려동물 (얼굴 스티커·생일·아이콘엔 나오고, "누구세요?" 선택에선 빠져요)
  pets: ["쫑이"],

  // Way Back Home 체크 대상
  wayBackHome: ["한나", "한영", "보현"],

  // 가족 얼굴 스티커 (icons/faces 폴더). 앱 설정에서 사진을 바꾸면 그 사진이 우선이에요.
  faces: {
    "아빠": "icons/faces/dad.png",
    "엄마": "icons/faces/mom.png",
    "한나": "icons/faces/hn.png",
    "한영": "icons/faces/hy.png",
    "보현": "icons/faces/bh.png",
    "쫑이": "icons/faces/jj.png",
  },

  // 가족 생일 — 앱을 처음 열 때 한 번만 달력에 자동으로 들어가요 (lunar: true = 음력)
  birthdays: [
    { name: "아빠", date: "1971-06-17", lunar: true },
    { name: "엄마", date: "1971-04-19", lunar: true },
    { name: "한나", date: "1998-12-24" },
    { name: "한영", date: "2001-02-06" },
    { name: "보현", date: "2003-08-11" },
    { name: "외할아버지", date: "2000-04-15", lunar: true, type: "grandpa" },  // 연도는 상관없어요
    { name: "쫑이", date: "2014-11-30", memo: "우리 집에 온 날 (추정)" },
  ],
};
