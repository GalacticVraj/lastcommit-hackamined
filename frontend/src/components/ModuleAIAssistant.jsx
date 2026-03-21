import { useState, useEffect } from 'react';
import { Sparkles, X, Send, Loader2, MessageSquare, ArrowRight } from 'lucide-react';
import api from '../lib/api';

export default function ModuleAIAssistant({ moduleName, currentTab, data }) {
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [summary, setSummary] = useState('');
    const [query, setQuery] = useState('');
    const [chats, setChats] = useState([]);

    const handleSummarize = async () => {
        setLoading(true);
        try {
            const res = await api.post('/ai/summarize', {
                type: `${moduleName} - ${currentTab}`,
                data: data.slice(0, 50) // Send first 50 records for context
            });
            if (res.data?.success) {
                setSummary(res.data.data.summary);
                setChats([{ role: 'assistant', content: res.data.data.summary }]);
            }
        } catch (error) {
            console.error('AI summary failed');
        } finally {
            setLoading(false);
        }
    };

    const handleQuery = async (e) => {
        e.preventDefault();
        if (!query.trim() || loading) return;

        const userMsg = query;
        setQuery('');
        setChats(prev => [...prev, { role: 'user', content: userMsg }]);
        setLoading(true);

        try {
            // Re-using the summarize endpoint or a new chat endpoint if I had one.
            // For now, I'll just use the same logic but adjust the "type" to be the query.
            const res = await api.post('/ai/summarize', {
                type: `User Question about ${moduleName}: ${userMsg}`,
                data: data.slice(0, 20)
            });
            if (res.data?.success) {
                setChats(prev => [...prev, { role: 'assistant', content: res.data.data.summary }]);
            }
        } catch (error) {
            setChats(prev => [...prev, { role: 'assistant', content: "I'm sorry, I couldn't process that request right now." }]);
        } finally {
            setLoading(false);
        }
    };

    // Auto-summarize when opened if no summary exists
    useEffect(() => {
        if (isOpen && chats.length === 0 && data.length > 0) {
            handleSummarize();
        }
    }, [isOpen]);

    return (
        <div style={{ position: 'fixed', bottom: '100px', right: '28px', zIndex: 9998 }}>
            {!isOpen ? (
                <button
                    onClick={() => setIsOpen(true)}
                    style={{
                        background: '#1C1A17',
                        color: 'white',
                        padding: '10px 18px',
                        borderRadius: '30px',
                        border: '2px solid #E8720C',
                        boxShadow: '0 8px 30px rgba(0,0,0,0.2)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        cursor: 'pointer',
                        fontSize: '13px',
                        fontWeight: 600,
                        transition: 'all 200ms ease'
                    }}
                    onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                    onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
                >
                    <Sparkles size={16} />
                    Smart Assistant
                </button>
            ) : (
                <div style={{
                    width: '380px',
                    height: '500px',
                    background: 'white',
                    borderRadius: '16px',
                    border: '1px solid #E2DDD6',
                    display: 'flex',
                    flexDirection: 'column',
                    boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
                    overflow: 'hidden',
                    animation: 'slideUp 300ms cubic-bezier(0.32, 0.72, 0, 1)'
                }}>
                    <header style={{
                        padding: '16px 20px',
                        background: '#F4F2EE',
                        borderBottom: '1px solid #E2DDD6',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Sparkles size={18} color="#E8720C" />
                            <span style={{ fontWeight: 700, fontSize: '14px' }}>TechMicra AI</span>
                        </div>
                        <button onClick={() => setIsOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9C9488' }}>
                            <X size={20} />
                        </button>
                    </header>

                    <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }} className="custom-scrollbar">
                        {chats.length === 0 && !loading && (
                            <div style={{ textAlign: 'center', color: '#9C9488', marginTop: '40px' }}>
                                <MessageSquare size={32} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
                                <p style={{ fontSize: '13px' }}>How can I help you with the {moduleName} data today?</p>
                            </div>
                        )}
                        
                        {chats.map((chat, idx) => (
                            <div key={idx} style={{
                                alignSelf: chat.role === 'user' ? 'flex-end' : 'flex-start',
                                maxWidth: '85%',
                                background: chat.role === 'user' ? '#E8720C' : '#F4F2EE',
                                color: chat.role === 'user' ? 'white' : '#1C1A17',
                                padding: '12px 16px',
                                borderRadius: chat.role === 'user' ? '14px 14px 2px 14px' : '14px 14px 14px 2px',
                                fontSize: '13px',
                                lineHeight: 1.5
                            }}>
                                {chat.content}
                            </div>
                        ))}

                        {loading && (
                            <div style={{ alignSelf: 'flex-start', background: '#F4F2EE', padding: '12px 16px', borderRadius: '14px 14px 14px 2px', display: 'flex', gap: '8px', alignItems: 'center' }}>
                                <Loader2 size={16} className="animate-spin" />
                                <span style={{ fontSize: '12px', color: '#9C9488' }}>Thinking...</span>
                            </div>
                        )}
                    </div>

                    <form onSubmit={handleQuery} style={{ padding: '16px', borderTop: '1px solid #E2DDD6', display: 'flex', gap: '10px' }}>
                        <input
                            type="text"
                            placeholder="Ask a question..."
                            value={query}
                            onChange={e => setQuery(e.target.value)}
                            style={{
                                flex: 1,
                                border: '1px solid #E2DDD6',
                                borderRadius: '8px',
                                padding: '10px 14px',
                                fontSize: '13px',
                                outline: 'none'
                            }}
                        />
                        <button
                            type="submit"
                            disabled={loading || !query.trim()}
                            style={{
                                background: '#E8720C',
                                border: 'none',
                                borderRadius: '8px',
                                width: '40px',
                                height: '40px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: 'white',
                                cursor: 'pointer',
                                opacity: (loading || !query.trim()) ? 0.5 : 1
                            }}
                        >
                            <Send size={18} />
                        </button>
                    </form>
                    <div style={{ padding: '0 16px 8px', textAlign: 'right', fontSize: '9px', color: '#9C9488', letterSpacing: '0.05em' }}>
                        POWERED BY GROQ
                    </div>
                </div>
            )}
            <style>{`
                @keyframes slideUp {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-spin { animation: spin 1s linear infinite; }
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
            `}</style>
        </div>
    );
}
