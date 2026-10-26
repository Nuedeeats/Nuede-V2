import nuedeLogo from "@nuede/config/nuede-logo.svg";
import { Mail } from "lucide-react";
import { Link } from "react-router-dom";
import { storefrontPaths } from "../../app/routePaths.js";
import { getContactContent } from "../../features/content/config/storefrontContent.js";
import { InstagramIcon, WhatsAppIcon } from "../ui/ContactBrandIcons.jsx";
import { Container } from "./Container.jsx";

const contact = getContactContent(import.meta.env);
const contactIcons = { whatsapp: WhatsAppIcon, email: Mail, instagram: InstagramIcon };
const iconLinks = contact.links.filter((link) => contactIcons[link.kind]);

/** Renders service information and contact icons; missing/invalid destinations and empty rows are omitted. */
export function StorefrontFooter() {
  return <footer id="contact" className="scroll-mt-24 border-t border-line bg-surface py-12 sm:py-16">
    <Container className="grid gap-10 md:grid-cols-[1.2fr_1fr_1fr]">
      <div className="max-w-sm"><Link to="/" aria-label="Nuede home" className="inline-flex items-center gap-2 text-brand-950"><img src={nuedeLogo} alt="Nuede" width="374" height="112" className="h-auto w-32 shrink-0" /></Link><p className="mt-4 text-sm leading-7 text-muted">Prepared meals, clear nutrition and thoughtful choices for your everyday.</p><p className="mt-3 text-sm leading-7 text-muted">{contact.serviceArea}</p></div>
      <nav aria-label="Footer navigation"><h2 className="text-xs font-bold uppercase tracking-[0.18em] text-brand-700">Explore</h2><div className="mt-4 grid gap-3 text-sm font-semibold text-brand-950"><Link to={storefrontPaths.menu}>Menu</Link><Link to={storefrontPaths.mealPlans}>Meal Plans</Link><Link to={storefrontPaths.highProtein}>High-Protein Meals</Link><Link to={storefrontPaths.deliveryAbuja}>Abuja Delivery</Link><Link to={storefrontPaths.about}>About Nuede</Link><Link to={storefrontPaths.faq}>FAQ</Link></div></nav>
      <div>
        <h2 className="text-xs font-bold uppercase tracking-[0.18em] text-brand-700">Get in touch</h2>
        {iconLinks.length ? <ul aria-label="Contact links" className="mt-4 flex gap-3">
          {iconLinks.map((link) => {
            const Icon = contactIcons[link.kind];
            return <li key={link.kind}><a
              className="inline-flex size-11 items-center justify-center rounded-control border border-line text-brand-950 hover:bg-brand-100 hover:text-brand-700 focus-visible:bg-brand-100 focus-visible:text-brand-700 focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-brand-700"
              href={link.href}
              aria-label={link.ariaLabel}
              title={link.ariaLabel}
              target={link.external ? "_blank" : undefined}
              rel={link.external ? "noopener noreferrer" : undefined}
            ><Icon className="size-5" aria-hidden="true" /></a></li>;
          })}
        </ul> : null}
        {contact.hours ? <p className="mt-4 text-sm leading-7 text-muted">Business hours: {contact.hours}</p> : null}
      </div>
    </Container><Container className="mt-10 border-t border-line pt-6 text-xs text-muted">© {new Date().getFullYear()} Nuede · Abuja</Container>
  </footer>;
}
