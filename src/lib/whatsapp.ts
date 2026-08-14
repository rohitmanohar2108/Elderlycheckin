import twilio from 'twilio';

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const whatsappNumber = process.env.TWILIO_WHATSAPP_NUMBER;

if (!accountSid || !authToken || !whatsappNumber) {
  console.warn('Twilio credentials not configured. WhatsApp functionality will not work.');
}

const client = accountSid && authToken ? twilio(accountSid, authToken) : null;

// Message templates in different languages
const messageTemplates = {
  en: (name: string) => `Hello ${name}, how are you feeling today? Did you have your meals and medicines?`,
  hi: (name: string) => `नमस्ते ${name}, आज आप कैसा महसूस कर रहे हैं? क्या आपने अपना भोजन और दवाइयाँ लीं?`,
  ta: (name: string) => `வணக்கம் ${name}, இன்று நீங்கள் எப்படி உள்ளீர்கள்? உணவு மற்றும் மருந்துகள் எடுத்தீர்களா?`,
  te: (name: string) => `నమస్కారం ${name}, మీరు ఈరోజు ఎలా ఉన్నారు? మీరు భోజనం మరియు మందులు తీసుకున్నారా?`,
  kn: (name: string) => `ನಮಸ್ಕಾರ ${name}, ನೀವು ಇಂದು ಹೇಗಿದ್ದೀರಿ? ಊಟ ಮತ್ತು ಔಷಧಿಗಳನ್ನು ತೆಗೆದುಕೊಂಡಿರಾ?`,
  ml: (name: string) => `നമസ്കാരം ${name}, നിങ്ങൾ ഇന്ന് എങ്ങനെയാണ്? ഭക്ഷണവും മരുന്നുകളും കഴിച്ചോ?`,
  mr: (name: string) => `नमस्कार ${name}, तुम्ही आज कसे आहात? तुम्ही जेवण आणि औषधे घेतली का?`,
  gu: (name: string) => `નમસ્તે ${name}, તમે આજે કેવા છો? શું તમે ભોજન અને દવાઓ લીધી છે?`,
  bn: (name: string) => `নমস্কার ${name}, আজ আপনি কেমন আছেন? আপনি কি খাবার এবং ওষ
ধ নিয়েছেন?`,
};

export async function sendWhatsAppMessage(to: string, message: string) {
  if (!client || !whatsappNumber) {
    console.error('Twilio client not configured');
    throw new Error('WhatsApp service not configured');
  }

  try {
    const response = await client.messages.create({
      from: whatsappNumber,
      to: `whatsapp:${to}`,
      body: message,
    });

    console.log('WhatsApp message sent:', response.sid);
    return response;
  } catch (error) {
    console.error('Error sending WhatsApp message:', error);
    throw error;
  }
}

export function getCheckInMessage(name: string, language: string = 'en'): string {
  const template = messageTemplates[language as keyof typeof messageTemplates] || messageTemplates.en;
  return template(name);
}
