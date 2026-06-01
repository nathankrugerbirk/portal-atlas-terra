/** Formata hectares com separador de milhar */
export function formatHa(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

/** Formata alqueires */
export function formatAlq(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

/** Formata percentual */
export function formatPct(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(value) + "%";
}

/** Extrai ID de vídeo do YouTube */
export function getYouTubeId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

/** Detecta provider de vídeo */
export function detectVideoProvider(url: string): "youtube" | "vimeo" | "other" {
  if (url.includes("youtube.com") || url.includes("youtu.be")) return "youtube";
  if (url.includes("vimeo.com")) return "vimeo";
  return "other";
}

/** Constrói email interno a partir do username */
export function usernameToEmail(username: string): string {
  const domain = process.env.NEXT_PUBLIC_INTERNAL_EMAIL_DOMAIN || "atlasterra.portal";
  return `${username.toLowerCase().replace(/\s+/g, "")}@${domain}`;
}

/** Formata data pt-BR */
export function formatDate(date: string): string {
  return new Date(date).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

/** Trunca texto */
export function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  return text.slice(0, max) + "…";
}

/** Converte ha para alqueires paulistas (1 alq = 2.42 ha) */
export function haToAlq(ha: number): number {
  return ha / 2.42;
}
