import { Html, Head, Main, NextScript } from 'next/document';
// import Link from 'next/link';

const Index = () => {
  return (
    <Html lang="ja">
      <Head>
        <link
          href={
            'https://fonts.googleapis.com/css2' +
            '?family=Noto+Sans+Jp:wght@400;500;700' +
            '&display=swap'
          }
          rel="stylesheet"
        />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
};

export default Index;
