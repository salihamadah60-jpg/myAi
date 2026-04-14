# تحديثات تطبيق myAi - نسخة محسّنة

## 🎉 الميزات الجديدة

### 1. 🌓 نظام الوضع الفاتح والداكن (Light/Dark Mode)
- **التبديل الحر:** يمكنك التبديل بين الوضع الفاتح والداكن بسهولة من خلال زر في رأس الصفحة
- **الحفظ التلقائي:** يتم حفظ تفضيلك تلقائياً في متصفحك
- **تصميم احترافي:** تم تحسين ألوان كلا الوضعين لراحة العين

### 2. 🌐 دعم اللغتين (العربية والإنجليزية)
- **العربية كلغة أساسية:** جميع النصوص باللغة العربية افتراضياً
- **التبديل السلس:** يمكنك التبديل للإنجليزية من خلال قائمة اللغة
- **الحفظ التلقائي:** يتم حفظ اختيار اللغة في متصفحك
- **دعم RTL:** الواجهة تتكيف تلقائياً مع اتجاه النص (يمين إلى يسار للعربية)

**المكونات المترجمة:**
- رسائل الترحيب والتنقل
- تسميات الأزرار والقوائم
- رسائل الخطأ والحالة
- تلميحات المساعدة

### 3. ⚡ البث المباشر للردود (Streaming Chat)
- **استجابة أسرع:** ترى الردود تظهر فوراً بدلاً من الانتظار حتى الانتهاء الكامل
- **تجربة محسّنة:** يشعر المستخدم بأن التطبيق أسرع بكثير
- **معالجة الأخطاء:** نظام قوي للتعامل مع أخطاء الاتصال

**كيفية عمل البث:**
1. يتم إرسال الرسالة من العميل
2. الخادم يبدأ في استقبال الرد من LLM
3. كل جزء من الرد يُرسل فوراً للعميل
4. الواجهة تعرض النص أثناء استقباله
5. عند الانتهاء، يتم حفظ الرد الكامل في قاعدة البيانات

## 📁 الملفات المضافة والمعدلة

### ملفات جديدة:
- `client/src/locales/translations.ts` - قاموس الترجمة
- `client/src/contexts/LanguageContext.tsx` - إدارة حالة اللغة
- `client/src/hooks/useStreamingChat.ts` - hook للبث المباشر
- `client/src/components/ChatBoxStreaming.tsx` - مكون عرض الرسائل المتدفقة
- `client/src/pages/ChatStreaming.tsx` - صفحة الدردشة مع البث
- `server/streamingRouter.ts` - endpoint للبث المباشر

### ملفات معدلة:
- `client/src/App.tsx` - تفعيل الـ providers الجديدة
- `client/src/pages/Chat.tsx` - إضافة الترجمة والتحكم بالمظهر
- `client/src/components/ChatBox.tsx` - دعم الترجمة
- `client/src/components/ChatInput.tsx` - دعم الترجمة
- `client/src/components/ConversationSidebar.tsx` - دعم الترجمة
- `server/_core/index.ts` - تسجيل streaming router
- `server/_core/llm.ts` - إضافة دوال البث

## 🚀 كيفية الاستخدام

### تبديل المظهر:
1. انقر على أيقونة الشمس/القمر في رأس الصفحة
2. سيتم التبديل بين الوضع الفاتح والداكن فوراً

### تبديل اللغة:
1. انقر على أيقونة العالم (Globe) في رأس الصفحة
2. اختر اللغة المطلوبة (العربية أو الإنجليزية)
3. ستتحدث الواجهة بالكامل للغة المختارة

### استخدام البث المباشر:
- ما عليك سوى كتابة الرسالة والضغط على Enter أو زر الإرسال
- ستشاهد الرد يظهر فوراً أثناء استقباله من الخادم

## 🔧 المتطلبات التقنية

### الخلفية (Backend):
- Node.js 18+
- Express.js
- tRPC
- Drizzle ORM
- MySQL/TiDB

### الواجهة الأمامية (Frontend):
- React 19+
- TypeScript
- Tailwind CSS
- Radix UI
- Vite

## 📦 التثبيت والتشغيل

```bash
# تثبيت الاعتماديات
pnpm install

# تشغيل في وضع التطوير
pnpm dev

# بناء للإنتاج
pnpm build

# تشغيل في الإنتاج
pnpm start
```

## 🔐 متغيرات البيئة المطلوبة

```env
# OAuth
MANUS_OAUTH_CLIENT_ID=your_client_id
MANUS_OAUTH_CLIENT_SECRET=your_client_secret

# قاعدة البيانات
DATABASE_URL=mysql://user:password@localhost/myai

# LLM API
OPENAI_API_KEY=your_api_key
FORGE_API_URL=https://forge.manus.im  # اختياري
```

## 📝 ملاحظات مهمة

1. **الترجمة:** تم ترجمة جميع النصوص الأساسية. إذا كنت تريد إضافة نصوص جديدة، أضفها في `client/src/locales/translations.ts`

2. **المظهر:** يتم حفظ تفضيل المظهر في `localStorage` تحت مفتاح `theme`

3. **اللغة:** يتم حفظ اختيار اللغة في `localStorage` تحت مفتاح `language`

4. **البث:** يتطلب الخادم دعم HTTP streaming (EventSource)

## 🐛 استكشاف الأخطاء

### البث لا يعمل:
- تأكد من أن الخادم يدعم streaming
- تحقق من أن `/api/streaming/messages/send-stream` متاح
- تحقق من أن المتصفح يدعم EventSource

### الترجمة لا تعمل:
- تأكد من أن `LanguageProvider` يحيط بـ `App`
- تحقق من أن مفاتيح الترجمة موجودة في `translations.ts`

### المظهر لا يتغير:
- امسح `localStorage` وأعد تحميل الصفحة
- تأكد من أن `ThemeProvider` لديه `switchable={true}`

## 📚 المراجع

- [React Documentation](https://react.dev)
- [Tailwind CSS](https://tailwindcss.com)
- [tRPC](https://trpc.io)
- [Radix UI](https://www.radix-ui.com)

## 📞 الدعم

إذا واجهت أي مشاكل، يرجى فتح issue على GitHub أو التواصل مع فريق التطوير.

---

**آخر تحديث:** 2026-04-14
**الإصدار:** 2.0.0
