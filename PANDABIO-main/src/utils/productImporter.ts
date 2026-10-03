export interface ImportedProductData {
  name: string;
  price: number | null;
  description: string;
  image: string;
  sourceUrl: string;
}

type ProductData = Partial<ImportedProductData>;
type JsonRecord = Record<string, unknown>;

const REQUEST_TIMEOUT = 12000;

function normalizeUrl(rawUrl: string): string {
  const value = rawUrl.trim();
  return new URL(value.match(/^https?:\/\//i) ? value : `https://${value}`).toString();
}

function resolveUrl(value: string | null | undefined, baseUrl: string): string {
  if (!value) return '';
  try {
    const resolved = new URL(value.trim(), baseUrl).toString();
    return /^https?:\/\//i.test(resolved) ? resolved : '';
  } catch {
    return '';
  }
}

function cleanText(value: unknown): string {
  return typeof value === 'string' ? value.replace(/\s+/g, ' ').trim() : '';
}

function isBlockedPageText(value: string): boolean {
  return /just a moment|checking your browser|access denied|enable javascript|verify you are human|captcha/i.test(
    value,
  );
}

function firstUsableText(...values: unknown[]): string {
  for (const value of values) {
    const text = cleanText(value);
    if (text && !isBlockedPageText(text)) return text;
  }
  return '';
}

function parsePrice(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value) && value > 0) return value;

  if (value && typeof value === 'object') {
    const record = value as JsonRecord;
    for (const key of ['price', 'lowPrice', 'amount', 'value']) {
      const parsed = parsePrice(record[key]);
      if (parsed !== null) return parsed;
    }
    return null;
  }

  if (typeof value !== 'string') return null;
  const normalized = value
    .replace(/\u00a0/g, ' ')
    .replace(/[^\d,.-]/g, '')
    .trim();
  if (!normalized) return null;

  const commaIndex = normalized.lastIndexOf(',');
  const dotIndex = normalized.lastIndexOf('.');
  let numberText = normalized;

  if (commaIndex >= 0 && dotIndex >= 0) {
    const decimalSeparator = commaIndex > dotIndex ? ',' : '.';
    const thousandsSeparator = decimalSeparator === ',' ? /\./g : /,/g;
    numberText = normalized.replace(thousandsSeparator, '').replace(decimalSeparator, '.');
  } else if (commaIndex >= 0 || dotIndex >= 0) {
    const separator = commaIndex >= 0 ? ',' : '.';
    const separatorIndex = commaIndex >= 0 ? commaIndex : dotIndex;
    const digitsAfterSeparator = normalized.length - separatorIndex - 1;
    const isDecimal = digitsAfterSeparator > 0 && digitsAfterSeparator <= 2;
    numberText = isDecimal
      ? normalized.replace(separator, '.')
      : normalized.replace(new RegExp(`\\${separator}`, 'g'), '');
  }

  const parsed = Number(numberText);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function isProductType(value: unknown): boolean {
  const types = Array.isArray(value) ? value : [value];
  return types.some(
    (type) => typeof type === 'string' && type.toLowerCase().split('/').pop() === 'product',
  );
}

function findProduct(value: unknown, visited = new Set<object>()): JsonRecord | null {
  if (Array.isArray(value)) {
    for (const item of value) {
      const product = findProduct(item, visited);
      if (product) return product;
    }
    return null;
  }

  if (!value || typeof value !== 'object') return null;
  if (visited.has(value)) return null;
  visited.add(value);

  const record = value as JsonRecord;
  if (isProductType(record['@type'])) return record;

  for (const nestedValue of Object.values(record)) {
    const product = findProduct(nestedValue, visited);
    if (product) return product;
  }
  return null;
}

function firstImageValue(value: unknown): string {
  if (Array.isArray(value)) {
    for (const item of value) {
      const image = firstImageValue(item);
      if (image) return image;
    }
    return '';
  }

  if (typeof value === 'string') {
    const image = value.trim();
    return /logo|favicon|sprite|pixel|spacer|placeholder|captcha|cloudflare/i.test(image)
      ? ''
      : image;
  }
  if (!value || typeof value !== 'object') return '';

  const record = value as JsonRecord;
  for (const key of ['url', 'contentUrl', 'thumbnailUrl']) {
    const image = firstImageValue(record[key]);
    if (image) return image;
  }
  return '';
}

function extractStructuredPrice(value: unknown, visited = new Set<object>()): number | null {
  if (Array.isArray(value)) {
    for (const item of value) {
      const price = extractStructuredPrice(item, visited);
      if (price !== null) return price;
    }
    return null;
  }

  if (!value || typeof value !== 'object') return parsePrice(value);
  if (visited.has(value)) return null;
  visited.add(value);

  const record = value as JsonRecord;
  for (const key of ['price', 'lowPrice', 'amount', 'value']) {
    const price = parsePrice(record[key]);
    if (price !== null) return price;
  }

  for (const key of ['offers', 'priceSpecification', 'aggregateOffer']) {
    const price = extractStructuredPrice(record[key], visited);
    if (price !== null) return price;
  }
  return null;
}

function extractStructuredProduct(value: unknown): ProductData {
  const product = findProduct(value);
  if (!product) return {};

  return {
    name: cleanText(product.name),
    description: cleanText(product.description),
    image: firstImageValue(product.image ?? product.images),
    price: extractStructuredPrice(product),
  };
}

function extractProductJsonLd(doc: Document): ProductData {
  const scripts = Array.from(doc.querySelectorAll('script[type="application/ld+json"]'));
  for (const script of scripts) {
    try {
      const product = extractStructuredProduct(JSON.parse(script.textContent || ''));
      if (product.name || product.description || product.image || product.price !== null) {
        return product;
      }
    } catch {
      continue;
    }
  }
  return {};
}

function readElementValue(element: Element | null): string {
  if (!element) return '';

  for (const attribute of [
    'content',
    'value',
    'data-price',
    'data-product-price',
    'data-sale-price',
    'data-src',
    'data-lazy-src',
    'data-original',
    'src',
    'href',
    'srcset',
  ]) {
    const value = element.getAttribute(attribute)?.trim();
    if (value) return attribute === 'srcset' ? value.split(',')[0].trim().split(' ')[0] : value;
  }

  return cleanText(element.textContent);
}

function readFirstElementValue(doc: Document, selectors: string[]): string {
  for (const selector of selectors) {
    const element = doc.querySelector(selector);
    const value = readElementValue(element);
    if (value) return value;
  }
  return '';
}

function readMeta(doc: Document, selectors: string[]): string {
  return readFirstElementValue(doc, selectors);
}

function extractMetaData(doc: Document): ProductData {
  return {
    name: readMeta(doc, [
      'meta[property="og:title"]',
      'meta[name="twitter:title"]',
      'meta[name="title"]',
    ]),
    description: readMeta(doc, [
      'meta[property="og:description"]',
      'meta[name="twitter:description"]',
      'meta[name="description"]',
    ]),
    image: readMeta(doc, [
      'meta[property="og:image"]',
      'meta[property="og:image:url"]',
      'meta[name="twitter:image"]',
      'meta[name="twitter:image:src"]',
      'link[rel="image_src"]',
    ]),
    price: parsePrice(
      readMeta(doc, [
        'meta[property="product:price:amount"]',
        'meta[property="og:price:amount"]',
        'meta[name="price"]',
      ]),
    ),
  };
}

function extractDomData(doc: Document): ProductData {
  const image = readFirstElementValue(doc, [
    '[itemprop="image"]',
    '[class*="product" i] img',
    '[class*="produto" i] img',
    '[class*="gallery" i] img',
    '[class*="galeria" i] img',
    'main img',
    'img',
  ]);
  const priceText = readFirstElementValue(doc, [
    '[itemprop="price"]',
    '[data-price]',
    '[data-product-price]',
    '[data-sale-price]',
    '[class~="price" i]',
    '[class*="price" i]',
    '[class~="preco" i]',
    '[class*="preço" i]',
    '[class*="preco" i]',
    '[id*="price" i]',
    '[id*="preço" i]',
    '[id*="preco" i]',
  ]);
  const visibleText = cleanText(
    doc.querySelector('main, [role="main"], article, body')?.textContent,
  );
  const visiblePrice = visibleText.match(
    /(?:R\$|BRL|US\$|\$|€|£)\s*\d[\d\s.,]*|\b\d{1,3}(?:[.\s]\d{3})*,\d{2}\b/g,
  )?.[0];

  return {
    name: readFirstElementValue(doc, ['[itemprop="name"]', 'h1']),
    description: readFirstElementValue(doc, [
      '[itemprop="description"]',
      '[class*="description" i]',
      '[class*="descricao" i]',
      '[class*="descrição" i]',
      '[id*="description" i]',
      '[id*="descricao" i]',
      '[id*="descrição" i]',
    ]),
    image,
    price: parsePrice(priceText) ?? parsePrice(visiblePrice),
  };
}

function setMicrolinkRule(
  params: URLSearchParams,
  field: string,
  selector: string,
  attr: string,
  type?: string,
): void {
  params.set(`data.${field}.selector`, selector);
  params.set(`data.${field}.attr`, attr);
  if (type) params.set(`data.${field}.type`, type);
}

function buildMicrolinkUrl(url: string): string {
  const params = new URLSearchParams({
    url,
    meta: 'true',
    prerender: 'true',
    waitForTimeout: '1500',
  });

  setMicrolinkRule(params, 'structured', 'script[type="application/ld+json"]', 'text');
  params.set('data.structured.selectorAll', 'script[type="application/ld+json"]');
  params.set('data.structured.attr', 'text');
  setMicrolinkRule(params, 'productTitleMeta', 'meta[property="og:title"]', 'content');
  setMicrolinkRule(params, 'productTitleText', 'h1, [itemprop="name"]', 'text');
  setMicrolinkRule(
    params,
    'productDescriptionMeta',
    'meta[property="og:description"], meta[name="description"]',
    'content',
  );
  setMicrolinkRule(
    params,
    'productDescriptionText',
    '[itemprop="description"], [class*="description" i], [class*="descricao" i]',
    'text',
  );
  setMicrolinkRule(
    params,
    'productImageMeta',
    'meta[property="og:image"], meta[name="twitter:image"]',
    'content',
    'image',
  );
  setMicrolinkRule(
    params,
    'productImageDom',
    '[itemprop="image"], [class*="product" i] img, main img',
    'src',
    'image',
  );
  setMicrolinkRule(
    params,
    'productPriceContent',
    '[itemprop="price"][content], [data-price], meta[property="product:price:amount"]',
    'content',
    'number',
  );
  setMicrolinkRule(
    params,
    'productPriceText',
    '[itemprop="price"], [data-price], [data-product-price], [class*="price" i], [class*="preco" i]',
    'text',
  );

  return `https://api.microlink.io/?${params.toString()}`;
}

function parseMicrolinkStructuredData(value: unknown): ProductData {
  const values = Array.isArray(value) ? value : [value];
  for (const item of values) {
    if (typeof item === 'object' && item !== null) {
      const product = extractStructuredProduct(item);
      if (product.name || product.description || product.image || product.price !== null) {
        return product;
      }
      continue;
    }

    if (typeof item !== 'string') continue;
    try {
      const product = extractStructuredProduct(JSON.parse(item));
      if (product.name || product.description || product.image || product.price !== null) {
        return product;
      }
    } catch {
      continue;
    }
  }
  return {};
}

async function fetchText(url: string): Promise<string> {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT);
  try {
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) throw new Error('Não foi possível acessar o link.');
    return await response.text();
  } finally {
    window.clearTimeout(timeout);
  }
}

async function fetchPageHtml(url: string): Promise<string> {
  const proxies = [
    url,
    `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
    `https://corsproxy.io/?url=${encodeURIComponent(url)}`,
    `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(url)}`,
  ];
  const requests = proxies.map(async (candidate) => {
    const html = await fetchText(candidate);
    if (!/<(?:html|head|body|main|script|meta|img)\b/i.test(html)) {
      throw new Error('Resposta não contém HTML.');
    }
    return html;
  });

  try {
    return await Promise.any(requests);
  } catch {
    return '';
  }
}

async function fetchMicrolinkMetadata(url: string): Promise<ProductData> {
  try {
    const response = await fetchText(buildMicrolinkUrl(url));
    const payload = JSON.parse(response) as { data?: JsonRecord };
    const data = payload.data || {};
    const structured = parseMicrolinkStructuredData(data.structured);
    const image = firstImageValue(data.productImageMeta ?? data.productImageDom ?? data.image);

    return {
      name:
        structured.name ||
        cleanText(data.productTitleMeta) ||
        cleanText(data.productTitleText) ||
        cleanText(data.title),
      description:
        structured.description ||
        cleanText(data.productDescriptionMeta) ||
        cleanText(data.productDescriptionText) ||
        cleanText(data.description),
      image: structured.image || image,
      price:
        structured.price ??
        parsePrice(data.productPriceContent) ??
        parsePrice(data.productPriceText) ??
        parsePrice(data.price) ??
        parsePrice(data.priceAmount),
    };
  } catch {
    return {};
  }
}

export async function importProductFromUrl(rawUrl: string): Promise<ImportedProductData> {
  const sourceUrl = normalizeUrl(rawUrl);
  const [metadata, html] = await Promise.all([
    fetchMicrolinkMetadata(sourceUrl),
    fetchPageHtml(sourceUrl),
  ]);
  const doc = html ? new DOMParser().parseFromString(html, 'text/html') : null;
  const structured = doc ? extractProductJsonLd(doc) : {};
  const meta = doc ? extractMetaData(doc) : {};
  const dom = doc ? extractDomData(doc) : {};
  const hostname = new URL(sourceUrl).hostname.replace(/^www\./i, '');
  const name = firstUsableText(
    structured.name,
    meta.name,
    dom.name,
    metadata.name,
    doc?.title,
    hostname,
  );
  const description = firstUsableText(
    structured.description,
    meta.description,
    dom.description,
    metadata.description,
  );
  const image = resolveUrl(
    structured.image || meta.image || dom.image || metadata.image,
    sourceUrl,
  );
  const price = structured.price ?? meta.price ?? dom.price ?? metadata.price ?? null;
  const foundProductData = Boolean(
    structured.name ||
    structured.description ||
    structured.image ||
    structured.price !== null ||
    meta.name ||
    meta.description ||
    meta.image ||
    meta.price !== null ||
    dom.name ||
    dom.description ||
    dom.image ||
    dom.price !== null ||
    metadata.name ||
    metadata.description ||
    metadata.image ||
    metadata.price !== null ||
    doc?.title,
  );

  if (!foundProductData) {
    throw new Error(
      'Não foi possível ler os dados deste link. Use uma página pública de produto e tente novamente.',
    );
  }

  return {
    name: cleanText(name).slice(0, 100),
    price,
    description: cleanText(description).slice(0, 1000),
    image,
    sourceUrl,
  };
}
