-- =============================================================================
-- Portal Atlas Terra — Configurações de Compartilhamento por Fazenda
-- Execute no Supabase SQL Editor
-- =============================================================================

ALTER TABLE public.farms
  ADD COLUMN IF NOT EXISTS share_enabled       boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS share_contact_msg   text    DEFAULT 'Entre em contato conosco para mais informações sobre esta propriedade.',
  ADD COLUMN IF NOT EXISTS share_contact_link  text,
  ADD COLUMN IF NOT EXISTS share_contact_phone text;

-- Comentários
COMMENT ON COLUMN public.farms.share_enabled       IS 'Controla se a página pública de compartilhamento está ativa';
COMMENT ON COLUMN public.farms.share_contact_msg   IS 'Mensagem exibida no CTA de contato da página pública';
COMMENT ON COLUMN public.farms.share_contact_link  IS 'URL de contato (WhatsApp, site, etc.) exibida na página pública';
COMMENT ON COLUMN public.farms.share_contact_phone IS 'Número de telefone exibido na página pública (formato livre)';
