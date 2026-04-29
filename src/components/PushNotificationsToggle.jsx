import React, { useState, useEffect } from 'react';
import { Bell, BellOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

// Store subscription state in localStorage
const STORAGE_KEY = 'push_categories_subscribed';

export default function PushNotificationsToggle({ eventCategory }) {
  const [subscribed, setSubscribed] = useState(false);
  const [permission, setPermission] = useState('default');

  useEffect(() => {
    if (typeof Notification !== 'undefined') {
      setPermission(Notification.permission);
    }
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    if (eventCategory && stored.includes(eventCategory)) setSubscribed(true);
  }, [eventCategory]);

  const toggle = async () => {
    if (typeof Notification === 'undefined') {
      toast.error('Ваш браузер не поддерживает уведомления');
      return;
    }

    if (subscribed) {
      // Unsubscribe from this category
      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
      const updated = stored.filter(c => c !== eventCategory);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      setSubscribed(false);
      toast.success('Уведомления отключены для этой категории');
      return;
    }

    // Request permission if needed
    let perm = permission;
    if (perm !== 'granted') {
      perm = await Notification.requestPermission();
      setPermission(perm);
    }

    if (perm !== 'granted') {
      toast.error('Разрешите уведомления в настройках браузера');
      return;
    }

    // Subscribe
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    if (!stored.includes(eventCategory)) stored.push(eventCategory);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
    setSubscribed(true);
    toast.success('Уведомления включены — вы получите оповещение о новых событиях в этой категории');

    // Demo notification
    new Notification('OpportunityHub', {
      body: `Вы подписаны на уведомления для категории "${eventCategory}"`,
      icon: '/favicon.ico',
    });
  };

  return (
    <Button
      variant="outline"
      onClick={toggle}
      className={`w-full rounded-full gap-2 ${subscribed ? 'border-primary text-primary' : ''}`}
    >
      {subscribed ? <Bell className="w-4 h-4 fill-current" /> : <BellOff className="w-4 h-4" />}
      {subscribed ? 'Уведомления вкл.' : 'Уведомлять о новых'}
    </Button>
  );
}