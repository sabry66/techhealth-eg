/* إعدادات الموقع. عدّل هذا الملف فقط.
   1) ضع بيانات مشروع Firebase الخاص بك مكان القيم التي تبدأ بـ PUT_
   2) غيّر اسم الموقع إن أردت.
   بدون بيانات Firebase يعمل الموقع بوضع تجريبي: الحسابات والمفضلة تُحفظ على نفس الجهاز فقط. */
export const CONFIG = {
  siteName: "تيك هيلث",
  tagline: "مناهج المختبرات والأشعة، بالشرح والخرائط الذهنية والاختبارات",
  google: false, // اجعلها true بعد تفعيل Google في Authentication
  firebase: {
    apiKey: "AIzaSyDSGp75kfz2CgRLdCAXuJIlJWUL6lEd0fM",
    authDomain: "techhealth-eg.firebaseapp.com",
    projectId: "techhealth-eg",
    appId: "1:201991679367:web:151981d6f6db061c71f722"
  }
};
