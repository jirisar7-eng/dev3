const BASE =
  process.env.ESBIRKA_OPENDATA_BASE_URL ??
  'https://opendata.eselpoint.gov.cz';

const SPARQL_ENDPOINT = `${BASE}/sparql`;

export interface EsbirkaFragmentResult {
  fragmentUri: string;
  text: string;
}

export class EsbirkaOpenDataClient {
  private readonly fetchImpl: typeof fetch;

  constructor(fetchImpl: typeof fetch = fetch) {
    this.fetchImpl = fetchImpl;
  }

  /**
   * Constructs the official ELI URI for a legal act version.
   *
   * Example:
   * https://opendata.eselpoint.gov.cz/esel-esb/eli/cz/sb/2012/89/2026-01-01
   */
  public buildEliUri(
    actNumber: number,
    actYear: number,
    validFrom: string
  ): string {
    if (!Number.isInteger(actNumber) || actNumber <= 0) {
      throw new Error('Invalid act number');
    }

    if (!Number.isInteger(actYear) || actYear < 1900) {
      throw new Error('Invalid act year');
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(validFrom)) {
      throw new Error('Invalid validFrom date. Expected YYYY-MM-DD');
    }

    return `${BASE}/esel-esb/eli/cz/sb/${actYear}/${actNumber}/${validFrom}`;
  }

  /**
   * Constructs a provision/paragraph ELI URI.
   */
  public buildProvisionUri(
    eliUri: string,
    fragmentPath: string
  ): string {
    const base = eliUri.replace(/\/+$/, '');
    const path = fragmentPath.replace(/^\/+/, '');

    return `${base}/${path}`;
  }

  /**
   * Fetches legal text through the official e-Sbírka OpenData SPARQL endpoint.
   *
   * The ELI provision itself contains a reference to a legal-act fragment.
   * The actual human-readable text is stored on that fragment as
   * "text-fragmentu".
   */
  public async getProvisionText(
    provisionUri: string
  ): Promise<EsbirkaFragmentResult> {
    if (!provisionUri || typeof provisionUri !== 'string') {
      throw new Error('Provision URI must be a non-empty string');
    }

    const escapedProvisionUri = this.escapeSparqlIri(provisionUri);

    const query = `
SELECT ?fragment ?text
WHERE {
  <${escapedProvisionUri}>
    <https://slovník.gov.cz/datový/sbírka/pojem/obsahuje-fragment>
    ?fragment .

  ?fragment
    <https://slovník.gov.cz/datový/sbírka/pojem/text-fragmentu>
    ?text
}
`.trim();

    const url =
      `${SPARQL_ENDPOINT}` +
      `?output=${encodeURIComponent('application/sparql-results+json')}` +
      `&query=${encodeURIComponent(query)}`;

    const response = await this.fetchImpl(url, {
      method: 'GET',
      headers: {
        Accept:
          'application/sparql-results+json, application/json, text/xml',
        'User-Agent':
          'TataMaPravo-LegislativeSync/1.0 (tatovacesta.cz)',
      },
    });

    if (!response.ok) {
      throw new Error(
        `e-Sbírka OpenData SPARQL request failed: HTTP ${response.status}`
      );
    }

    const contentType = (
      response.headers.get('content-type') ?? ''
    ).toLowerCase();

    const body = await response.text();

    if (!body.trim()) {
      throw new Error(
        'e-Sbírka OpenData SPARQL request returned an empty response'
      );
    }

    const result = this.parseSparqlResponse(body, contentType);

    if (!result) {
      throw new Error(
        `e-Sbírka OpenData returned no text for provision: ${provisionUri}`
      );
    }

    return result;
  }

  /**
   * Parses SPARQL JSON results.
   *
   * Also supports the XML result format returned by some e-Sbírka
   * configurations.
   */
  private parseSparqlResponse(
    body: string,
    contentType: string
  ): EsbirkaFragmentResult | null {
    if (
      contentType.includes('json') ||
      body.trim().startsWith('{')
    ) {
      return this.parseJsonResponse(body);
    }

    if (
      contentType.includes('xml') ||
      body.trim().startsWith('<sparql')
    ) {
      return this.parseXmlResponse(body);
    }

    try {
      return this.parseJsonResponse(body);
    } catch {
      return this.parseXmlResponse(body);
    }
  }

  /**
   * Parses SPARQL JSON results.
   */
  private parseJsonResponse(
    body: string
  ): EsbirkaFragmentResult | null {
    const parsed = JSON.parse(body);

    const bindings =
      parsed?.results?.bindings ??
      parsed?.d?.results ??
      parsed?.results ??
      [];

    if (!Array.isArray(bindings) || bindings.length === 0) {
      return null;
    }

    const row = bindings[0];

    const fragment =
      row?.fragment?.value ??
      row?.fragment?.uri ??
      row?.fragment;

    const text =
      row?.text?.value ??
      row?.text;

    if (
      typeof fragment !== 'string' ||
      typeof text !== 'string'
    ) {
      return null;
    }

    return {
      fragmentUri: fragment,
      text: this.decodeHtmlFragment(text),
    };
  }

  /**
   * Parses SPARQL XML results.
   */
  private parseXmlResponse(
    body: string
  ): EsbirkaFragmentResult | null {
    const fragmentMatch = body.match(
      /<binding\s+name=["']fragment["'][^>]*>\s*<uri>([\s\S]*?)<\/uri>/i
    );

    const textMatch = body.match(
      /<binding\s+name=["']text["'][^>]*>\s*<literal[^>]*>([\s\S]*?)<\/literal>/i
    );

    if (!fragmentMatch || !textMatch) {
      return null;
    }

    return {
      fragmentUri: this.decodeXml(fragmentMatch[1]),
      text: this.decodeHtmlFragment(
        this.decodeXml(textMatch[1])
      ),
    };
  }

  /**
   * Decodes XML entities.
   */
  private decodeXml(value: string): string {
    return value
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&apos;/g, "'")
      .replace(/&amp;/g, '&');
  }

  /**
   * Removes the small amount of presentation markup used by e-Sbírka
   * around fragment numbers, while preserving the legal text.
   */
  private decodeHtmlFragment(value: string): string {
    return this.decodeXml(value)
      .replace(/<var>\s*/gi, '')
      .replace(/\s*<\/var>/gi, '')
      .replace(/<[^>]+>/g, '')
      .replace(/&nbsp;/gi, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Prevents an IRI from escaping the SPARQL query.
   */
  private escapeSparqlIri(value: string): string {
    return value
      .replace(/\\/g, '\\\\')
      .replace(/</g, '%3C')
      .replace(/>/g, '%3E')
      .replace(/"/g, '\\"');
  }
}
