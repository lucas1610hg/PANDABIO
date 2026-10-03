import { afterEach, describe, expect, it, vi } from 'vitest';
import { importProductFromUrl } from '../../utils/productImporter';

const pageUrl = 'https://loja.example/produtos/caneca';

function mockPageFetch(html: string, metadata = '{}') {
  vi.stubGlobal(
    'fetch',
    vi.fn((input: string | URL) => {
      const url = String(input);
      const body = url.includes('microlink.io') ? metadata : html;
      return Promise.resolve({
        ok: true,
        text: async () => body,
      });
    }),
  );
}

describe('importProductFromUrl', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('extracts product data from JSON-LD and resolves relative image URLs', async () => {
    mockPageFetch(`
      <html>
        <head>
          <script type="application/ld+json">
            ${JSON.stringify({
              '@context': 'https://schema.org',
              '@graph': [
                { '@type': 'BreadcrumbList', itemListElement: [] },
                {
                  '@type': 'Product',
                  name: 'Caneca Panda',
                  description: 'Caneca de cerâmica.',
                  image: ['/images/caneca.jpg', '/images/caneca-2.jpg'],
                  offers: { price: 'R$ 1.234,56' },
                },
              ],
            })}
          </script>
        </head>
      </html>
    `);

    await expect(importProductFromUrl(pageUrl)).resolves.toMatchObject({
      name: 'Caneca Panda',
      price: 1234.56,
      description: 'Caneca de cerâmica.',
      image: 'https://loja.example/images/caneca.jpg',
      sourceUrl: pageUrl,
    });
  });

  it('falls back to Open Graph and product markup when JSON-LD is unavailable', async () => {
    mockPageFetch(`
      <html>
        <head>
          <meta property="og:title" content="Curso de Marketing" />
          <meta property="og:description" content="Aprenda a vender mais." />
          <meta property="og:image" content="/images/curso.png" />
          <meta property="product:price:amount" content="79.90" />
        </head>
        <body>
          <h1>Outro título visível</h1>
          <span itemprop="price">R$ 49,90</span>
        </body>
      </html>
    `);

    await expect(importProductFromUrl(pageUrl)).resolves.toMatchObject({
      name: 'Curso de Marketing',
      price: 79.9,
      description: 'Aprenda a vender mais.',
      image: 'https://loja.example/images/curso.png',
    });
  });
  it('uses rendered Microlink fields when the page HTML does not expose product data', async () => {
    mockPageFetch(
      '<html></html>',
      JSON.stringify({
        data: {
          productTitleText: 'Mentoria de Vendas',
          productDescriptionText: 'Método prático para vender mais.',
          productImageMeta: { url: 'https://cdn.example/mentoria.jpg' },
          productPriceText: 'R$ 129,90',
        },
      }),
    );

    await expect(importProductFromUrl(pageUrl)).resolves.toMatchObject({
      name: 'Mentoria de Vendas',
      price: 129.9,
      description: 'Método prático para vender mais.',
      image: 'https://cdn.example/mentoria.jpg',
    });
  });
  it('extracts visible product price when structured price metadata is absent', async () => {
    mockPageFetch(`
      <html>
        <body>
          <main>
            <h1>Kit Organizador</h1>
            <img src="/images/kit.jpg" />
            <p>Organizador multiuso para sua casa.</p>
            <strong>R$ 89,90</strong>
          </main>
        </body>
      </html>
    `);

    await expect(importProductFromUrl(pageUrl)).resolves.toMatchObject({
      name: 'Kit Organizador',
      price: 89.9,
      image: 'https://loja.example/images/kit.jpg',
    });
  });
});
