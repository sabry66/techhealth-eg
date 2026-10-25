/* إعدادات الموقع. عدّل هذا الملف فقط.
   1) ضع بيانات مشروع Firebase الخاص بك مكان القيم التي تبدأ بـ PUT_
   2) غيّر اسم الموقع إن أردت.
   بدون بيانات Firebase يعمل الموقع بوضع تجريبي: الحسابات والمفضلة تُحفظ على نفس الجهاز فقط. */
export const CONFIG = {
  siteName: "تيك هيلث",
  tagline: "مناهج المختبرات والأشعة، بالشرح والخرائط الذهنية والاختبارات",
  google: false, // اجعلها true بعد تفعيل Google في Authentication
  firebase: {
    apiKey: "PUT_API_KEY",
    authDomain: "PUT_PROJECT_ID.firebaseapp.com",
    projectId: "PUT_PROJECT_ID",
    appId: "PUT_APP_ID"
  }
};
