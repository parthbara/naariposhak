import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase.js';
import useSiteSettings from '../lib/useSiteSettings.js';
import { Bot, X, Send, User, Sparkles, RefreshCw } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

const DEFAULT_MODEL = 'z-ai/glm-5.1';

const quickQuestions = [
  'What\'s in stock?',
  'How to order?',
  'Delivery info',
  'के के छ?',
];

export default function ChatAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [systemPrompt, setSystemPrompt] = useState('');
  const [ready, setReady] = useState(false);
  const messagesEndRef = useRef(null);
  const { contactInfo, aiConfig } = useSiteSettings();

  const apiKey = import.meta.env.VITE_NVIDIA_API_KEY;
  const model = aiConfig?.model || DEFAULT_MODEL;
  const aiEnabled = aiConfig?.enabled !== false;

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const initChat = useCallback(async () => {
    if (!apiKey || !aiEnabled) return;

    try {
      let rulesContext = '';
      let productContext = '';

      if (isSupabaseConfigured) {
        const { data: products, error: dbError } = await supabase
          .from('products')
          .select('title, category, price, description, stock_count');

        if (!dbError && products && products.length > 0) {
          rulesContext = `- ONLY recommend products from the inventory below. NEVER invent product names, prices, or availability.\n- If asked about a product not in inventory, say we don't carry it currently and suggest checking back or contacting us.`;
          productContext = '## Current Inventory\n' + products.map((p) =>
            `- **${p.title}** | Category: ${p.category} | Price: Rs. ${p.price} | Stock: ${p.stock_count} | ${p.description}`
          ).join('\n');
        } else {
          rulesContext = `- CRITICAL: We currently have NO products in stock and NO products listed online. You MUST NOT list, invent, or suggest any products. If asked about clothing, state clearly that the store is currently empty and they should check back later or contact us on WhatsApp.`;
          productContext = '## Inventory Status\nEmpty (0 items). Do not invent items.';
        }
      } else {
        rulesContext = `- CRITICAL: We currently have NO products in stock. You MUST NOT list, invent, or suggest any products. If asked about clothing, state clearly that the store is currently empty.`;
        productContext = '## Inventory Status\nNo live product data available. Do not invent items.';
      }

      const phone = contactInfo?.phone || '+977-9709611771';
      const address = contactInfo?.address || 'Boudha, Kathmandu, Nepal';
      const whatsapp = contactInfo?.whatsapp || '9779709611771';

      const instruction = `You are the friendly customer service assistant for Nari Poshak, an elegant women's wear brand in Nepal.

## Your Rules
${rulesContext}
- Keep answers concise, warm, and helpful. Use emojis occasionally.
- Do not mention you are an AI unless directly asked.
- For payment/order queries: customers checkout online, pay via QR code (eSewa, Khalti, or Bank), upload proof, then staff reviews and confirms via WhatsApp.

## Language
You speak English, Nepali (नेपाली), and Romanized Nepali (e.g., "yo kurta kati ko ho?").
Always reply in the same language the customer writes in. If they mix languages, match their style.
Use natural greetings like Namaste, Dhanyabad.

## Shop Info
- Phone/WhatsApp: ${phone}
- WhatsApp link: https://wa.me/${whatsapp}
- Address: ${address}
- Delivery: All over Nepal

${productContext}`;

      setSystemPrompt(instruction);
      setMessages([{
        role: 'assistant',
        content: 'Namaste! 🙏 I\'m the Nari Poshak assistant. How can I help you find the perfect outfit today?'
      }]);
      setReady(true);
    } catch (err) {
      console.error(err);
      setError('Failed to initialize assistant.');
    }
  }, [apiKey, aiEnabled, contactInfo]);

  useEffect(() => {
    if (isOpen && !ready && apiKey && aiEnabled) {
      initChat();
    }
  }, [isOpen, ready, apiKey, aiEnabled, initChat]);

  async function handleSend(text) {
    const userMsg = (text || input).trim();
    if (!userMsg || !systemPrompt) return;

    setInput('');
    const newMessages = [...messages, { role: 'user', content: userMsg }];
    setMessages(newMessages);
    setLoading(true);
    setError('');

    try {
      const apiMessages = [
        { role: 'system', content: systemPrompt },
        ...newMessages.map((msg) => ({
          role: msg.role === 'user' ? 'user' : 'assistant',
          content: msg.content,
        })),
      ];

      const response = await fetch('/api/nvidia/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          messages: apiMessages,
          temperature: 0.7,
          top_p: 0.95,
          max_tokens: 1024,
        }),
      });

      if (!response.ok) {
        const errBody = await response.text();
        throw new Error(`API ${response.status}: ${errBody.slice(0, 120)}`);
      }

      const data = await response.json();
      const reply = data.choices?.[0]?.message?.content || "I didn't quite catch that. Could you try again?";

      setMessages((prev) => [...prev, { role: 'assistant', content: reply }]);
    } catch (err) {
      console.error(err);
      setError('Connection issue. Please try again.');
      setMessages((prev) => [...prev, {
        role: 'assistant',
        content: 'Sorry, I encountered a connection issue. Please try again in a moment. 🙏'
      }]);
    } finally {
      setLoading(false);
    }
  }

  function handleSubmit(e) {
    e.preventDefault();
    handleSend();
  }

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-maroon-700 to-maroon-800 text-white shadow-soft ring-4 ring-white/50 transition hover:scale-110 hover:shadow-xl"
        aria-label="Open chat assistant"
      >
        <Sparkles size={24} />
      </button>
    );
  }

  return (
    <div className="chat-fade-in fixed bottom-6 right-6 z-50 flex h-[520px] w-[380px] max-w-[calc(100vw-32px)] flex-col overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-2xl">
      {/* Header */}
      <div className="flex items-center justify-between bg-gradient-to-r from-maroon-800 to-maroon-700 px-4 py-3 text-white">
        <div className="flex items-center gap-2">
          <div className="grid h-8 w-8 place-items-center rounded-full bg-white/20">
            <Sparkles size={16} />
          </div>
          <div>
            <h3 className="text-sm font-bold leading-tight">Nari Poshak Guide</h3>
            <p className="text-[10px] font-medium text-white/70">Always here to help</p>
          </div>
        </div>
        <button onClick={() => setIsOpen(false)} className="rounded-full p-1.5 transition hover:bg-white/20">
          <X size={16} />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto bg-stone-50 p-4">
        {!apiKey && (
          <div className="rounded-md bg-amber-50 p-3 text-sm text-amber-800 ring-1 ring-amber-200">
            AI assistant requires the VITE_NVIDIA_API_KEY in your .env file.
          </div>
        )}
        {!aiEnabled && apiKey && (
          <div className="rounded-md bg-stone-100 p-3 text-sm text-stone-600 ring-1 ring-stone-200">
            The AI assistant is currently disabled by the admin.
          </div>
        )}
        <div className="flex flex-col gap-3">
          {messages.map((msg, index) => (
            <div key={index} className={`flex gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
              <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${msg.role === 'user' ? 'bg-stone-200 text-stone-600' : 'bg-maroon-100 text-maroon-700'}`}>
                {msg.role === 'user' ? <User size={14} /> : <Bot size={14} />}
              </div>
              <div className={`max-w-[85%] rounded-2xl px-3.5 py-2 text-[13px] leading-relaxed ${msg.role === 'user' ? 'bg-maroon-700 text-white rounded-tr-sm' : 'bg-white border border-stone-200 text-stone-800 shadow-sm rounded-tl-sm'}`}>
                {msg.role === 'user' ? (
                  msg.content
                ) : (
                  <div className="prose prose-sm prose-stone max-w-none prose-p:leading-snug prose-p:my-1 prose-ul:my-1 prose-ol:my-1 prose-li:my-0.5">
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* Quick questions - shown after welcome message only */}
          {messages.length === 1 && !loading && (
            <div className="flex flex-wrap gap-1.5 pl-9">
              {quickQuestions.map((q) => (
                <button
                  key={q}
                  type="button"
                  onClick={() => handleSend(q)}
                  className="rounded-full border border-maroon-200 bg-white px-3 py-1 text-xs font-semibold text-maroon-700 transition hover:bg-maroon-50"
                >
                  {q}
                </button>
              ))}
            </div>
          )}

          {loading && (
            <div className="flex gap-2">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-maroon-100 text-maroon-700">
                <Bot size={14} />
              </div>
              <div className="flex items-center gap-1.5 rounded-2xl rounded-tl-sm border border-stone-200 bg-white px-4 py-3 shadow-sm">
                <div className="h-1.5 w-1.5 animate-bounce rounded-full bg-stone-400 [animation-delay:-0.3s]"></div>
                <div className="h-1.5 w-1.5 animate-bounce rounded-full bg-stone-400 [animation-delay:-0.15s]"></div>
                <div className="h-1.5 w-1.5 animate-bounce rounded-full bg-stone-400"></div>
              </div>
            </div>
          )}

          {error && !loading && (
            <div className="ml-9 flex items-center gap-2">
              <span className="text-xs text-red-600">{error}</span>
              <button onClick={initChat} className="inline-flex items-center gap-1 text-xs font-bold text-maroon-700 hover:underline">
                <RefreshCw size={11} /> Retry
              </button>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      <div className="border-t border-stone-200 bg-white p-3">
        <form onSubmit={handleSubmit} className="relative flex items-center">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={!ready || loading}
            placeholder={!apiKey ? 'API key required...' : 'Ask me anything...'}
            className="w-full rounded-full border border-stone-300 bg-stone-50 py-2.5 pl-4 pr-12 text-sm outline-none focus:border-maroon-700 focus:ring-1 focus:ring-maroon-700 disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={!input.trim() || !ready || loading}
            className="absolute right-1 flex h-8 w-8 items-center justify-center rounded-full bg-maroon-700 text-white transition hover:bg-maroon-800 disabled:opacity-40"
          >
            <Send size={14} />
          </button>
        </form>
        <p className="mt-1.5 text-center text-[10px] font-medium text-stone-400">Powered by AI · May not always be accurate</p>
      </div>
    </div>
  );
}
