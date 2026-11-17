// 매일 아침 7시(한국시간)에 GitHub Actions 가 실행하는 알림 발송 스크립트
import admin from "firebase-admin";
import webpush from "web-push";

const {FIREBASE_SERVICE_ACCOUNT, FAMILY_KEY, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, APP_URL = "./", TEST} = process.env;
for (const [k, v] of Object.entries({FIREBASE_SERVICE_ACCOUNT, FAMILY_KEY, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY}))
  if (!v) { console.error(`❌ GitHub 비밀값 ${k} 가 비어 있어요`); process.exit(1); }

admin.initializeApp({credential: admin.credential.cert(JSON.parse(FIREBASE_SERVICE_ACCOUNT))});
webpush.setVapidDetails("mailto:family-calendar@example.com", VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
const db = admin.firestore();
const fam = db.collection("families").doc(FAMILY_KEY);

// 오늘 날짜 (한국시간)
const today = new Intl.DateTimeFormat("en-CA", {timeZone: "Asia/Seoul"}).format(new Date()); // YYYY-MM-DD
const [ty, tm, td] = today.split("-").map(Number);
const isLeap = y => y % 4 === 0 && (y % 100 !== 0 || y % 400 === 0);
const pad = n => String(n).padStart(2, "0");
const days = (a, b) => Math.round((Date.parse(b) - Date.parse(a)) / 86400000);

// 한국 음력 → 양력 (Node 내장 dangi 달력)
const dangi = new Intl.DateTimeFormat("en-u-ca-dangi", {timeZone: "UTC", year: "numeric", month: "numeric", day: "numeric"});
function lunarToSolar(y, m, d) {
  let last = null;
  for (let t = Date.UTC(y, 0, 10); t < Date.UTC(y + 1, 2, 5); t += 86400000) {
    const p = {}; for (const x of dangi.formatToParts(new Date(t))) p[x.type] = x.value;
    if (+p.relatedYear !== y || p.month !== String(m)) { if (last) break; continue; }
    last = t; if (+p.day === d) return new Date(t).toISOString().slice(0, 10);
  }
  return last ? new Date(last).toISOString().slice(0, 10) : null;
}

function startsToday(ev) {
  if (!ev.yearly) return ev.start === today;
  const [y0, m, d] = ev.start.split("-").map(Number);
  if (ev.lunar) return [ty - 1, ty].some(y => y >= y0 && lunarToSolar(y, m, d) === today);
  if (ty < y0) return false;
  const dd = (m === 2 && d === 29 && !isLeap(ty)) ? 28 : d;
  return `${ty}-${pad(m)}-${pad(dd)}` === today;
}

function message(ev) {
  const len = days(ev.start, ev.end || ev.start);
  const until = len > 0 ? ` (${len + 1}일간)` : "";
  switch (ev.type) {
    case "birthday": return {title: `🎂 오늘은 ${ev.title}이에요!${ev.lunar ? ` (음력 ${+ev.start.slice(5, 7)}.${+ev.start.slice(8)})` : ""}`, body: "축하 메시지 잊지 마세요 🎉" + (ev.memo ? ` · ${ev.memo}` : "")};
    case "trip":     return {title: `✈️ 오늘 ${ev.title} 출발!`, body: `즐거운 여행 되세요${until}` + (ev.memo ? ` · ${ev.memo}` : "")};
    case "anniv": {
      const n = ty - Number(ev.start.slice(0, 4));
      return {title: `💍 오늘은 엄마 아빠 결혼기념일${n > 0 ? ` (${n}주년)` : ""}`, body: "축하드려요! 💐" + (ev.memo ? ` · ${ev.memo}` : "")};
    }
    case "grandpa":  return {title: "👴 오늘은 외할아버지 생신이에요", body: "전화 한 통 드려요 ☎️" + (ev.memo ? ` · ${ev.memo}` : "")};
    case "wbh": {
      const who = Object.keys(ev.wbh || {}).filter(k => ev.wbh[k]);
      return {title: "🏠 Way Back Home", body: `오늘 ${who.join("·")} 집에 와요!${until}` + (ev.memo ? ` · ${ev.memo}` : "")};
    }
    default: {
      const emo = ev.icon?.kind === "emoji" ? ev.icon.value : "📌";
      return {title: `${emo} ${ev.title}`, body: `오늘의 가족 일정${until}` + (ev.memo ? ` · ${ev.memo}` : "") + (ev.createdBy ? ` (${ev.createdBy})` : "")};
    }
  }
}

const evSnap = await fam.collection("events").get();
let todays = evSnap.docs.map(d => d.data()).filter(ev => ev.notify && startsToday(ev));
if (TEST) todays = [{type: "custom", title: "테스트 알림이에요", start: today, icon: {kind: "emoji", value: "🔔"}, id: "test"}];
console.log(`📅 ${today} — 알림 보낼 행사 ${todays.length}개`);
if (!todays.length) process.exit(0);

const subSnap = await fam.collection("subs").get();
console.log(`📱 등록된 기기 ${subSnap.size}대`);
let sent = 0, removed = 0;
for (const ev of todays) {
  const msg = message(ev);
  const payload = JSON.stringify({...msg, tag: `fc-${ev.id}-${today}`, url: `${APP_URL}?d=${today}`});
  for (const s of subSnap.docs) {
    try { await webpush.sendNotification(s.data().sub, payload, {TTL: 6 * 3600, urgency: "high"}); sent++; }
    catch (e) {
      if (e.statusCode === 404 || e.statusCode === 410) { await s.ref.delete(); removed++; }
      else console.warn("발송 실패", s.id, e.statusCode, e.body);
    }
  }
}
console.log(`✅ 발송 ${sent}건, 만료된 기기 정리 ${removed}건`);
process.exit(0);
