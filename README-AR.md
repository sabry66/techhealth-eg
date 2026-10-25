# نشر الموقع على Firebase

1. أنشئ مشروعًا في https://console.firebase.google.com
2. من Authentication ثم Sign-in method فعّل **Email/Password** (وGoogle إن أردت).
3. من Firestore Database أنشئ قاعدة بيانات (Production mode).
4. من Project settings ثم Your apps أضف تطبيق Web وانسخ القيم (apiKey, authDomain, projectId, appId).
5. افتح `js/config.js` وضعها مكان `PUT_...` (وغيّر `google:true` لو فعّلت Google).
6. في الطرفية داخل هذا المجلد:
```
npm i -g firebase-tools
firebase login
firebase use --add     # اختر مشروعك
firebase deploy
```
هذا ينشر الموقع وقواعد الأمان (كل مستخدم يقرأ ويكتب بياناته فقط).

قبل ضبط Firebase يعمل الموقع في **الوضع التجريبي** (حسابات على نفس المتصفح فقط).

## إضافة محتوى
المحتوى في `data/books/*.json` وفهرسه في `data/manifest.json`.
