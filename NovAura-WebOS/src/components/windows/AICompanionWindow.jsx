import React, { useState, useRef, useEffect } from 'react';
import CuteRobotHeadSimple from '../CuteRobotHeadSimple';
import { 
  MessageSquare, 
  Settings, 
  Mic, 
  Send,
  Sparkles,
  Heart,
  Zap,
  Moon,
  Sun,
  Volume2,
  VolumeX,
  Bot
} from 'lucide-react';

// AI Companion Window for Nova OS
export default function AICompanionWindow() {
  const [mood, setMood] = useState('happy');
  const [messages, setMessages] = useState([
    { id: 1, text: "Hi there! I'm Nova, your AI companion! 💕", sender: 'ai' },
    { id: 2, text: "How can I help you today?", sender: 'ai' }
  ]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const messagesEndRef = useRef(null);

  const moodResponses = {
    happy: ["That's wonderful! ✨", "You make me smile! 💕", "I'm so happy to hear that!"],
    curious: ["Tell me more! 👀", "That's fascinating!", "I want to learn about that!"],
    excited: ["OMG really?! 🎉", "That's AMAZING! ✨", "I'm so excited for you!"],
    calm: ["I see, take your time... 🌸", "That's peaceful.", "Let's relax together."],
    sleepy: ["*yawns* That's nice... 😴", "So cozy...", "Zzz... just kidding! 💤"]
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = () => {
    if (!inputText.trim()) return;

    // Add user message
    const userMessage = { id: Date.now(), text: inputText, sender: 'user' };
    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsTyping(true);

    // Simulate AI response
    setTimeout(() => {
      const responses = moodResponses[mood];
      const randomResponse = responses[Math.floor(Math.random() * responses.length)];
      
      const aiMessage = { 
        id: Date.now() + 1, 
        text: randomResponse, 
        sender: 'ai' 
      };
      setMessages(prev => [...prev, aiMessage]);
      setIsTyping(false);
    }, 1000 + Math.random() * 1000);
  };

  const handleMoodChange = (newMood) => {
    setMood(newMood);
    const moodMessages = {
      happy: "I'm feeling so happy! 💕",
      curious: "What's on your mind? I'm curious! 👀",
      excited: "Wooo! Let's do something fun! ✨",
      calm: "Ahh, let's take it easy... 🌸",
      sleepy: "I'm getting a bit sleepy... 💤"
    };
    
    setMessages(prev => [...prev, {
      id: Date.now(),
      text: moodMessages[newMood],
      sender: 'ai'
    }]);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const moodColors = {
    happy: 'from-pink-500 to-rose-500',
    curious: 'from-violet-500 to-purple-500',
    excited: 'from-amber-500 to-yellow-500',
    calm: 'from-blue-500 to-cyan-500',
    sleepy: 'from-indigo-500 to-violet-500'
  };

  return (
    <div className="flex flex-col h-full bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header with Robot Avatar */}
      <div className={`flex items-center justify-between px-4 py-2 
                      bg-gradient-to-r ${moodColors[mood]} 
                      transition-all duration-500`}>
        <div className="flex items-center gap-3">
          {/* Live Robot Head in Header */}
          <div className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-sm 
                          flex items-center justify-center border-2 border-white/20">
            <CuteRobotHeadSimple 
              size="small" 
              mood={mood}
              onClick={handleMoodChange}
            />
          </div>
          <div>
            <h3 className="font-bold text-white">Nova AI</h3>
            <p className="text-xs text-white/70 capitalize">{mood} • Online</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setIsMuted(!isMuted)}
            className="p-2 rounded-lg bg-white/10 hover:bg-white/20 
                      transition-colors text-white"
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>
          <button 
            onClick={() => setIsDarkMode(!isDarkMode)}
            className="p-2 rounded-lg bg-white/10 hover:bg-white/20 
                      transition-colors text-white"
          >
            {isDarkMode ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
          </button>
          <button className="p-2 rounded-lg bg-white/10 hover:bg-white/20 
                           transition-colors text-white">
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Chat Area */}
        <div className="flex-1 flex flex-col">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {/* Welcome Robot Display */}
            {messages.length <= 2 && (
              <div className="flex flex-col items-center justify-center py-8">
                <div className="p-6 bg-slate-800/50 rounded-3xl border border-slate-700/50">
                  <CuteRobotHeadSimple 
                    size="large"
                    mood={mood}
                    onClick={handleMoodChange}
                  />
                </div>
                <p className="text-slate-400 text-sm mt-4 text-center">
                  Click me to change my mood!
                </p>
              </div>
            )}
            
            {messages.map((msg) => (
              <div 
                key={msg.id}
                className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div 
                  className={`max-w-[70%] px-4 py-2 rounded-2xl 
                            ${msg.sender === 'user' 
                              ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white' 
                              : 'bg-slate-700/50 text-slate-200 backdrop-blur-sm'
                            }`}
                >
                  {msg.text}
                </div>
              </div>
            ))}
            
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-slate-700/50 px-4 py-3 rounded-2xl flex gap-1">
                  <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" />
                  <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" 
                        style={{ animationDelay: '0.1s' }} />
                  <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" 
                        style={{ animationDelay: '0.2s' }} />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-4 border-t border-slate-700/50">
            <div className="flex gap-2">
              <button className="p-3 rounded-xl bg-slate-700/50 text-slate-300 
                               hover:bg-slate-700 transition-colors">
                <Mic className="w-5 h-5" />
              </button>
              
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type a message..."
                className="flex-1 px-4 py-3 rounded-xl bg-slate-700/50 
                         text-slate-200 placeholder-slate-400
                         focus:outline-none focus:ring-2 focus:ring-purple-500/50
                         border border-slate-600/30"
              />
              
              <button 
                onClick={handleSend}
                disabled={!inputText.trim()}
                className="p-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500
                         text-white disabled:opacity-50 disabled:cursor-not-allowed
                         hover:opacity-90 transition-opacity"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Side Panel - Robot Avatar */}
        <div className="w-60 border-l border-slate-700/50 p-4 
                      bg-slate-800/30 backdrop-blur-sm
                      flex flex-col items-center gap-4 overflow-y-auto">
          
          {/* Animated Robot Head */}
          <div className="flex-shrink-0 p-4 bg-slate-700/30 rounded-2xl">
            <CuteRobotHeadSimple 
              size="medium"
              mood={mood}
              onClick={handleMoodChange}
            />
          </div>

          {/* Mood Selector */}
          <div className="w-full">
            <p className="text-xs text-slate-400 mb-2 text-center">Change Mood</p>
            <div className="grid grid-cols-5 gap-1">
              {[
                { id: 'happy', icon: Heart, color: 'text-pink-400' },
                { id: 'curious', icon: Sparkles, color: 'text-violet-400' },
                { id: 'excited', icon: Zap, color: 'text-amber-400' },
                { id: 'calm', icon: Moon, color: 'text-blue-400' },
                { id: 'sleepy', icon: Sun, color: 'text-indigo-400' },
              ].map((m) => (
                <button
                  key={m.id}
                  onClick={() => handleMoodChange(m.id)}
                  className={`p-2 rounded-lg transition-all duration-300
                           ${mood === m.id 
                             ? 'bg-slate-600/50 scale-110' 
                             : 'hover:bg-slate-700/30'
                           }`}
                >
                  <m.icon className={`w-4 h-4 ${m.color} ${mood === m.id ? 'scale-110' : ''}`} />
                </button>
              ))}
            </div>
          </div>

          {/* Stats */}
          <div className="w-full mt-auto space-y-2">
            <div className="bg-slate-700/30 rounded-lg p-3">
              <p className="text-xs text-slate-400">Affection</p>
              <div className="flex items-center gap-2 mt-1">
                <Heart className="w-4 h-4 text-pink-400" fill="currentColor" />
                <div className="flex-1 h-2 bg-slate-600 rounded-full overflow-hidden">
                  <div className="w-3/4 h-full bg-gradient-to-r from-pink-400 to-rose-400" />
                </div>
              </div>
            </div>
            
            <div className="bg-slate-700/30 rounded-lg p-3">
              <p className="text-xs text-slate-400">Energy</p>
              <div className="flex items-center gap-2 mt-1">
                <Zap className="w-4 h-4 text-amber-400" fill="currentColor" />
                <div className="flex-1 h-2 bg-slate-600 rounded-full overflow-hidden">
                  <div className="w-4/5 h-full bg-gradient-to-r from-amber-400 to-yellow-400" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
