# دليل نشر تطبيق myAi

## 📋 المتطلبات قبل النشر

### 1. البيئة المطلوبة
- **Node.js:** الإصدار 18 أو أحدث
- **npm/pnpm:** مدير الحزم
- **MySQL/TiDB:** قاعدة البيانات
- **خادم ويب:** Nginx أو Apache (اختياري)

### 2. متغيرات البيئة
أنشئ ملف `.env` في جذر المشروع:

```env
# === OAuth Configuration ===
MANUS_OAUTH_CLIENT_ID=your_client_id_here
MANUS_OAUTH_CLIENT_SECRET=your_client_secret_here
MANUS_OAUTH_REDIRECT_URI=https://yourdomain.com/api/oauth/callback

# === Database Configuration ===
DATABASE_URL=mysql://username:password@host:port/database_name

# === LLM Configuration ===
OPENAI_API_KEY=your_api_key_here
FORGE_API_URL=https://forge.manus.im

# === Server Configuration ===
NODE_ENV=production
PORT=3000
```

## 🚀 خطوات النشر

### الطريقة 1: النشر على خادم Linux (VPS/Dedicated)

#### الخطوة 1: تحضير الخادم
```bash
# تحديث النظام
sudo apt update && sudo apt upgrade -y

# تثبيت Node.js
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# تثبيت pnpm
npm install -g pnpm

# تثبيت PM2 (لإدارة العمليات)
npm install -g pm2

# تثبيت Nginx (اختياري)
sudo apt install -y nginx
```

#### الخطوة 2: استنساخ المشروع
```bash
# الانتقال إلى مجلد التطبيقات
cd /home/ubuntu/apps

# استنساخ المشروع
git clone https://github.com/salihamadah60-jpg/myAi.git
cd myAi

# تثبيت الاعتماديات
pnpm install
```

#### الخطوة 3: إعداد البيئة
```bash
# نسخ ملف البيئة
cp .env.example .env

# تحرير ملف البيئة بمعلوماتك
nano .env
```

#### الخطوة 4: بناء التطبيق
```bash
# بناء الواجهة الأمامية والخلفية
pnpm build

# تطبيق هجرات قاعدة البيانات
pnpm db:push
```

#### الخطوة 5: تشغيل التطبيق مع PM2
```bash
# بدء التطبيق
pm2 start dist/index.js --name "myai"

# حفظ قائمة العمليات
pm2 save

# تفعيل بدء تلقائي عند إعادة التشغيل
pm2 startup
```

#### الخطوة 6: إعداد Nginx (اختياري)
```bash
# إنشاء ملف الإعدادات
sudo nano /etc/nginx/sites-available/myai
```

أضف المحتوى التالي:
```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    # إعادة التوجيه إلى HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;

    # شهادات SSL (استخدم Let's Encrypt)
    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    # إعدادات SSL
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # حد أقصى لحجم الملفات المرفوعة
    client_max_body_size 50M;

    # توجيه الطلبات إلى التطبيق
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        
        # للبث المباشر
        proxy_buffering off;
        proxy_request_buffering off;
    }
}
```

تفعيل الموقع:
```bash
# إنشاء رابط رمزي
sudo ln -s /etc/nginx/sites-available/myai /etc/nginx/sites-enabled/

# اختبار الإعدادات
sudo nginx -t

# إعادة تشغيل Nginx
sudo systemctl restart nginx
```

### الطريقة 2: النشر على Vercel (للواجهة الأمامية فقط)

```bash
# تثبيت Vercel CLI
npm i -g vercel

# النشر
vercel
```

### الطريقة 3: النشر على Docker

#### إنشاء Dockerfile
```dockerfile
FROM node:20-alpine

WORKDIR /app

# تثبيت pnpm
RUN npm install -g pnpm

# نسخ الملفات
COPY . .

# تثبيت الاعتماديات
RUN pnpm install

# بناء التطبيق
RUN pnpm build

# تطبيق الهجرات
RUN pnpm db:push

# تعريض المنفذ
EXPOSE 3000

# بدء التطبيق
CMD ["pnpm", "start"]
```

#### بناء وتشغيل الحاوية
```bash
# بناء الصورة
docker build -t myai:latest .

# تشغيل الحاوية
docker run -p 3000:3000 --env-file .env myai:latest
```

## 🔒 إجراءات الأمان

### 1. شهادات SSL
```bash
# استخدام Let's Encrypt
sudo apt install certbot python3-certbot-nginx
sudo certbot certonly --nginx -d yourdomain.com
```

### 2. جدار الحماية
```bash
# تفعيل UFW
sudo ufw enable

# السماح بالمنافذ المطلوبة
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 3000/tcp
```

### 3. متغيرات البيئة الآمنة
- لا تضع المفاتيح السرية في الكود
- استخدم ملفات `.env` محلية فقط
- استخدم خدمات إدارة المفاتيح (مثل AWS Secrets Manager)

## 📊 المراقبة والصيانة

### مراقبة الخادم
```bash
# عرض سجلات PM2
pm2 logs myai

# عرض حالة العمليات
pm2 status

# عرض الإحصائيات
pm2 monit
```

### النسخ الاحتياطي
```bash
# نسخ احتياطي من قاعدة البيانات
mysqldump -u username -p database_name > backup.sql

# استعادة من نسخة احتياطية
mysql -u username -p database_name < backup.sql
```

### التحديثات
```bash
# سحب أحدث التغييرات
git pull origin main

# تثبيت الاعتماديات الجديدة
pnpm install

# إعادة بناء التطبيق
pnpm build

# إعادة تشغيل العملية
pm2 restart myai
```

## 🐛 استكشاف الأخطاء

### المشكلة: الخادم لا يبدأ
```bash
# تحقق من السجلات
pm2 logs myai

# تحقق من المنفذ
lsof -i :3000
```

### المشكلة: قاعدة البيانات غير متصلة
```bash
# اختبر الاتصال
mysql -h host -u username -p -e "SELECT 1"

# تحقق من متغيرات البيئة
echo $DATABASE_URL
```

### المشكلة: البث لا يعمل
- تأكد من أن Nginx يسمح بـ streaming
- تحقق من `proxy_buffering off` في إعدادات Nginx
- تحقق من أن المتصفح يدعم EventSource

## 📞 الدعم والمساعدة

للمزيد من المعلومات:
- [Node.js Documentation](https://nodejs.org/docs/)
- [PM2 Documentation](https://pm2.keymetrics.io/)
- [Nginx Documentation](https://nginx.org/en/docs/)
- [Docker Documentation](https://docs.docker.com/)

---

**آخر تحديث:** 2026-04-14
