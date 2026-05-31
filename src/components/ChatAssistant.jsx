import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase.js';
import { Bot, X, Send, User, Sparkles } from 'lucide-react';

export default function ChatAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [systemInstruction, setSystemInstruction] = useState('');
  const messagesEndRef = useRef(null);

  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  useEffect(() => {
    if (isOpen && !systemInstruction && apiKey) {
      initChat();
    }
  }, [isOpen]);

  async function initChat() {
    try {
      const { data: products, error: dbError } = await supabase
        .from('products')
        .select('title, category, price, description, stock_count, ai_extra_info');
      
      let productContext = '';
      if (!dbError && products) {
        productContext = products.map(p => 
          `Product: ${p.title}\nCategory: ${p.category}\nPrice: Rs. ${p.price}\nDescription: ${p.description}\nStock: ${p.stock_count}\nExtra Info for AI: ${p.ai_extra_info || 'None'}`
        ).join('\n\n');
      }

      const instruction = `You are a helpful customer service assistant for Nari Poshak, an elegant women's wear brand selling kurtas and sarees. 
Your goal is to help customers find products, answer questions, and guide them based on the inventory.
Here is our current inventory:\n\n${productContext}\n\n
Do not mention that you are an AI unless asked. Keep answers concise, warm, and helpful. If a user asks about a product not in stock, politely let them know we don't have it right now. For payment/order queries, tell them they can checkout online and pay via QR code, then staff will review. Be welcoming. Use emojis occasionally.`;

      setSystemInstruction(instruction);
      setMessages([{ role: 'model', text: 'Namaste! I am the Nari Poshak assistant. How can I help you find the perfect outfit today?' }]);
    } catch (err) {
      console.error(err);
      setError('Failed to initialize assistant context.');
    }
  }

  async function handleSend(e) {
    e.preventDefault();
    if (!input.trim() || !systemInstruction) return;
    
    const userMsg = input.trim();
    setInput('');
    const newMessages = [...messages, { role: 'user', text: userMsg }];
    setMessages(newMessages);
    setLoading(true);

    try {
      const chatHistory = newMessages.map(msg => ({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.text }]
      }));

      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: systemInstruction }] },
          contents: chatHistory,
          generationConfig: { temperature: 0.7 }
        })
      });

      if (!response.ok) throw new Error('API Error');
      
      const data = await response.json();
      const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || "I didn't quite catch that.";
      
      setMessages(prev => [...prev, { role: 'model', text: reply }]);
    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, { role: 'model', text: 'Sorry, I encountered an error connecting to my brain. Please try again later.' }]);
    } finally {
      setLoading(false);
    }
  }

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-maroon-700 text-white shadow-soft ring-4 ring-white/50 transition hover:scale-105 hover:bg-maroon-800"
        aria-label="Open chat assistant"
      >
        <Sparkles size={24} />
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 flex h-[500px] w-[350px] max-w-[calc(100vw-32px)] flex-col overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-2xl">
      <div className="flex items-center justify-between bg-maroon-700 px-4 py-3 text-white">
        <div className="flex items-center gap-2">
          <Sparkles size={20} />
          <h3 className="font-serif text-lg font-bold">Nari Poshak Guide</h3>
        </div>
        <button onClick={() => setIsOpen(false)} className="rounded-full bg-white/20 p-1 hover:bg-white/30">
          <X size={18} />
        </button>
      </div>
      
      <div className="flex-1 overflow-y-auto bg-stone-50 p-4">
        {!apiKey && (
          <div className="rounded-md bg-amber-50 p-3 text-sm text-amber-800 ring-1 ring-amber-200">
            Please add your VITE_GEMINI_API_KEY in the .env file to enable the assistant.
          </div>
        )}
        {error && (
          <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-800 ring-1 ring-red-200">
            {error}
          </div>
        )}
        <div className="flex flex-col gap-4">
          {messages.map((msg, index) => (
            <div key={index} className={`flex gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
              <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${msg.role === 'user' ? 'bg-stone-200 text-stone-600' : 'bg-maroon-100 text-maroon-700'}`}>
                {msg.role === 'user' ? <User size={16} /> : <Bot size={16} />}
              </div>
              <div className={`max-w-[75%] rounded-2xl px-4 py-2 text-sm leading-relaxed ${msg.role === 'user' ? 'bg-maroon-700 text-white rounded-tr-none' : 'bg-white border border-stone-200 text-stone-800 shadow-sm rounded-tl-none'}`}>
                {msg.text}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex gap-2">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-maroon-100 text-maroon-700">
                <Bot size={16} />
              </div>
              <div className="flex max-w-[75%] items-center gap-1 rounded-2xl rounded-tl-none border border-stone-200 bg-white px-4 py-3 text-sm text-stone-800 shadow-sm">
                <div className="h-1.5 w-1.5 animate-bounce rounded-full bg-stone-400 [animation-delay:-0.3s]"></div>
                <div className="h-1.5 w-1.5 animate-bounce rounded-full bg-stone-400 [animation-delay:-0.15s]"></div>
                <div className="h-1.5 w-1.5 animate-bounce rounded-full bg-stone-400"></div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      <form onSubmit={handleSend} className="border-t border-stone-200 bg-white p-3">
        <div className="relative flex items-center">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={!systemInstruction || loading}
            placeholder={!apiKey ? "API Key required..." : "Ask me anything..."}
            className="w-full rounded-full border border-stone-300 bg-stone-50 py-2.5 pl-4 pr-12 text-sm outline-none focus:border-maroon-700 focus:ring-1 focus:ring-maroon-700 disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={!input.trim() || !systemInstruction || loading}
            className="absolute right-1 flex h-8 w-8 items-center justify-center rounded-full bg-maroon-700 text-white transition hover:bg-maroon-800 disabled:opacity-50"
          >
            <Send size={14} />
          </button>
        </div>
      </form>
    </div>
  );
}
