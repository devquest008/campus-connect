import { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Send, Search, MessageSquare, Globe, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/stores/authStore';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { Tables } from '@/integrations/supabase/types';

type Profile = Tables<'profiles'>;
type Message = Tables<'messages'>;
type Connection = Tables<'connections'>;

interface ChatContact {
  profile: Profile;
  lastMessage?: Message;
  unreadCount: number;
  isCrossCampus: boolean;
}

export default function Chat() {
  const { profile } = useAuthStore();
  const [tab, setTab] = useState<'campus' | 'cross'>('campus');
  const [contacts, setContacts] = useState<ChatContact[]>([]);
  const [selectedContact, setSelectedContact] = useState<ChatContact | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!profile) return;
    loadContacts();
  }, [profile, tab]);

  useEffect(() => {
    if (!selectedContact || !profile) return;
    loadMessages();

    const channel = supabase.channel(`chat-${selectedContact.profile.user_id}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
      }, (payload) => {
        const msg = payload.new as Message;
        if (
          (msg.sender_id === selectedContact.profile.user_id && msg.receiver_id === profile.user_id) ||
          (msg.sender_id === profile.user_id && msg.receiver_id === selectedContact.profile.user_id)
        ) {
          setMessages(prev => [...prev, msg]);
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [selectedContact]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadContacts = async () => {
    if (!profile) return;
    const { data: connections } = await supabase
      .from('connections')
      .select('*')
      .eq('status', 'accepted')
      .or(`requester_id.eq.${profile.user_id},addressee_id.eq.${profile.user_id}`);

    if (!connections) return;

    const filtered = tab === 'campus'
      ? connections.filter(c => !c.is_cross_campus)
      : connections.filter(c => c.is_cross_campus);

    const contactProfiles: ChatContact[] = [];
    for (const conn of filtered) {
      const otherId = conn.requester_id === profile.user_id ? conn.addressee_id : conn.requester_id;
      const { data: prof } = await supabase.from('profiles').select('*').eq('user_id', otherId).single();
      if (prof) {
        contactProfiles.push({
          profile: prof,
          unreadCount: 0,
          isCrossCampus: conn.is_cross_campus,
        });
      }
    }
    setContacts(contactProfiles);
  };

  const loadMessages = async () => {
    if (!profile || !selectedContact) return;
    const otherId = selectedContact.profile.user_id;
    const { data } = await supabase
      .from('messages')
      .select('*')
      .or(`and(sender_id.eq.${profile.user_id},receiver_id.eq.${otherId}),and(sender_id.eq.${otherId},receiver_id.eq.${profile.user_id})`)
      .is('session_id', null)
      .order('created_at', { ascending: true })
      .limit(100);
    if (data) setMessages(data);
  };

  const sendMessage = async () => {
    if (!profile || !selectedContact || !newMessage.trim()) return;
    setSending(true);
    await supabase.from('messages').insert({
      sender_id: profile.user_id,
      receiver_id: selectedContact.profile.user_id,
      content: newMessage.trim(),
    });
    setNewMessage('');
    setSending(false);
  };

  const filteredContacts = contacts.filter(c =>
    (c.profile.display_name || c.profile.username).toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex h-[calc(100vh-8rem)] md:h-[calc(100vh-5rem)] rounded-xl overflow-hidden glass">
      {/* Contacts Panel */}
      <div className={cn(
        "w-full md:w-80 flex flex-col border-r border-border/30",
        selectedContact ? "hidden md:flex" : "flex"
      )}>
        {/* Tabs */}
        <div className="flex border-b border-border/30">
          <button
            onClick={() => setTab('campus')}
            className={cn(
              "flex-1 py-3 text-sm font-display font-semibold transition-all",
              tab === 'campus' ? 'text-primary border-b-2 border-primary' : 'text-muted-foreground'
            )}
          >
            Campus Chat
          </button>
          <button
            onClick={() => setTab('cross')}
            className={cn(
              "flex-1 py-3 text-sm font-display font-semibold transition-all flex items-center justify-center gap-1",
              tab === 'cross' ? 'text-secondary border-b-2 border-secondary' : 'text-muted-foreground'
            )}
          >
            <Globe className="w-3 h-3" /> Cross-Campus
          </button>
        </div>

        {/* Search */}
        <div className="p-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search contacts..."
              className="pl-9 bg-muted/30"
            />
          </div>
        </div>

        {/* Contact List */}
        <div className="flex-1 overflow-y-auto">
          {filteredContacts.length === 0 ? (
            <div className="p-6 text-center">
              <MessageSquare className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No connections yet</p>
              <p className="text-xs text-muted-foreground mt-1">Find students on the dashboard to connect</p>
            </div>
          ) : (
            filteredContacts.map(contact => (
              <button
                key={contact.profile.id}
                onClick={() => setSelectedContact(contact)}
                className={cn(
                  "w-full p-3 flex items-center gap-3 hover:bg-muted/30 transition-colors border-b border-border/10",
                  selectedContact?.profile.id === contact.profile.id && "bg-muted/40"
                )}
              >
                <div className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center",
                  contact.isCrossCampus ? "bg-secondary/20" : "bg-primary/20"
                )}>
                  <span className={cn("font-display font-bold text-sm", contact.isCrossCampus ? "text-secondary" : "text-primary")}>
                    {(contact.profile.display_name || contact.profile.username)?.[0]?.toUpperCase()}
                  </span>
                </div>
                <div className="flex-1 text-left">
                  <h3 className="text-sm font-semibold text-foreground">{contact.profile.display_name || contact.profile.username}</h3>
                  <p className="text-xs text-muted-foreground truncate">{contact.profile.department}</p>
                </div>
                {contact.profile.is_online && <div className="w-2 h-2 rounded-full bg-neon-green" />}
              </button>
            ))
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className={cn(
        "flex-1 flex flex-col",
        !selectedContact ? "hidden md:flex" : "flex"
      )}>
        {selectedContact ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b border-border/30 flex items-center gap-3">
              <button
                onClick={() => setSelectedContact(null)}
                className="md:hidden text-muted-foreground hover:text-foreground"
              >
                ←
              </button>
              <div className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center",
                selectedContact.isCrossCampus ? "bg-secondary/20" : "bg-primary/20"
              )}>
                <span className={cn("font-display font-bold text-xs", selectedContact.isCrossCampus ? "text-secondary" : "text-primary")}>
                  {(selectedContact.profile.display_name || selectedContact.profile.username)?.[0]?.toUpperCase()}
                </span>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-foreground">{selectedContact.profile.display_name}</h3>
                <p className="text-xs text-muted-foreground">
                  {selectedContact.profile.is_online ? <span className="text-neon-green">Online</span> : 'Offline'}
                </p>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.map(msg => {
                const isMine = msg.sender_id === profile?.user_id;
                return (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={cn("flex", isMine ? "justify-end" : "justify-start")}
                  >
                    <div className={cn(
                      "max-w-[75%] px-4 py-2 rounded-2xl text-sm",
                      isMine
                        ? selectedContact.isCrossCampus
                          ? "bg-secondary/20 text-foreground neon-border-magenta"
                          : "bg-primary/20 text-foreground neon-border-cyan"
                        : "bg-muted text-foreground"
                    )}>
                      <p>{msg.content}</p>
                      <p className="text-[10px] text-muted-foreground mt-1">
                        {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </motion.div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-3 border-t border-border/30">
              <div className="flex gap-2">
                <Input
                  value={newMessage}
                  onChange={e => setNewMessage(e.target.value)}
                  placeholder="Type a message..."
                  className="bg-muted/30"
                  onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                />
                <Button onClick={sendMessage} disabled={sending || !newMessage.trim()} size="icon" className="glow-cyan shrink-0">
                  {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <MessageSquare className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-muted-foreground">Select a conversation</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
