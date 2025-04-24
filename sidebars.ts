import type { SidebarsConfig } from '@docusaurus/plugin-content-docs';

// This runs in Node.js - Don't use client-side code here (browser APIs, JSX...)

/**
 * Creating a sidebar enables you to:
 - create an ordered group of docs
 - render a sidebar for each doc of that group
 - provide next/previous navigation

 The sidebars can be generated from the filesystem, or explicitly defined here.

 Create as many sidebars as you want.
 */
const sidebars: SidebarsConfig = {
  docs: [
    {
      type: 'category',
      label: 'Getting Started',
      items: [
        'getting-started/introduction',
        'getting-started/installation',
        'getting-started/quick-start',
        'getting-started/project-structure'
      ]
    },
    {
      type: 'category',
      label: 'Core',
      items: [
        'core/server',	
        'core/routing',
        'core/modules',
        'core/services',
        'core/lifecycle-hooks',
        'core/swagger-integration'
      ]
    },
    {
      type: 'category',
      label: 'Guides',
      items: [
        'guides/authentication',
        'guides/database-integration',
        'guides/prismaql',
        'guides/files',
        'guides/error-handling',
        'guides/production-setup'
      ]
    },
    {
      type: 'category',
      label: 'Plugins',
      items: [
        'plugins/overview',
        'plugins/installation',
        'plugins/configuration',
        'plugins/development'
      ]
    },
    {
      type: 'category',
      label: 'CLI',
      items: [
        'cli/commands',
        'cli/code-generation'
      ]
    },
    {
      type: 'category',
      label: 'Examples',
      items: [
        'examples/code',
        'examples/prisma'
      ]
    }
  ]
};

export default sidebars;
