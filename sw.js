// 너잘달 서비스워커: 오프라인 캐시 + 아침 알림 수신
const CACHE = "family-cal-v6";
const SHELL = ["./", "index.html", "config.js", "manifest.webmanifest", "icons/icon-192.png", "icons/icon-512.png", "icons/apple-touch-icon.png", "icons/badge.png",
  "icons/faces/dad.png", "icons/faces/mom.png", "icons/faces/hn.png", "icons/faces/hy.png", "icons/faces/bh.png", "icons/faces/jj.png"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
// 인터넷이 없어도 열리게:
//  - 앱 파일(같은 주소): 최신 버전을 먼저 받고, 안 되면 저장해 둔 것
//  - 글꼴·Firebase 프로그램(외부 CDN): 한 번 받으면 저장해 두고 계속 사용
const CDN = ["www.gstatic.com", "cdn.jsdelivr.net"];
self.addEventListener("fetch", e => {
  const url = new URL(e.request.url);
  if (e.request.method !== "GET") return;
  if (CDN.includes(url.hostname)) {
    e.respondWith(caches.open(CACHE).then(c => c.match(e.request).then(hit => hit || fetch(e.request).then(r => { if (r.ok || r.type === "opaque") c.put(e.request, r.clone()); return r; }))));
    return;
  }
  if (url.origin !== location.origin) return;   // Firebase 데이터 통신은 Firebase가 알아서 오프라인 처리
  e.respondWith(
    fetch(e.request).then(r => { const copy = r.clone(); caches.open(CACHE).then(c => c.put(e.request, copy)); return r; })
      .catch(() => caches.match(e.request, {ignoreSearch: true}).then(r => r || caches.match("index.html")))
  );
});
// 앱이 처음 설치될 때 Firebase 프로그램과 글꼴도 미리 받아두기
const PRE_CDN = [
  "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js",
  "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js",
  "https://cdn.jsdelivr.net/npm/@kfonts/bm-hanna-11yrs@0.2.1/BMHANNA_11yrs_ttf.woff2",
];
self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => Promise.all(PRE_CDN.map(u => fetch(u, {mode: "cors"}).then(r => r.ok && c.put(u, r)).catch(() => {})))));
});

self.addEventListener("push", e => {
  let d = {};
  try { d = e.data ? e.data.json() : {}; } catch { d = {body: e.data && e.data.text()}; }
  e.waitUntil(self.registration.showNotification(d.title || "너잘달", {
    body: d.body || "",
    icon: "icons/icon-192.png",
    badge: "icons/badge.png",
    tag: d.tag || "family-cal",
    data: {url: d.url || "./"},
  }));
});
self.addEventListener("notificationclick", e => {
  e.notification.close();
  const url = new URL(e.notification.data?.url || "./", self.registration.scope).href;
  e.waitUntil(clients.matchAll({type: "window", includeUncontrolled: true}).then(list => {
    for (const c of list) if ("focus" in c) { c.navigate(url); return c.focus(); }
    return clients.openWindow(url);
  }));
});
