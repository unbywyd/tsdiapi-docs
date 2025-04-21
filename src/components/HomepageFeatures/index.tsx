import type {ReactNode} from 'react';
import clsx from 'clsx';
import Heading from '@theme/Heading';
import styles from './styles.module.css';

type FeatureItem = {
  title: string;
  Svg: React.ComponentType<React.ComponentProps<'svg'>>;
  description: ReactNode;
};

const FeatureList: FeatureItem[] = [
  {
    title: 'Type-Safe by Design',
    Svg: require('@site/static/img/protection.svg').default,
    description: (
      <>
        Built with TypeScript from the ground up, TSDIAPI provides full type safety 
        for your API endpoints, dependency injection, and data validation.
      </>
    ),
  },
  {
    title: 'Modern & Fast',
    Svg: require('@site/static/img/performance.svg').default,
    description: (
      <>
        Powered by Fastify and modern TypeScript features, TSDIAPI delivers 
        exceptional performance while maintaining clean, maintainable code.
      </>
    ),
  },
  {
    title: 'Developer Experience',
    Svg: require('@site/static/img/code.svg').default,
    description: (
      <>
        Enjoy automatic Swagger documentation, built-in validation via TypeBox, 
        and a powerful CLI for rapid development and code generation.
      </>
    ),
  },
];

function Feature({title, Svg, description}: FeatureItem) {
  return (
    <div className={clsx('col col--4')}>
      <div className="text--center">
        <Svg className={styles.featureSvg} role="img" />
      </div>
      <div className="text--center padding-horiz--md">
        <Heading as="h3">{title}</Heading>
        <p>{description}</p>
      </div>
    </div>
  );
}

export default function HomepageFeatures(): ReactNode {
  return (
    <section className={styles.features}>
      <div className="container">
        <div className="row">
          {FeatureList.map((props, idx) => (
            <Feature key={idx} {...props} />
          ))}
        </div>
      </div>
    </section>
  );
}
