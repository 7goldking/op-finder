import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { MessageCircle } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { getOrCreateConversation } from '@/lib/chat';

/**
 * Кнопка «Написать» — открывает (или создаёт) диалог с пользователем.
 * Пропс `other` — объект { email, name, avatar_url, full_name }.
 */
export default function MessageButton({ other, user, variant = 'outline', size = 'default', className = '', label = 'Написать' }) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const click = async () => {
    if (!user) {
      base44.auth.redirectToLogin(window.location.href);
      return;
    }
    if (!other?.email || other.email === user.email) return;
    setLoading(true);
    const convo = await getOrCreateConversation(user, other);
    setLoading(false);
    if (convo) navigate(`/chat?c=${convo.id}`);
  };

  return (
    <Button variant={variant} size={size} onClick={click} disabled={loading} className={`rounded-full gap-1.5 ${className}`}>
      <MessageCircle className="w-4 h-4" /> {loading ? '...' : label}
    </Button>
  );
}