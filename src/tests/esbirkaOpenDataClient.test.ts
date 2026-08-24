import { describe, expect, it } from 'vitest';
import { EsbirkaOpenDataClient } from '../services/esbirka/EsbirkaOpenDataClient';

describe('EsbirkaOpenDataClient', () => {
  it('builds official ELI URI', () => {
    const client = new EsbirkaOpenDataClient();

    expect(
      client.buildEliUri(89, 2012, '2026-01-01')
    ).toBe(
      'https://opendata.eselpoint.gov.cz/esel-esb/eli/cz/sb/2012/89/2026-01-01'
    );
  });

  it('builds provision URI', () => {
    const client = new EsbirkaOpenDataClient();

    const eli = client.buildEliUri(89, 2012, '2026-01-01');

    expect(
      client.buildProvisionUri(
        eli,
        'dokument/norma/cast_4/hlava_2/dil_2/oddil_3/pododdil_2/par_2239/odst_1'
      )
    ).toBe(
      'https://opendata.eselpoint.gov.cz/esel-esb/eli/cz/sb/2012/89/2026-01-01/dokument/norma/cast_4/hlava_2/dil_2/oddil_3/pododdil_2/par_2239/odst_1'
    );
  });

  it('parses SPARQL JSON response', async () => {
    const body = JSON.stringify({
      results: {
        bindings: [
          {
            fragment: {
              type: 'uri',
              value:
                'https://opendata.eselpoint.gov.cz/esel-esb/právní-akt-fragment/922086447',
            },
            text: {
              type: 'literal',
              value:
                '<var>(1)</var> Nepřihlíží se k ujednání ukládajícímu nájemci povinnost.',
            },
          },
        ],
      },
    });

    const client = new EsbirkaOpenDataClient(
      async () =>
        new Response(body, {
          status: 200,
          headers: {
            'content-type': 'application/sparql-results+json',
          },
        })
    );

    const result = await client.getProvisionText(
      'https://opendata.eselpoint.gov.cz/esel-esb/eli/cz/sb/2012/89/2026-01-01/dokument/norma/par_2239/odst_1'
    );

    expect(result.fragmentUri).toContain(
      'právní-akt-fragment/922086447'
    );

    expect(result.text).toBe(
      '(1) Nepřihlíží se k ujednání ukládajícímu nájemci povinnost.'
    );
  });

  it('fails closed on HTTP errors', async () => {
    const client = new EsbirkaOpenDataClient(
      async () =>
        new Response('Forbidden', {
          status: 403,
          headers: {
            'content-type': 'text/plain',
          },
        })
    );

    await expect(
      client.getProvisionText(
        'https://opendata.eselpoint.gov.cz/esel-esb/eli/cz/sb/2012/89/2026-01-01/test'
      )
    ).rejects.toThrow(
      'e-Sbírka OpenData SPARQL request failed: HTTP 403'
    );
  });
});
