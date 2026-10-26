// Editorial content follows feature-specification sections 2 and 35. Business
// destinations are optional, centrally configured, and never invented.
export const nutritionDisclaimer = "Displayed nutrition helps you make informed choices. Actual nutritional values may vary because of ingredient substitutions, preparation methods and portion differences.";
export const faqs = Object.freeze([
  { question: "Where do you deliver?", answer: "Nuede serves Abuja. Choose an available delivery area at checkout to see its current delivery fee before placing your order." },
  { question: "How does meal planning work?", answer: "Build a plan for 2–7 days, choosing meals for breakfast, lunch, dinner or snacks. Review your plan and nutrition summary, then continue to checkout. Your plan is saved automatically for your next visit." },
  { question: "Can I customize my meal?", answer: "Open a meal to see its available options and add-ons. Some meals ask you to choose one option before continuing. The price and nutrition summary update with your choices." },
  { question: "How should I use the nutrition information?", answer: "Use the displayed calories and macros to compare meals and review your basket or plan. Missing values are shown as unavailable rather than zero. Actual prepared-food nutrition can vary; see our nutrition note below." },
  { question: "Which payment methods can I use?", answer: "Checkout shows the payment methods currently available for your order. Review the order summary and total before choosing a method." },
  { question: "What happens when I pay with Paystack?", answer: "You'll continue to Paystack to pay securely, then return to Nuede while we confirm your payment. If your payment is still pending, you can check again in a moment." },
  { question: "How do WhatsApp orders work?", answer: "We'll save your order before opening WhatsApp with your order number and summary. Follow our team's payment instructions; continuing to WhatsApp does not mean the order is paid." },
]);

/** Returns international WhatsApp digits, correcting Nigerian trunk prefixes; invalid values return null. */
export function normalizeWhatsappNumber(value) {
  if (typeof value !== "string" || !/^\+?[\d\s()-]+$/.test(value.trim())) return null;
  let digits = value.replace(/\D/g, "");
  if (digits.startsWith("2340")) digits = `234${digits.slice(4)}`;
  else if (/^0[1-9]\d{9}$/.test(digits)) digits = `234${digits.slice(1)}`;
  if (digits.startsWith("234")) return /^234[1-9]\d{9}$/.test(digits) ? digits : null;
  return /^[1-9]\d{7,14}$/.test(digits) ? digits : null;
}

/**
 * Builds only valid, explicitly configured contact destinations for storefront consumers.
 * Invalid optional settings are omitted rather than rendered as broken or unsafe links.
 */
export function getContactContent(env = {}) {
  /** Returns a trimmed optional config string, or an empty string when missing. */
  const clean = (key) => typeof env[key] === "string" ? env[key].trim() : "";
  const phone = clean("VITE_CONTACT_PHONE");
  const whatsapp = normalizeWhatsappNumber(clean("VITE_CONTACT_WHATSAPP"));
  const email = clean("VITE_CONTACT_EMAIL");
  const instagram = clean("VITE_CONTACT_INSTAGRAM");
  const links = [];
  if (/^\+?[1-9][0-9 ()-]{6,20}$/.test(phone)) links.push({ kind: "phone", label: phone, ariaLabel: `Call Nuede on ${phone}`, href: `tel:${phone.replace(/[ ()-]/g, "")}` });
  if (whatsapp) links.push({ kind: "whatsapp", label: "WhatsApp", ariaLabel: "Chat with Nuede on WhatsApp", href: `https://wa.me/${whatsapp}`, external: true });
  if (/^[^\s@]+@[^\s@.]+(?:\.[^\s@.]+)+$/.test(email)) links.push({ kind: "email", label: email, ariaLabel: `Email Nuede at ${email}`, href: `mailto:${email}` });
  try {
    const url = new URL(instagram);
    if (url.protocol === "https:" && ["instagram.com", "www.instagram.com"].includes(url.hostname) && !url.username && !url.password && /^\/[a-zA-Z0-9._]+\/?$/.test(url.pathname)) {
      links.push({ kind: "instagram", label: "Instagram", ariaLabel: "Nuede on Instagram", href: url.href, external: true });
    }
  } catch { /* An unset or invalid optional destination is not rendered. */ }
  return { links, hours: clean("VITE_CONTACT_HOURS"), serviceArea: "Prepared meals delivered in Abuja. Available delivery areas and fees are shown at checkout." };
}
