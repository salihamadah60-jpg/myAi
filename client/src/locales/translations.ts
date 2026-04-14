export const translations = {
  ar: {
    // Navigation & General
    navigation: "التنقل",
    page1: "الصفحة 1",
    page2: "الصفحة 2",
    signIn: "تسجيل الدخول",
    signOut: "تسجيل الخروج",
    signInToContinue: "تسجيل الدخول للمتابعة",
    accessDashboardRequiresAuth: "يتطلب الوصول إلى لوحة التحكم المصادقة",
    continueToLaunchLoginFlow: "انقر للمتابعة إلى تدفق تسجيل الدخول",

    // Chat
    chat: "الدردشة",
    newConversation: "محادثة جديدة",
    conversation: "محادثة",
    conversations: "المحادثات",
    welcomeToChat: "مرحباً بك في تطبيق الدردشة",
    pleaseSignInToContinue: "يرجى تسجيل الدخول للمتابعة",
    startNewConversation: "ابدأ محادثة جديدة للبدء",
    createNewConversation: "إنشاء محادثة جديدة",
    typeYourMessageHere: "اكتب رسالتك هنا...",
    pressEnterToSend: "اضغط Enter للإرسال",
    loadingMessages: "جاري تحميل الرسائل...",
    errorLoadingMessages: "حدث خطأ أثناء تحميل الرسائل",
    retry: "إعادة المحاولة",
    errorSendingMessage: "حدث خطأ أثناء إرسال الرسالة",
    replying: "جاري الرد...",
    conversationNotFound: "لم يتم العثور على المحادثة",

    // Sidebar Actions
    rename: "إعادة تسمية",
    delete: "حذف",
    deleteConversation: "حذف المحادثة",
    confirmDeleteConversation: "هل أنت متأكد من رغبتك في حذف هذه المحادثة؟",
    cancel: "إلغاء",
    confirm: "تأكيد",
    renameConversation: "إعادة تسمية المحادثة",
    enterNewTitle: "أدخل العنوان الجديد",

    // Theme & Language
    theme: "المظهر",
    language: "اللغة",
    lightMode: "الوضع الفاتح",
    darkMode: "الوضع الداكن",
    arabic: "العربية",
    english: "English",

    // User Menu
    menu: "القائمة",
    profile: "الملف الشخصي",
    settings: "الإعدادات",
  },
  en: {
    // Navigation & General
    navigation: "Navigation",
    page1: "Page 1",
    page2: "Page 2",
    signIn: "Sign in",
    signOut: "Sign out",
    signInToContinue: "Sign in to continue",
    accessDashboardRequiresAuth: "Access to this dashboard requires authentication",
    continueToLaunchLoginFlow: "Continue to launch the login flow",

    // Chat
    chat: "Chat",
    newConversation: "New Conversation",
    conversation: "Conversation",
    conversations: "Conversations",
    welcomeToChat: "Welcome to Chat App",
    pleaseSignInToContinue: "Please sign in to continue",
    startNewConversation: "Start a new conversation to begin",
    createNewConversation: "Create New Conversation",
    typeYourMessageHere: "Type your message here...",
    pressEnterToSend: "Press Enter to send...",
    loadingMessages: "Loading messages...",
    errorLoadingMessages: "Error loading messages",
    retry: "Retry",
    errorSendingMessage: "Error sending message",
    replying: "Replying...",
    conversationNotFound: "Conversation not found",

    // Sidebar Actions
    rename: "Rename",
    delete: "Delete",
    deleteConversation: "Delete Conversation",
    confirmDeleteConversation: "Are you sure you want to delete this conversation?",
    cancel: "Cancel",
    confirm: "Confirm",
    renameConversation: "Rename Conversation",
    enterNewTitle: "Enter new title",

    // Theme & Language
    theme: "Theme",
    language: "Language",
    lightMode: "Light Mode",
    darkMode: "Dark Mode",
    arabic: "العربية",
    english: "English",

    // User Menu
    menu: "Menu",
    profile: "Profile",
    settings: "Settings",
  },
};

export type Language = "ar" | "en";
export type TranslationKey = keyof typeof translations.ar;
