'use client';

import {
  FaFacebook,
  FaTwitter,
  FaInstagram,
  FaYoutube,
  FaTelegram,
  FaEnvelope,
} from 'react-icons/fa';
import { useTranslation } from 'react-i18next';
import Link from 'next/link';

export default function Footer() {
  const { t } = useTranslation();

  return (
    <footer className="border-t border-border mt-16 bg-surface text-ink">
      {/* Top Banner Accent Line incorporating both East and West brand colors */}
      <div className="h-1 w-full bg-gradient-to-r from-east via-west to-east" />

      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 mb-12">
          
          {/* Col 1: Brand & About */}
          <div className="lg:col-span-2 space-y-4">
            <h2 className="text-2xl font-serif font-bold tracking-widest text-east">
              TIKVAH
            </h2>
            <p className="text-muted text-sm leading-relaxed max-w-sm">
              {t('footer_description')}
            </p>
            {/* Social Links featuring West Green branding */}
            <div className="flex items-center space-x-3 pt-2">
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Facebook"
                className="p-2 rounded-full bg-canvas text-west border border-border hover:bg-west hover:text-canvas transition-colors shadow-sm"
              >
                <FaFacebook size={18} />
              </a>
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Twitter"
                className="p-2 rounded-full bg-canvas text-west border border-border hover:bg-west hover:text-canvas transition-colors shadow-sm"
              >
                <FaTwitter size={18} />
              </a>
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
                className="p-2 rounded-full bg-canvas text-west border border-border hover:bg-west hover:text-canvas transition-colors shadow-sm"
              >
                <FaInstagram size={18} />
              </a>
              <a
                href="https://telegram.org"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Telegram"
                className="p-2 rounded-full bg-canvas text-west border border-border hover:bg-west hover:text-canvas transition-colors shadow-sm"
              >
                <FaTelegram size={18} />
              </a>
              <a
                href="https://youtube.com"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="YouTube"
                className="p-2 rounded-full bg-canvas text-west border border-border hover:bg-west hover:text-canvas transition-colors shadow-sm"
              >
                <FaYoutube size={18} />
              </a>
            </div>
          </div>

          {/* Col 2: Categories */}
          <div>
            <h3 className="text-sm font-semibold text-ink uppercase tracking-wider mb-4 border-l-2 border-west pl-2">
              {t('news_desk')}
            </h3>
            <ul className="space-y-2.5 text-sm text-muted">
              <li>
                <Link href="/section/politics" className="hover:text-west transition-colors">
                  {t('politics')}
                </Link>
              </li>
              <li>
                <Link href="/section/business" className="hover:text-west transition-colors">
                  {t('business_markets')}
                </Link>
              </li>
              <li>
                <Link href="/section/tech" className="hover:text-west transition-colors">
                  {t('technology')}
                </Link>
              </li>
              <li>
                <Link href="/section/science" className="hover:text-west transition-colors">
                  {t('science_climate')}
                </Link>
              </li>
              <li>
                <Link href="/section/culture" className="hover:text-west transition-colors">
                  {t('arts_culture')}
                </Link>
              </li>
              <li>
                <Link href="/section/sports" className="hover:text-west transition-colors">
                  {t('sports')}
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 3: Company & Information */}
          <div>
            <h3 className="text-sm font-semibold text-ink uppercase tracking-wider mb-4 border-l-2 border-west pl-2">
              {t('company')}
            </h3>
            <ul className="space-y-2.5 text-sm text-muted">
              <li>
                <Link href="/about" className="hover:text-west transition-colors">
                  {t('about')}
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-west transition-colors">
                  {t('contact')}
                </Link>
              </li>
              <li>
                <Link href="/careers" className="hover:text-west transition-colors">
                  {t('careers')}{' '}
                  <span className="text-[10px] bg-west-light text-west font-bold px-1.5 py-0.5 rounded-full ml-1">
                    {t('we_are_hiring')}
                  </span>
                </Link>
              </li>
              <li>
                <Link href="/press" className="hover:text-west transition-colors">
                  {t('press_room')}
                </Link>
              </li>
              <li>
                <Link href="/ethics" className="hover:text-west transition-colors">
                  {t('editorial_standards')}
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 4: Newsletter Subscription */}
          <div>
            <h3 className="text-sm font-semibold text-ink uppercase tracking-wider mb-4 border-l-2 border-west pl-2">
              {t('stay_updated')}
            </h3>
            <p className="text-muted text-xs mb-3">
              {t('newsletter_tagline')}
            </p>
            <form onSubmit={(e) => e.preventDefault()} className="space-y-2">
              <div className="relative">
                <input
                  type="email"
                  placeholder={t('enter_email')}
                  className="w-full text-xs px-3 py-2 bg-canvas border border-border rounded-md text-ink placeholder-muted focus:outline-none focus:ring-1 focus:ring-west focus:border-west"
                  required
                />
              </div>
              <button
                type="submit"
                className="w-full py-2 px-3 bg-west hover:bg-west-hover text-canvas font-medium text-xs rounded-md transition-colors flex items-center justify-center gap-1.5"
              >
                <FaEnvelope size={12} />
                {t('subscribe_now')}
              </button>
            </form>
          </div>
        </div>

        {/* Bottom Bar: Copyright & Legal Links */}
        <div className="border-t border-border/60 pt-6 flex flex-col sm:flex-row justify-between items-center text-xs text-muted gap-4">
          <p>
            &copy; {new Date().getFullYear()} Tikvah Media Network. {t('allRightsReserved')}.
          </p>
          <div className="flex space-x-6">
            <Link href="/privacy" className="hover:text-west transition-colors">
              {t('privacy')}
            </Link>
            <Link href="/terms" className="hover:text-west transition-colors">
              {t('terms')}
            </Link>
            <Link href="/cookies" className="hover:text-west transition-colors">
              {t('cookie_policy')}
            </Link>
            <Link href="/sitemap" className="hover:text-west transition-colors">
              {t('sitemap')}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}