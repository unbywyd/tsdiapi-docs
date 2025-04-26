import type {ReactNode} from 'react';
import clsx from 'clsx';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import HomepageFeatures from '@site/src/components/HomepageFeatures';
import Heading from '@theme/Heading';
import CodeBlock from '@theme/CodeBlock';
import NpmIcon from '@site/static/img/npm.svg';

import styles from './index.module.css';

const quickStartCode = `
npm i -g @tsdiapi/cli
tsdiapi create myapi
cd myapi
npm run dev
`;

const prismaAddStartCode = `tsdiapi add prisma
npx prisma migrate dev
npm run prisma:generate
`;

const addPluginStartCode = `tsdiapi plugins add jwt-auth`;
const generatePluginCode = `
cd src/api
tsdiapi generate jwt-auth auth
npm run dev
`;

const typeScriptCode = `export default function userController({ useRoute }: AppContext) {
  useRoute()
    .get("/users/:id")
    .params(Type.Object({ id: Type.String() }))
    .code(200, Type.Object({ 
      id: Type.String(), 
      name: Type.String() 
    }))
    .handler(async (req) => {
      return {
        status: 200,
        data: { 
          id: req.params.id, 
          name: "John Doe" 
        }
      };
    })
    .build();
}`;

function HomepageHeader() {
  const {siteConfig} = useDocusaurusContext();
  return (
    <header className={clsx('hero hero--primary', styles.heroBanner)}>
      <div className="container">
        <Heading as="h1" className="hero__title">
          {siteConfig.title}
        </Heading>
        <p className="hero__subtitle">{siteConfig.tagline}</p>
        <div className={styles.buttons + " buttons"}>
          <Link
            className="button button--primary button--lg"
            to="/getting-started/introduction">
            Get Started 🚀
          </Link>
          <Link
            className="button button--secondary button--lg"
            to="https://github.com/unbywyd/tsdiapi-cli">
            View on GitHub
          </Link>
          <Link
            className="button button--secondary button--lg"
            to="https://www.npmjs.com/package/@tsdiapi/cli">
            <NpmIcon className={styles.npmIcon} />
            NPM
          </Link>
        </div>
      </div>
    </header>
  );
}

export default function Home(): ReactNode {
  const {siteConfig} = useDocusaurusContext();
  return (
    <Layout
      title={siteConfig.title}
      description="Modern TypeScript DI & API Framework with full type safety">
      <HomepageHeader />
      <main>
        <HomepageFeatures />
        <section className={styles.codeExample}>
          <div className="container">
            <div className="row">
              <div className="col col--4">
                <Heading as="h2">Quick Start</Heading>
                <p>Create a new TSDIAPI project in seconds:</p>
                <CodeBlock language="bash" showLineNumbers>
                  {quickStartCode}
                </CodeBlock>
                <p>Add Prisma to your project:</p>
                <CodeBlock language="bash" showLineNumbers>
                  {prismaAddStartCode}
                </CodeBlock>
                <p>Add Plugin to your project:</p>
                <CodeBlock language="bash" showLineNumbers>
                  {addPluginStartCode}
                </CodeBlock>
                <p>Using the plugin generator:</p>
                <CodeBlock language="bash" showLineNumbers>
                  {generatePluginCode}
                </CodeBlock>
              </div>
              <div className="col col--8">
                <Heading as="h2">Type-Safe Routes</Heading>
                <p>Write fully type-safe API endpoints:</p>
                <CodeBlock language="typescript" showLineNumbers>
                  {typeScriptCode}
                </CodeBlock>
              </div>
            </div>
          </div>
        </section>
      </main>
    </Layout>
  );
}
