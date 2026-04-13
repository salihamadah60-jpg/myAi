import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { getLoginUrl } from "@/const";
import { MessageSquare, Zap, Brain, Lock } from "lucide-react";

export default function Home() {
  const { isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-secondary/10" />
        
        <div className="relative max-w-6xl mx-auto px-4 py-20 sm:py-32">
          <div className="text-center space-y-8">
            <div className="space-y-4">
              <h1 className="text-5xl sm:text-6xl font-bold text-foreground">
                تطبيق دردشة ذكاء اصطناعي
              </h1>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                تجربة محادثة سلسة وراقية مع ذكاء اصطناعي متقدم. احفظ محادثاتك وأدر جلسات متعددة بسهولة.
              </p>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {isAuthenticated ? (
                <Button
                  size="lg"
                  onClick={() => setLocation("/chat")}
                  className="gap-2"
                >
                  <MessageSquare className="w-5 h-5" />
                  ابدأ الدردشة الآن
                </Button>
              ) : (
                <>
                  <Button size="lg" asChild>
                    <a href={getLoginUrl()}>تسجيل الدخول</a>
                  </Button>
                  <Button size="lg" variant="outline" asChild>
                    <a href={getLoginUrl()}>إنشاء حساب</a>
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="max-w-6xl mx-auto px-4 py-20">
        <div className="grid md:grid-cols-3 gap-8">
          {/* Feature 1 */}
          <div className="bg-card border border-border rounded-lg p-8 space-y-4 hover:shadow-lg transition-shadow">
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
              <Brain className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-lg font-semibold text-foreground">
              ذكاء اصطناعي متقدم
            </h3>
            <p className="text-muted-foreground">
              تكامل سلس مع نماذج لغة متقدمة توفر ردود ذكية وسياقية
            </p>
          </div>

          {/* Feature 2 */}
          <div className="bg-card border border-border rounded-lg p-8 space-y-4 hover:shadow-lg transition-shadow">
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
              <MessageSquare className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-lg font-semibold text-foreground">
              محادثات متعددة
            </h3>
            <p className="text-muted-foreground">
              أنشئ وأدر جلسات محادثة متعددة بسهولة مع حفظ السجل الكامل
            </p>
          </div>

          {/* Feature 3 */}
          <div className="bg-card border border-border rounded-lg p-8 space-y-4 hover:shadow-lg transition-shadow">
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
              <Lock className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-lg font-semibold text-foreground">
              آمن وموثوق
            </h3>
            <p className="text-muted-foreground">
              بيانات محمية وتشفير قوي لضمان خصوصيتك وأمان محادثاتك
            </p>
          </div>
        </div>
      </div>

      {/* Features Highlight */}
      <div className="bg-card border-y border-border py-20">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <h2 className="text-3xl font-bold text-foreground">
                ميزات قوية وسهلة الاستخدام
              </h2>
              
              <div className="space-y-4">
                <div className="flex gap-4">
                  <Zap className="w-5 h-5 text-primary flex-shrink-0 mt-1" />
                  <div>
                    <h4 className="font-semibold text-foreground">
                      واجهة سلسة
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      تصميم أنيق واحترافي يوفر تجربة استخدام راقية
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <MessageSquare className="w-5 h-5 text-primary flex-shrink-0 mt-1" />
                  <div>
                    <h4 className="font-semibold text-foreground">
                      ذاكرة محادثة كاملة
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      الذكاء الاصطناعي يتذكر السياق الكامل للمحادثة
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <Brain className="w-5 h-5 text-primary flex-shrink-0 mt-1" />
                  <div>
                    <h4 className="font-semibold text-foreground">
                      دعم Markdown
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      عرض محتوى منسق بشكل احترافي مع دعم Markdown الكامل
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-primary/20 to-secondary/20 rounded-lg p-8 h-64 flex items-center justify-center">
              <div className="text-center text-muted-foreground">
                <MessageSquare className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p>معاينة الواجهة</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="max-w-4xl mx-auto px-4 py-20 text-center space-y-6">
        <h2 className="text-3xl font-bold text-foreground">
          جاهز للبدء؟
        </h2>
        <p className="text-lg text-muted-foreground">
          انضم إلينا الآن واستمتع بتجربة دردشة ذكاء اصطناعي لا مثيل لها
        </p>
        {isAuthenticated ? (
          <Button
            size="lg"
            onClick={() => setLocation("/chat")}
            className="gap-2"
          >
            <MessageSquare className="w-5 h-5" />
            ابدأ الدردشة الآن
          </Button>
        ) : (
          <Button size="lg" asChild>
            <a href={getLoginUrl()}>تسجيل الدخول</a>
          </Button>
        )}
      </div>
    </div>
  );
}
