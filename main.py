import ollama

# هذه هي الوظيفة التي ترسل سؤالك للذكاء الاصطناعي
response = ollama.chat(model='llama3', messages=[
  {
    'role': 'user',
    'content': 'مرحباً، أنا المبرمج الجديد لهذا البوت. هل أنت جاهز للعمل معي؟',
  },
])

# طباعة الإجابة على الشاشة
print(response['message']['content'])
