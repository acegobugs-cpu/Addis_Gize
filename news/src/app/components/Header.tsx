'use client';

import { useState, useEffect, useRef } from 'react';
import { Menu, X } from 'lucide-react';
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  CheckIcon,
  ChevronUpDownIcon,
} from '@heroicons/react/24/solid';
import { Listbox } from '@headlessui/react';
import { MainSearchBar, HeaderSearchBar } from './SearchBar';

import { useTranslation } from 'react-i18next';
import { usePathname, useRouter } from 'next/navigation';
import { useLocale } from './TranslationProvider';

// 1. Define Supported Languages and Component Interfaces
type SupportedLanguage = 'om' | 'am' | 'en';
const NAME = "TIKVAH ETHIOPIA";

export interface Section {
  id: string | number;
  name: string;
  slug: string;
}

export interface HeaderProps {
  sections: Section[];
}

function LanguageSwitcher() {
  const { i18n } = useTranslation();
  const currentLocale = useLocale() as SupportedLanguage;
  const router = useRouter();
  const pathname = usePathname();
  const [pendingLng, setPendingLng] = useState<SupportedLanguage | null>(null);

  const languages: SupportedLanguage[] = ['om', 'am', 'en'];

  const handleChange = (lng: SupportedLanguage) => {
    if (lng === currentLocale) return;

    const segments = pathname.split('/');
    segments[1] = lng;
    const newPath = segments.join('/');

    setPendingLng(lng);
    router.push(newPath);
  };

  useEffect(() => {
    if (pendingLng && pathname.startsWith(`/${pendingLng}`)) {
      i18n.changeLanguage(pendingLng);
      setPendingLng(null);
    }
  }, [pathname, pendingLng, i18n]);

  if (!currentLocale) return null;

  return (
    <div className="relative w-28 md:w-36 z-50">
      <Listbox value={currentLocale} onChange={handleChange}>
        <div className="relative">
          <Listbox.Button className="relative w-full cursor-pointer rounded-lg bg-canvas py-2 pl-3 pr-10 text-left border border-border shadow-sm text-sm focus:outline-none focus:ring-2 focus:ring-east focus:border-transparent transition duration-200 text-ink">
            <span className="block truncate font-medium">{currentLocale.toUpperCase()}</span>
            <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
              <ChevronUpDownIcon className="h-4 w-4 text-muted" aria-hidden="true" />
            </span>
          </Listbox.Button>

          <Listbox.Options className="absolute mt-1 w-full max-h-60 overflow-auto rounded-md bg-canvas py-1 text-sm shadow-lg border border-border focus:outline-none">
            {languages.map((lng) => (
              <Listbox.Option
                key={lng}
                value={lng}
                className={({ active }) =>
                  `relative cursor-pointer select-none py-2 pl-10 pr-4 ${
                    active ? 'bg-east-light text-east-dark font-medium' : 'text-ink'
                  }`
                }
              >
                {({ selected }) => (
                  <>
                    <span className={`block truncate ${selected ? 'font-semibold text-east' : 'font-normal'}`}>
                      {lng.toUpperCase()}
                    </span>
                    {selected && (
                      <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-east">
                        <CheckIcon className="h-4 w-4" aria-hidden="true" />
                      </span>
                    )}
                  </>
                )}
              </Listbox.Option>
            ))}
          </Listbox.Options>
        </div>
      </Listbox>
    </div>
  );
}

export default function Header({ sections }: HeaderProps) {
  const lan = useLocale();
  const [searchValue, setSearchValue] = useState<string>('');
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [isScrolledDown, setIsScrolledDown] = useState<boolean>(false);
  const [lastScrollY, setLastScrollY] = useState<number>(200);

  // 2. Typed Refs for HTML Elements
  const sidePanelRef = useRef<HTMLDivElement | null>(null);
  const navRef = useRef<HTMLElement | null>(null);
  const scrollRef = useRef<HTMLElement | null>(null);

  const scroll = (dir: 'left' | 'right') => {
    const amount = 150;
    navRef.current?.scrollBy({
      left: dir === 'left' ? -amount : amount,
      behavior: 'smooth',
    });
    scrollRef.current?.scrollBy({
      left: dir === 'left' ? -amount : amount,
      behavior: 'smooth',
    });
  };

  const onSearch = (value: string) => {
    setSearchValue(value);
  };

  // Close side panel when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        isOpen &&
        sidePanelRef.current &&
        !sidePanelRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // Scroll handling for sticky nav
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY > lastScrollY && currentScrollY > 400) {
        setIsScrolledDown(true);
      } else if (currentScrollY < 400) {
        setIsScrolledDown(false);
      } else if (currentScrollY < lastScrollY && searchValue.trim() === '') {
        setIsScrolledDown(false);
      }
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY, searchValue]);

  return (
    <>
      <header className="w-full border-b-2 border-east bg-canvas text-ink">
        <div className="max-w-7xl mx-auto p-4">
          <div className="relative flex justify-between items-center">
            <h1 className="md:text-3xl text-xl font-serif font-bold tracking-widest text-east hover:text-east-hover transition-colors">
              <a href={`/${lan}`}>{NAME}</a>
            </h1>
            <div className="hidden md:block">
              <LanguageSwitcher />
            </div>
            <button className="md:hidden text-ink p-1 rounded hover:bg-surface" onClick={() => setIsOpen(!isOpen)}>
              {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>

          {/* Desktop nav */}
          <div className="relative mt-4 hidden md:flex mx-auto max-w-lg">
            {/* Left button */}
            <button
              onClick={() => scroll('left')}
              className="absolute left-0 top-1/2 -translate-y-1/2 bg-surface text-ink hover:text-east px-2 py-1 rounded-md z-10 border border-border shadow-sm transition-colors"
            >
              <ChevronLeftIcon className="h-5 w-5" />
            </button>

            {/* Scrollable nav */}
            <nav
              ref={navRef}
              className="flex overflow-x-auto no-scrollbar scroll-smooth snap-x snap-mandatory 
                        space-x-4 text-sm uppercase font-semibold text-muted mx-10"
            >
              {sections.map((item) => (
                <a
                  key={item.id}
                  href={`/${lan}/section/${item.slug}`}
                  className="snap-start shrink-0 hover:text-east transition-colors whitespace-nowrap py-1"
                >
                  {item.name}
                </a>
              ))}
            </nav>

            {/* Right button */}
            <button
              onClick={() => scroll('right')}
              className="absolute right-0 top-1/2 -translate-y-1/2 bg-surface text-ink hover:text-east px-2 py-1 rounded-md z-10 border border-border shadow-sm transition-colors"
            >
              <ChevronRightIcon className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Mobile nav */}
        <nav
          ref={sidePanelRef}
          className={`md:hidden fixed top-0 right-0 h-screen w-64 bg-surface border-l border-border shadow-2xl z-50 transform transition-transform duration-300 flex flex-col ${
            isOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
        >
          <div className="flex items-center justify-between p-4 border-b border-border">
            <LanguageSwitcher />
            <button
              className="text-ink p-1 rounded hover:bg-canvas transition-colors"
              onClick={() => setIsOpen(false)}
            >
              <X size={24} />
            </button>
          </div>
          <div className="flex flex-col space-y-4 p-6 text-sm uppercase font-semibold text-ink overflow-y-auto">
            {sections.map((item) => (
              <a
                key={item.id}
                href={`/${lan}/section/${item.slug}`}
                className="hover:text-east transition-colors whitespace-nowrap py-1 border-b border-border/50"
                onClick={() => setIsOpen(false)}
              >
                {item.name}
              </a>
            ))}
          </div>
        </nav>

        {/* Scrolled fixed nav */}
        <nav
          className={`hidden md:grid grid-cols-[auto_1fr_auto] w-full fixed top-0 left-0 z-50 bg-surface/90 backdrop-blur-md border-b-2 border-east px-20 py-2 items-center gap-6 transition-all duration-200 shadow-md ${
            isScrolledDown ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2 pointer-events-none'
          }`}
        >
          <h1 className="text-xl font-serif font-bold tracking-widest text-east">
            <a href={`/${lan}`}>{NAME}</a>
          </h1>
          <div className="relative flex mx-auto max-w-lg w-full">
            {/* Left button */}
            <button
              onClick={() => scroll('left')}
              className="absolute left-0 top-1/2 -translate-y-1/2 bg-canvas text-ink hover:text-east px-2 py-1 rounded-md z-10 border border-border shadow-sm transition-colors"
            >
              <ChevronLeftIcon className="h-5 w-5" />
            </button>

            {/* Scrollable nav */}
            <nav
              ref={scrollRef}
              className="flex overflow-x-auto no-scrollbar scroll-smooth snap-x snap-mandatory 
                        space-x-4 text-sm uppercase font-semibold text-muted mx-10"
            >
              {sections.map((item) => (
                <a
                  key={item.id}
                  href={`/${lan}/section/${item.slug}`}
                  className="snap-start shrink-0 hover:text-east transition-colors whitespace-nowrap py-1"
                >
                  {item.name}
                </a>
              ))}
            </nav>

            {/* Right button */}
            <button
              onClick={() => scroll('right')}
              className="absolute right-0 top-1/2 -translate-y-1/2 bg-canvas text-ink hover:text-east px-2 py-1 rounded-md z-10 border border-border shadow-sm transition-colors"
            >
              <ChevronRightIcon className="h-5 w-5" />
            </button>
          </div>
          <HeaderSearchBar searchValue={searchValue} handleSearch={onSearch} />
        </nav>
      </header>
      <MainSearchBar searchValue={searchValue} handleSearch={onSearch} />
    </>
  );
}