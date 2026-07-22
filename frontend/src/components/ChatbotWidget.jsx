import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageSquare, Send, X, Bot, User, ArrowUpRight, Mic, MicOff, Volume2, VolumeX } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const ChatbotWidget = () => {
  const { token } = useAuth();
  const navigate = useNavigate();

  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      sender: 'bot',
      text: 'Hello! I am your Smart Stock Intelligence assistant. Ask me anything about stock counts, low stock items, expiry dates, or pending transfers. You can also use voice commands!',
      time: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [speechEnabled, setSpeechEnabled] = useState(false);

  const messageEndRef = useRef(null);
  const recognitionRef = useRef(null);

  useEffect(() => {
    // Initialize Web Speech API Recognition if available
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onresult = (event) => {
        const transcript = Array.from(event.results)
          .map(result => result[0])
          .map(result => result.transcript)
          .join('');
        
        setInput(transcript);
      };

      recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }
  }, []);

  const scrollToBottom = () => {
    messageEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert('Voice recognition is not supported in this browser. Try Google Chrome or Microsoft Edge.');
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      setInput('');
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  const speakText = (text) => {
    if (!speechEnabled || !window.speechSynthesis) return;
    window.speechSynthesis.cancel(); // Stop current speech
    const cleanText = text.replace(/[*#-]/g, ''); // Strip markdown symbols
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    window.speechSynthesis.speak(utterance);
  };

  const handleSend = async (textToSend) => {
    const text = textToSend || input;
    if (!text.trim()) return;

    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }

    if (!textToSend) setInput('');

    // Push User message
    const userMsg = {
      id: Math.random().toString(36).substring(2, 9),
      sender: 'user',
      text,
      time: new Date()
    };
    setMessages(prev => [...prev, userMsg]);
    setIsTyping(true);

    try {
      const res = await fetch('http://localhost:5000/api/chatbot/ask', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ message: text })
      });

      if (res.ok) {
        const data = await res.json();
        
        // Push Bot response
        const botMsg = {
          id: Math.random().toString(36).substring(2, 9),
          sender: 'bot',
          text: data.message,
          action: data.action,
          time: new Date()
        };
        
        setMessages(prev => [...prev, botMsg]);
        speakText(data.message);

        // If the bot triggered a navigation page action
        if (data.action) {
          setTimeout(() => {
            navigate(data.action);
            setIsOpen(false);
          }, 1500);
        }

      } else {
        throw new Error('Bot request failed');
      }
    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, {
        id: 'err',
        sender: 'bot',
        text: 'Sorry, I am having trouble connecting to the database server right now.',
        time: new Date()
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSend();
    }
  };

  // Helper to parse basic markdown bullet points and bolding for clean React display
  const formatText = (text) => {
    if (!text) return '';
    return text.split('\n').map((line, idx) => {
      let content = line;
      let isBullet = false;

      if (content.startsWith('- ')) {
        content = content.substring(2);
        isBullet = true;
      } else if (content.startsWith('* ')) {
        content = content.substring(2);
        isBullet = true;
      }

      // Regex to parse **bold** tags
      const boldRegex = /\*\*(.*?)\*\*/g;
      const parts = [];
      let lastIndex = 0;
      let match;

      while ((match = boldRegex.exec(content)) !== null) {
        if (match.index > lastIndex) {
          parts.push(content.substring(lastIndex, match.index));
        }
        parts.push(<strong key={match.index} className="font-bold text-primary-400 dark:text-primary-300">{match[1]}</strong>);
        lastIndex = boldRegex.lastIndex;
      }
      
      if (lastIndex < content.length) {
        parts.push(content.substring(lastIndex));
      }

      const elements = parts.length > 0 ? parts : content;

      if (isBullet) {
        return <li key={idx} className="ml-4 list-disc text-xs my-0.5">{elements}</li>;
      }

      return <p key={idx} className="text-xs my-1 leading-relaxed">{elements}</p>;
    });
  };

  // Suggestion chips configurations
  const suggestions = [
    'Which items are low stock?',
    'What products expire soon?',
    'Show reorder suggestions',
    'Go to defects page'
  ];

  return (
    <div className="fixed bottom-5 right-5 z-[50]">
      {/* Floating button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="h-14 w-14 rounded-full bg-gradient-to-tr from-primary-600 to-primary-500 text-white flex items-center justify-center shadow-lg hover:shadow-primary-500/20 hover:scale-105 active:scale-95 transition-all cursor-pointer border border-primary-400/20 relative"
        >
          <MessageSquare size={24} />
          <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-emerald-500 border-2 border-slate-900 flex items-center justify-center text-[9px] font-bold">
            🎙️
          </span>
        </button>
      )}

      {/* Expanded Chat Box */}
      {isOpen && (
        <div className="w-80 sm:w-96 h-[520px] bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col animate-fade-in text-slate-100">
          
          {/* Header */}
          <div className="p-4 border-b border-slate-800 bg-slate-950 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="h-9 w-9 rounded-xl bg-primary-600 flex items-center justify-center font-bold text-white shadow-md">
                <Bot size={18} />
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-semibold">Stock Voice Assistant</span>
                <span className="text-[10px] text-emerald-400 flex items-center gap-1 font-medium">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Voice Detection Ready
                </span>
              </div>
            </div>
            
            <div className="flex items-center gap-1">
              <button
                onClick={() => setSpeechEnabled(!speechEnabled)}
                title={speechEnabled ? "Voice output enabled" : "Voice output disabled"}
                className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                  speechEnabled 
                    ? 'bg-primary-500/20 border-primary-500/30 text-primary-400' 
                    : 'bg-slate-850 border-slate-800 text-slate-500 hover:text-slate-300'
                }`}
              >
                {speechEnabled ? <Volume2 size={14} /> : <VolumeX size={14} />}
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="text-slate-400 hover:text-white cursor-pointer h-7 w-7 rounded-lg hover:bg-slate-850 flex items-center justify-center transition-colors"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Messages Listing */}
          <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
            {messages.map(msg => (
              <div 
                key={msg.id}
                className={`flex gap-2.5 max-w-[85%] ${msg.sender === 'user' ? 'self-end flex-row-reverse' : 'self-start'}`}
              >
                <div className={`h-7 w-7 rounded-full shrink-0 flex items-center justify-center text-xs font-bold ${msg.sender === 'user' ? 'bg-primary-600 text-white' : 'bg-slate-800 text-slate-300'}`}>
                  {msg.sender === 'user' ? <User size={12} /> : <Bot size={12} />}
                </div>

                <div className="flex flex-col gap-1">
                  <div className={`p-3 rounded-2xl ${msg.sender === 'user' ? 'bg-primary-600 text-white rounded-tr-none' : 'bg-slate-800 text-slate-100 rounded-tl-none border border-slate-750'}`}>
                    {formatText(msg.text)}
                    
                    {msg.action && (
                      <div className="mt-2 pt-1 border-t border-slate-700/50 flex items-center gap-1 text-[10px] text-primary-300 font-semibold uppercase tracking-wider animate-pulse">
                        Redirecting to page <ArrowUpRight size={10} />
                      </div>
                    )}
                  </div>
                  <span className="text-[8px] text-slate-500 self-end px-1">
                    {new Date(msg.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            ))}

            {isTyping && (
              <div className="flex gap-2.5 max-w-[80%] self-start">
                <div className="h-7 w-7 rounded-full shrink-0 flex items-center justify-center text-xs bg-slate-800 text-slate-300">
                  <Bot size={12} />
                </div>
                <div className="p-3 rounded-2xl bg-slate-800 rounded-tl-none border border-slate-750 flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 bg-slate-400 rounded-full animate-bounce" />
                  <span className="h-1.5 w-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:0.2s]" />
                  <span className="h-1.5 w-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:0.4s]" />
                </div>
              </div>
            )}
            <div ref={messageEndRef} />
          </div>

          {/* Quick Suggestions Selection */}
          {messages.length === 1 && !isTyping && (
            <div className="px-4 py-2 border-t border-slate-800/50 flex flex-wrap gap-1.5">
              {suggestions.map((s, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSend(s)}
                  className="text-[10px] bg-slate-850 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-300 rounded-full px-2.5 py-1 transition-all cursor-pointer font-medium"
                >
                  {s}
                </button>
              ))}
            </div>
          )}

          {/* Listening Pulse Indicator */}
          {isListening && (
            <div className="px-4 py-1.5 bg-rose-500/10 border-t border-rose-500/20 text-rose-400 text-[11px] flex items-center justify-between animate-pulse">
              <span className="flex items-center gap-1.5 font-semibold">
                <Mic size={12} className="animate-spin" /> Listening to your voice... Speak now!
              </span>
              <button 
                onClick={toggleListening} 
                className="text-[10px] underline hover:text-white cursor-pointer"
              >
                Stop
              </button>
            </div>
          )}

          {/* Input Area */}
          <div className="p-3 bg-slate-950 border-t border-slate-800 flex items-center gap-2">
            <button
              onClick={toggleListening}
              title={isListening ? "Stop voice listening" : "Start voice detection"}
              className={`h-9 w-9 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
                isListening 
                  ? 'bg-rose-600 text-white animate-pulse shadow-lg shadow-rose-600/30' 
                  : 'bg-slate-850 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800'
              }`}
            >
              {isListening ? <MicOff size={16} /> : <Mic size={16} />}
            </button>

            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder={isListening ? "Listening..." : "Type or speak query..."}
              className="flex-1 bg-slate-850 border border-slate-800 text-xs rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-primary-500 text-slate-200 outline-none placeholder-slate-500"
            />

            <button
              onClick={() => handleSend()}
              className="h-9 w-9 bg-primary-600 hover:bg-primary-500 rounded-xl text-white flex items-center justify-center cursor-pointer transition-colors shadow-md shadow-primary-900/10 active:scale-95"
            >
              <Send size={14} />
            </button>
          </div>

        </div>
      )}
    </div>
  );
};

export default ChatbotWidget;
