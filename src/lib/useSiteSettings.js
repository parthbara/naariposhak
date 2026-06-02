import { useEffect, useState } from 'react';
import { isSupabaseConfigured, supabase } from './supabase.js';
import { paymentOptions as fallbackPayments } from '../data/paymentOptions.js';
import { contactInfo as fallbackContact, whatsappUrl as fallbackWhatsappUrl } from '../data/contactInfo.js';

const defaultAnnouncement = { enabled: false, text: '', color: 'maroon' };
const defaultSiteMeta = {
  title: 'Nari Poshak | Kurtas, Sarees & Tailoring',
  description: 'Elegant women\'s wear — kurtas, sarees, and complete styling from Boudha, Kathmandu.',
};
const defaultAiConfig = { model: 'z-ai/glm-5.1', enabled: true };
const defaultLandingPage = {
  heroSubtitle: "Kurtas, sarees & complete women's wear",
  heroTitle: "Nari Poshak",
  heroDescription: "Sophisticated women's wear with elegant cuts, thoughtful fabric selection, and ready garments for everyday confidence and special moments.",
  heroImages: [
    "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=900&q=85",
    "https://images.unsplash.com/photo-1610189012035-7e3fcbdaeb1a?auto=format&fit=crop&w=900&q=85"
  ]
};

let cachedSettings = null;

export default function useSiteSettings() {
  const [settings, setSettings] = useState(cachedSettings || {
    paymentOptions: fallbackPayments,
    contactInfo: fallbackContact,
    whatsappUrl: fallbackWhatsappUrl,
    announcement: defaultAnnouncement,
    siteMeta: defaultSiteMeta,
    aiConfig: defaultAiConfig,
    landingPage: defaultLandingPage,
    loading: !cachedSettings,
  });

  useEffect(() => {
    if (cachedSettings || !isSupabaseConfigured) return;

    let active = true;

    async function fetchSettings() {
      const { data, error } = await supabase
        .from('site_settings')
        .select('key, value');

      if (!active || error || !data?.length) {
        if (active) setSettings((s) => ({ ...s, loading: false }));
        return;
      }

      const map = Object.fromEntries(data.map((row) => [row.key, row.value]));

      const paymentOpts = Array.isArray(map.payment_options) && map.payment_options.length
        ? map.payment_options
        : fallbackPayments;

      const contact = map.contact_info && map.contact_info.phone
        ? map.contact_info
        : fallbackContact;

      const whatsapp = contact.whatsapp
        ? `https://wa.me/${contact.whatsapp}`
        : fallbackWhatsappUrl;

      const resolved = {
        paymentOptions: paymentOpts,
        contactInfo: contact,
        whatsappUrl: whatsapp,
        announcement: map.announcement || defaultAnnouncement,
        siteMeta: map.site_meta || defaultSiteMeta,
        aiConfig: map.ai_config || defaultAiConfig,
        landingPage: map.landing_page || defaultLandingPage,
        loading: false,
      };

      cachedSettings = resolved;
      if (active) setSettings(resolved);
    }

    fetchSettings();
    return () => { active = false; };
  }, []);

  return settings;
}
