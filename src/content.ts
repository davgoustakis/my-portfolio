// Everything the site says lives here. Edit this file to change the text.

export interface Link {
  label: string;
  href: string;
}

export interface Profile {
  first: string;
  last: string;
  handle: string;
  roles: string[];
  about: string;
  email: string;
  links: Link[];
}

export interface Project {
  name: string;
  kind: string;
  blurb: string;
  stack: string[];
}

export const profile: Profile = {
  first: 'Dimitris',
  last: 'Avgoustakis',
  handle: 'davgoustakis',
  roles: [
    'frontend developer',
    'react native developer',
    'typescript enthusiast',
    'animation nerd',
  ],
  about:
    'I build web and mobile products with React, React Native and TypeScript. From telecom e-shops and self-care apps to banking tools and my own side projects, I care about fast, accessible interfaces and the small details that make them feel alive.',
  email: 'davgoustakis.io@gmail.com',
  links: [
    { label: 'GitHub', href: 'https://github.com/davgoustakis' },
    { label: 'LinkedIn', href: 'https://www.linkedin.com/in/dimitris-avgoustakis' },
  ],
};

export const skills: string[] = [
  'React',
  'React Native',
  'TypeScript',
  'Redux Toolkit',
  'Next.js',
  'Node.js',
  'Expo',
  'Tailwind',
  'MUI',
  'Webpack',
  'Docker',
  'WordPress',
  'GSAP',
];

// Client work is described generically. Add client names or links only if you are allowed to.
export const projects: Project[] = [
  {
    name: 'FinTrack',
    kind: 'Personal · iOS app',
    blurb:
      'A private expense tracker for iPhone. Imports bank statements (Excel, CSV, PDF), analyses spending by month and year, and keeps everything on-device in an encrypted vault behind Face ID.',
    stack: ['React Native', 'Expo', 'AES-256-GCM'],
  },
  {
    name: 'Bank mobile & web app',
    kind: 'Client · Web · iOS & Android',
    blurb:
      'Self-care app for a bank operator: account management, store locator with clustered maps, documents, video and banking functionalities',
    stack: ['React Native', 'React', 'TypeScript', 'Reanimated', 'Maps'],
  },
  {
    name: 'Telecom mobile app',
    kind: 'Client · iOS & Android',
    blurb:
      'Self-care app for a telecom operator: account management, store locator with clustered maps, documents, video and rich animations.',
    stack: ['React Native', 'TypeScript', 'Reanimated', 'Maps'],
  },
  {
    name: 'Telecom e-shop',
    kind: 'Client · Web',
    blurb:
      'Multilingual storefront for devices and plans, with checkout flows, maps and PDF documents, shipped as containers through CI/CD.',
    stack: ['React', 'Redux Toolkit', 'MUI', 'i18next', 'Docker'],
  },
  {
    name: 'Admin panel',
    kind: 'Client · Web',
    blurb:
      'Back-office console for managing content, catalog and users: data grids, rich-text editing, forms and role-based access.',
    stack: ['React', 'TypeScript', 'MUI', 'Tailwind', 'Framer Motion'],
  },
  {
    name: 'Document scanner',
    kind: 'Client · Android & iOS',
    blurb:
      'Document scanning and upload app for a banking workflow, with camera capture, page reordering and offline-friendly state.',
    stack: ['React Native', 'React Query', 'Redux', 'Scanbot SDK'],
  },
  {
    name: 'Clothes e-shop',
    kind: 'Client · E-commerce',
    blurb:
      "Women's clothing shop for the Greek market on a tuned WooCommerce stack with a custom block theme and a fully Dockerised local setup.",
    stack: ['WordPress', 'WooCommerce', 'PHP 8.4', 'Redis', 'Nginx'],
  },
];
