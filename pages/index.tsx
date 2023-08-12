import { Client } from '@notionhq/client';
import { GetStaticProps } from 'next';
import { NextPage } from 'next';
import styles from '../styles/Home.module.css';
import dayjs from 'dayjs';
import prism from 'prismjs';
import { useEffect } from 'react';

const notion = new Client({
  auth: process.env.NOTION_TOKEN,
});

export type Content =
  | {
      type: 'paragraph' | 'quote' | 'heading2' | 'heading3';
      text: string | null;
    }
  | {
      type: 'code';
      text: string | null;
      language: string | null;
    };

export type Post = {
  id: string;
  title: string | null;
  slug: string | null;
  createTs: string | null;
  lastEditedTs: string | null;
  contents: Content[];
};

type StaticProps = {
  post: Post | null;
};

export const getStaticProps: GetStaticProps<StaticProps> = async () => {
  const database = await notion.databases.query({
    database_id: process.env.NOTION_DATABASE_ID || '',
    filter: {
      and: [
        {
          property: 'Published',
          checkbox: {
            equals: true,
          },
        },
      ],
    },
    sorts: [
      {
        timestamp: 'created_time',
        direction: 'descending',
      },
    ],
  });

  //
  // console.dir(database, { depth: null });

  const page = database.results[2];
  if (!page) {
    return {
      props: {
        post: null,
      },
    };
  }
  if (!('properties' in page)) {
    return {
      props: {
        post: {
          id: page.id,
          title: null,
          slug: null,
          createTs: null,
          lastEditedTs: null,
          contents: [],
        },
      },
    };
  }

  let title: string | null = null;
  //console.log(`page: ${page}`);
  if (page?.properties?.['Name']?.type === 'title') {
    title = page.properties['Name'].title[0]?.plain_text ?? null;
  }
  let slug: string | null = null;
  if (page.properties['Slug'].type === 'rich_text') {
    slug = page.properties['Slug'].rich_text[0]?.plain_text ?? null;
  }

  // console.dir(database, { depth: null });

  const blocks = await notion.blocks.children.list({
    block_id: page.id,
  });
  const contents: Content[] = [];
  blocks.results.forEach((block) => {
    if (!('type' in block)) {
      return;
    }
    switch (block.type) {
      case 'paragraph':
        contents.push({
          type: 'paragraph',
          text: block.paragraph.rich_text[0]?.plain_text ?? null,
        });
        break;
      case 'heading_2':
        contents.push({
          type: 'heading2',
          text: block.heading_2.rich_text[0]?.plain_text ?? null,
        });
        break;
      case 'heading_3':
        contents.push({
          type: 'heading3',
          text: block.heading_3.rich_text[0]?.plain_text ?? null,
        });
        break;
      case 'quote':
        contents.push({
          type: 'quote',
          text: block.quote.rich_text[0]?.plain_text ?? null,
        });
        break;
      case 'code':
        contents.push({
          type: 'code',
          text: block.code.rich_text[0]?.plain_text ?? null,
          language: block.code.language,
        });
    }
  });

  const post: Post = {
    id: page.id,
    title,
    slug,
    createTs: page.created_time,
    lastEditedTs: page.last_edited_time,
    contents,
  };

  console.dir(post, { depth: null });

  return {
    props: { post },
  };
};

const Home: NextPage<StaticProps> = ({ post }) => {
  useEffect(() => {
    prism.highlightAll();
  }, []);

  if (!post) return null;
  // console.log(post);
  return (
    <div className={styles.wrapper}>
      <div className={styles.post}>
        <h1 className={styles.title}>{post.title}</h1>
        <div className={styles.timestampWrapper}>
          <div>
            <div className={styles.timestamp}>
              作成日時：{''}
              {dayjs(post.createTs).format('YYYY/MM/DD HH:mm:ss')}
            </div>
            <div className={styles.timestamp}>
              更新日時：{''}
              {dayjs(post.lastEditedTs).format('YYYY/MM/DD HH:mm:ss')}
            </div>
          </div>
        </div>
        <div>
          {post.contents.map((content, index) => {
            const key = `${post.id}_${index}}`;
            switch (content.type) {
              case 'paragraph':
                return (
                  <p key={key} className={styles.paragraph}>
                    {content.text}
                  </p>
                );
              case 'heading2':
                return (
                  <h2 key={key} className={styles.heading2}>
                    {content.text}
                  </h2>
                );
              case 'heading3':
                return (
                  <h3 key={key} className={styles.heading3}>
                    {content.text}
                  </h3>
                );
              case 'quote':
                return (
                  <blockquote key={key} className={styles.quote}>
                    {content.text}
                  </blockquote>
                );
              case 'code':
                return (
                  <pre
                    key={key}
                    className={`${styles.code} lang-${content.language} `}
                  >
                    <code>{content.text}</code>
                  </pre>
                );
            }
          })}
        </div>
      </div>
    </div>
  );
};

export default Home;
