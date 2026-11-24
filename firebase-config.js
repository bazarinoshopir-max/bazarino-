// =======================================================
// تنظیمات فایربیس — این بخش را با اطلاعات پروژه خودتان پر کنید
// راهنمای کامل گرفتن این اطلاعات در فایل README.md هست
// =======================================================
const firebaseConfig = {
  apiKey: "AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
  authDomain: "bazarino-shop.firebaseapp.com",
  projectId: "bazarino-shop",
  storageBucket: "bazarino-shop.appspot.com",
  messagingSenderId: "000000000000",
  appId: "1:000000000000:web:xxxxxxxxxxxxxxxxxxxxxx"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const auth = firebase.auth();
const storage = firebase.storage();

// اطلاعات تماس برای خرید — اگر یوزرنیم‌ها عوض شد همینجا تغییر بده
const SOCIAL_LINKS = {
  telegram: "https://t.me/pbazarinoshop1",
  rubika: "https://rubika.ir/shopbazarino",
  bale: "https://ble.ir/shopbazarino"
};
