import {themes as prismThemes} from 'prism-react-renderer';
import type {Config} from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

// This runs in Node.js - Don't use client-side code here (browser APIs, JSX...)

const config: Config = {
  title: 'TSDIAPI Documentation',
  tagline: 'TypeScript API Framework',
  favicon: 'img/logo.png',

  // Set the production url of your site here
  url: 'https://tsdiapi.com',
  // Set the /<baseUrl>/ pathname under which your site is served
  // For GitHub pages deployment, it is often '/<projectName>/'
  baseUrl: '/',

  // GitHub pages deployment config.
  // If you aren't using GitHub pages, you don't need these.
  organizationName: 'tsdiapi', // Usually your GitHub org/user name.
  projectName: 'tsdiapi-documentation', // Usually your repo name.

  onBrokenLinks: 'throw',
  onBrokenMarkdownLinks: 'warn',

  // Even if you don't use internationalization, you can use this field to set
  // useful metadata like html lang. For example, if your site is Chinese, you
  // may want to replace "en" with "zh-Hans".
  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  presets: [
    [
      'classic',
      {
        docs: {
          sidebarPath: './sidebars.ts',
          routeBasePath: '/',
        },
        blog: false,
        theme: {
          customCss: './src/css/custom.css',
        },
      },
    ],
  ],

  themeConfig: {
    colorMode: {
      defaultMode: 'dark',
      disableSwitch: true,
      respectPrefersColorScheme: false,
    },
    // Add redirect configuration
    redirects: [
      {
        from: '/server',
        to: '/core/server',
      },
    ],
    // Replace with your project's social card
    image: 'img/tsdiapi-social-card.jpg',
    navbar: {
      title: 'TSDIAPI',
      logo: {
        alt: 'TSDIAPI Logo',
        src: 'img/logo.png',
      },
      items: [
        {
          type: 'docSidebar',
          sidebarId: 'docs',
          position: 'left',
          label: 'Docs',
        },
        {
          to: 'https://webto.pro/assistant',
          label: 'WebTo.Pro',
          position: 'left'
        },
        {
          href: 'https://github.com/tsdiapi/tsdiapi',
          label: 'GitHub',
          position: 'right',
        },
      ],
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: 'Docs',
          items: [
            {
              label: 'Getting Started',
              to: '/getting-started/installation',
            },
            {
              label: 'CLI Reference',
              to: '/cli/commands',
            },
            {
              label: 'Server Guide',
              to: '/core/server',
            },
          ],
        },
        {
          title: 'Community',
          items: [
            {
              label: 'GitHub',
              href: 'https://github.com/tsdiapi/tsdiapi',
            },
            {
              label: 'GitHub Server',
              href: 'https://github.com/unbywyd/tsdiapi-server',
            },
            {
              label: 'NPM CLI',
              href: 'https://www.npmjs.com/package/@tsdiapi/cli',
            },
            {
              label: 'NPM Server',
              href: 'https://www.npmjs.com/package/@tsdiapi/server',
            },
          ],
        },
        {
          title: 'Author',
          items: [
            {
              label: 'Personal Website',
              href: 'https://unbywyd.com',
            },
            {
              label: 'WebTo.Pro',
              href: 'https://webto.pro/assistant',
            },
            {
              label: 'GitHub',
              href: 'https://github.com/unbywyd',
            },
          ],
        },
      ],
      copyright: `Copyright © ${new Date().getFullYear()} TSDIAPI. Powered by <a href="https://webto.pro" target="_blank" rel="noopener noreferrer">WebTo.Pro</a>`,
    },
    prism: {
      theme: prismThemes.vsDark,
      darkTheme: prismThemes.vsDark,
      additionalLanguages: ['bash', 'diff', 'json', 'yaml'],
    },
    // Добавляем анонс
    announcementBar: {
      id: 'support_us',
      content:
        '⭐️ If you like TSDIAPI, give it a star on <a target="_blank" rel="noopener noreferrer" href="https://github.com/unbywyd/tsdiapi-cli" style="color: #000000; font-weight: bold;">GitHub</a>! ⭐️',
      backgroundColor: '#8257e6',
      textColor: '#000000',
      isCloseable: true,
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
