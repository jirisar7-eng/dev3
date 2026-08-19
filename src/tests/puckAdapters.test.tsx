import assert from 'node:assert';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { HeroAdapter } from '../puck/adapters/HeroAdapter';
import { TextAdapter } from '../puck/adapters/TextAdapter';
import { CtaAdapter } from '../puck/adapters/CtaAdapter';
import { ImageAdapter } from '../puck/adapters/ImageAdapter';
import { ColumnsAdapter } from '../puck/adapters/ColumnsAdapter';
import { FaqFeedAdapter } from '../puck/adapters/FaqFeedAdapter';
import { ArticlesFeedAdapter } from '../puck/adapters/ArticlesFeedAdapter';
import { TextProvider } from '../context/TextContext';

// Simple mock context provider to wrap tests that require translation support
const wrapWithProvider = (element: React.ReactElement) => {
  return (
    <TextProvider>
      {element}
    </TextProvider>
  );
};

export async function runPuckAdapterTests() {
  console.log('\n=============================================================');
  console.log('--- PUCK ADAPTER LAYER & SECURITY SANITIZATION TESTS ---');
  console.log('=============================================================\n');

  // --- Test 1: HeroAdapter fallback and customized rendering ---
  console.log('Test 1: HeroAdapter Fallback and Props Customization...');
  const defaultHeroHtml = renderToStaticMarkup(wrapWithProvider(<HeroAdapter />));
  assert.ok(defaultHeroHtml.includes('Táta má právo'), 'Should render default Czech translation title');
  assert.ok(defaultHeroHtml.includes('Prozkoumat poradnu'), 'Should render default CTA button text');

  const customHeroHtml = renderToStaticMarkup(wrapWithProvider(
    <HeroAdapter
      title="Custom Hero Title"
      description="Custom Description text here"
      badgeText="Custom Badge text"
      ctaText="Custom Button"
      ctaUrl="https://tatovacesta.cz/info"
    />
  ));
  assert.ok(customHeroHtml.includes('Custom Hero Title'), 'Should render custom title');
  assert.ok(customHeroHtml.includes('Custom Description text here'), 'Should render custom description');
  assert.ok(customHeroHtml.includes('Custom Badge text'), 'Should render custom badge');
  assert.ok(customHeroHtml.includes('Custom Button'), 'Should render custom button');
  assert.ok(customHeroHtml.includes('href="https://tatovacesta.cz/info"'), 'Should render safe custom link');

  // Verify that an unallowed domain is rewritten to "/"
  const blockedHeroHtml = renderToStaticMarkup(wrapWithProvider(
    <HeroAdapter
      ctaUrl="https://unsafe-unallowed-domain.com/scam"
    />
  ));
  assert.ok(blockedHeroHtml.includes('href="/"'), 'Unallowed external link must be rewritten to root for security');
  console.log('✅ Test 1 Passed\n');

  // --- Test 2: HeroAdapter Security Protocol Sanitization ---
  console.log('Test 2: HeroAdapter Security Protocol Sanitization (XSS & Protocol Prevention)...');
  const dangerousHeroHtml = renderToStaticMarkup(wrapWithProvider(
    <HeroAdapter
      ctaUrl="javascript:alert('malicious_xss')"
      secondaryCtaUrl="data:text/html,<script>alert(1)</script>"
    />
  ));
  assert.ok(!dangerousHeroHtml.includes('href="javascript:'), 'Must strip malicious javascript protocol link');
  assert.ok(!dangerousHeroHtml.includes('href="data:'), 'Must strip malicious data protocol link');
  assert.ok(dangerousHeroHtml.includes('href="#"'), 'Should fallback to safe default anchor');
  console.log('✅ Test 2 Passed\n');

  // --- Test 3: TextAdapter rendering, alignments and null checks ---
  console.log('Test 3: TextAdapter Alignment and Null Fallback...');
  const emptyTextHtml = renderToStaticMarkup(<TextAdapter text="" />);
  assert.ok(emptyTextHtml.includes('Zde zadejte váš text...'), 'Should fallback to default instructions if empty string');

  const alignCenterHtml = renderToStaticMarkup(
    <TextAdapter text="Centered content text" align="center" maxWidth="sm" color="lead" />
  );
  assert.ok(alignCenterHtml.includes('text-center'), 'Should contain center text alignment CSS class');
  assert.ok(alignCenterHtml.includes('max-w-xl'), 'Should contain max-w-xl CSS class');
  assert.ok(alignCenterHtml.includes('text-xl text-slate-800'), 'Should contain lead text sizing CSS class');
  console.log('✅ Test 3 Passed\n');

  // --- Test 4: CtaAdapter variant styles and SSRF redirection defense ---
  console.log('Test 4: CtaAdapter Styles & SSRF Redirection Defense...');
  const primaryCtaHtml = renderToStaticMarkup(
    <CtaAdapter title="Právní pomoc" description="Klikněte pro spojení" buttonText="Kontakt" buttonUrl="https://dangerous-external-site.com" variant="primary" />
  );
  assert.ok(primaryCtaHtml.includes('bg-indigo-600'), 'Should contain primary indigo background class');
  assert.ok(!primaryCtaHtml.includes('href="https://dangerous-external-site.com"'), 'Should filter external absolute link to prevent SSRF redirection vectors');
  assert.ok(primaryCtaHtml.includes('href="/"'), 'Should fallback to safe platform root URL (/)');

  const secondaryCtaHtml = renderToStaticMarkup(
    <CtaAdapter title="Více" description="Klikněte níže" buttonText="Menu" buttonUrl="/vnitrni-stranka" variant="secondary" />
  );
  assert.ok(secondaryCtaHtml.includes('bg-slate-100'), 'Should contain secondary light background class');
  assert.ok(secondaryCtaHtml.includes('href="/vnitrni-stranka"'), 'Should allow safe relative routes');
  console.log('✅ Test 4 Passed\n');

  // --- Test 5: ImageAdapter layout properties and secure URL filtering ---
  console.log('Test 5: ImageAdapter Layout & Image URL Safety...');
  const safeImgHtml = renderToStaticMarkup(
    <ImageAdapter url="/assets/kids.png" alt="Happy child" caption="Kids play" linkUrl="/articles" />
  );
  assert.ok(safeImgHtml.includes('src="/assets/kids.png"'), 'Should render safe relative image source');
  assert.ok(safeImgHtml.includes('alt="Happy child"'), 'Should render alt text');
  assert.ok(safeImgHtml.includes('Kids play'), 'Should render caption');
  assert.ok(safeImgHtml.includes('href="/articles"'), 'Should render wrap link');

  const unsafeImgHtml = renderToStaticMarkup(
    <ImageAdapter url="javascript:alert('img')" linkUrl="data:text/plain,unsafe" />
  );
  assert.ok(!unsafeImgHtml.includes('src="javascript:'), 'Should sanitize image URL');
  assert.ok(!unsafeImgHtml.includes('href="data:'), 'Should sanitize link URL');
  console.log('✅ Test 5 Passed\n');

  // --- Test 6: ColumnsAdapter layout configurations ---
  console.log('Test 6: ColumnsAdapter Layouts & Column Ratios...');
  const threeColHtml = renderToStaticMarkup(
    <ColumnsAdapter
      columnsCount="3"
      col1Title="T1" col1Text="C1"
      col2Title="T2" col2Text="C2"
      col3Title="T3" col3Text="C3"
    />
  );
  assert.ok(threeColHtml.includes('grid-cols-1 md:grid-cols-3'), 'Should apply 3 columns grid CSS');
  assert.ok(threeColHtml.includes('T1') && threeColHtml.includes('T2') && threeColHtml.includes('T3'), 'Should render titles for all columns');

  const ratioColHtml = renderToStaticMarkup(
    <ColumnsAdapter
      columnsCount="2"
      ratio="70-30"
      col1Title="T1"
      col2Title="T2"
    />
  );
  assert.ok(ratioColHtml.includes('md:grid-[2.33fr_1fr]'), 'Should apply customized CSS layout grid template columns ratio');
  console.log('✅ Test 6 Passed\n');

  // --- Test 7: FaqFeedAdapter & ArticlesFeedAdapter state and dynamic components ---
  console.log('Test 7: FaqFeedAdapter & ArticlesFeedAdapter instantiation...');
  const faqFeedHtml = renderToStaticMarkup(<FaqFeedAdapter title="Test FAQ" limit={5} />);
  assert.ok(faqFeedHtml.includes('Test FAQ'), 'Should render the component title');
  assert.ok(faqFeedHtml.includes('animate-spin'), 'Should initially render loading indicator state');

  const articlesFeedHtml = renderToStaticMarkup(<ArticlesFeedAdapter title="Test Articles" limit={3} />);
  assert.ok(articlesFeedHtml.includes('Test Articles'), 'Should render the component title');
  assert.ok(articlesFeedHtml.includes('animate-spin'), 'Should initially render loading indicator state');
  console.log('✅ Test 7 Passed\n');

  // --- Test 8: Integration Test: Puck JSON data -> Adapters -> Complete Layout pipeline ---
  console.log('Test 8: Integration Test (Puck JSON structure -> Adapters rendering pipeline)...');
  const mockPuckJson = {
    content: [
      {
        type: 'HeroBlock',
        props: {
          title: 'Integrated Hero Title',
          description: 'Puck integration description text',
          ctaText: 'Integrated CTA',
          ctaUrl: '/integrated-link',
        },
      },
      {
        type: 'TextBlock',
        props: {
          text: 'Integrated block text element body content',
          align: 'left',
        },
      },
      {
        type: 'CallToAction',
        props: {
          title: 'Integrated CTA Banner',
          description: 'Click this button immediately',
          buttonText: 'Action',
          buttonUrl: '/action-relative',
        },
      },
    ],
    root: { props: {} },
  };

  // Render whole mocked Puck document by looping over elements manually as a renderer would
  const renderedElements: string[] = [];
  mockPuckJson.content.forEach((item, index) => {
    if (item.type === 'HeroBlock') {
      renderedElements.push(renderToStaticMarkup(wrapWithProvider(
        <HeroAdapter
          title={item.props.title}
          description={item.props.description}
          ctaText={item.props.ctaText}
          ctaUrl={item.props.ctaUrl}
        />
      )));
    } else if (item.type === 'TextBlock') {
      renderedElements.push(renderToStaticMarkup(
        <TextAdapter text={item.props.text} align={item.props.align as any} />
      ));
    } else if (item.type === 'CallToAction') {
      renderedElements.push(renderToStaticMarkup(
        <CtaAdapter
          title={item.props.title}
          description={item.props.description}
          buttonText={item.props.buttonText}
          buttonUrl={item.props.buttonUrl}
        />
      ));
    }
  });

  const fullLayoutHtml = renderedElements.join('');
  assert.ok(fullLayoutHtml.includes('Integrated Hero Title'), 'Integration must render integrated hero title');
  assert.ok(fullLayoutHtml.includes('Integrated block text element body content'), 'Integration must render text content');
  assert.ok(fullLayoutHtml.includes('Integrated CTA Banner'), 'Integration must render CTA banner title');
  assert.ok(fullLayoutHtml.includes('href="/action-relative"'), 'Integration must contain relative link');
  console.log('✅ Test 8 Passed\n');

  console.log('🎉 PUCK ADAPTER UNIT & INTEGRATION TESTS FINISHED: ALL ADAPTERS WORKING SECURELY!\n');
}

// Support executing directly if called in Node CLI
const isMain = process.argv[1] && process.argv[1].endsWith('puckAdapters.test.tsx');
if (isMain) {
  runPuckAdapterTests()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('❌ Tests failed with error:', err);
      process.exit(1);
    });
}
