import { useState } from 'react';
import { Bot, MessageCircle, Send, X } from 'lucide-react';
import { useLanguage } from '../context/useLanguage';

const suggestions = {
  en: ['What should I do in a flood?', 'How do I find a shelter?', 'How do I get help?'],
  hi: ['बाढ़ में क्या करें?', 'आश्रय कैसे खोजें?', 'मदद कैसे प्राप्त करें?']
};
function answerFor(question, language) {
  const q = question.toLowerCase();
  if (/flood|बाढ़|water/.test(q)) return language === 'hi'
    ? 'ऊँची और सुरक्षित जगह पर जाएँ, बहते पानी से दूर रहें, बिजली के उपकरण बंद करें और स्थानीय अलर्ट का पालन करें।'
    : 'Move to higher ground, avoid walking or driving through floodwater, turn off utilities if safe, and follow local emergency alerts.';
  if (/shelter|आश्रय|safe place/.test(q)) return language === 'hi'
    ? 'DisasterX में आश्रय पृष्ठ खोलें, उपलब्ध क्षमता देखें और दिशा-निर्देश चुनें। निकलने से पहले स्थानीय अलर्ट जाँचें।'
    : 'Open the Shelters page in DisasterX, check current capacity, then choose Directions. Check local alerts before travelling.';
  if (/help|sos|मदद|emergency/.test(q)) return language === 'hi'
    ? 'तत्काल खतरे में Emergency SOS दबाएँ और स्थान साझा करने की अनुमति दें। भारत में राष्ट्रीय आपातकालीन नंबर 112 है।'
    : 'If you are in immediate danger, use Emergency SOS and allow location sharing. In India, call national emergency number 112.';
  return language === 'hi'
    ? 'मैं आश्रय खोजने, बाढ़ सुरक्षा और आपातकालीन सहायता के बारे में मार्गदर्शन कर सकता हूँ। तत्काल खतरे में 112 पर कॉल करें।'
    : 'I can help with shelter locations, flood safety, or emergency assistance. For immediate danger, call 112.';
}

export default function SafetyAssistant() {
  const { language, t } = useLanguage();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([]);
  const send = (text) => {
    const question = text.trim();
    if (!question) return;
    setMessages((current) => [...current, { from: 'you', text: question }, { from: 'assistant', text: answerFor(question, language) }]);
    setInput('');
  };
  return <div className="assistant-widget">
    {open && <section className="panel assistant-panel" aria-label={t('safetyAssistant')}>
      <header><span><Bot size={17} /> {t('safetyAssistant')}</span><button aria-label="Close assistant" onClick={() => setOpen(false)}><X size={16} /></button></header>
      <div className="assistant-messages">
        {!messages.length && <><p className="assistant-welcome">{language === 'hi' ? 'मैं आपातकालीन स्थिति की तैयारी में आपकी मदद कर सकता हूँ।' : 'I can help you prepare for an emergency.'}</p>{suggestions[language].map((suggestion) => <button key={suggestion} className="assistant-suggestion" onClick={() => send(suggestion)}>{suggestion}</button>)}</>}
        {messages.map((message, index) => <p key={`${index}-${message.from}`} className={`assistant-message ${message.from}`}>{message.text}</p>)}
      </div>
      <form className="assistant-input" onSubmit={(event) => { event.preventDefault(); send(input); }}><input value={input} onChange={(event) => setInput(event.target.value)} placeholder={language === 'hi' ? 'अपना प्रश्न लिखें…' : 'Ask a safety question…'} /><button aria-label="Send question"><Send size={15} /></button></form>
      <div className="assistant-disclaimer">{language === 'hi' ? 'आपात स्थिति में 112 पर कॉल करें' : 'For emergencies, call 112'}</div>
    </section>}
    <button className="assistant-launch" onClick={() => setOpen((current) => !current)} aria-label={t('safetyAssistant')}>{open ? <X size={19} /> : <MessageCircle size={19} />}</button>
  </div>;
}
