import { dedupeStructuredData, type JsonLdSchema } from '@/lib/seo/structuredData';

type JsonLdProps = {
  data: JsonLdSchema | JsonLdSchema[];
};

function safeJson(data: JsonLdProps['data']) {
  return JSON.stringify(dedupeStructuredData(data))
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026');
}

export default function JsonLd({ data }: JsonLdProps) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: safeJson(data) }}
    />
  );
}
