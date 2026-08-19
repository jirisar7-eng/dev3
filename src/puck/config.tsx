import React from 'react';
import type { Config, Data } from '@measured/puck';
import {
  PollComponent,
  PollBlockProps,
  FormComponent,
  FormBlockProps,
  ImageBlockProps,
  ColumnsBlockProps,
} from './PuckInteractiveBlocks';

import { HeroAdapter, HeroAdapterProps } from './adapters/HeroAdapter';
import { TextAdapter, TextAdapterProps } from './adapters/TextAdapter';
import { CtaAdapter, CtaAdapterProps } from './adapters/CtaAdapter';
import { ImageAdapter, ImageAdapterProps } from './adapters/ImageAdapter';
import { ColumnsAdapter, ColumnsAdapterProps } from './adapters/ColumnsAdapter';
import { FaqFeedAdapter, FaqFeedAdapterProps } from './adapters/FaqFeedAdapter';
import { ArticlesFeedAdapter, ArticlesFeedAdapterProps } from './adapters/ArticlesFeedAdapter';
import {
  SituationSelectorAdapter,
  SituationSelectorProps,
  ProcessTimelineAdapter,
  ProcessTimelineProps,
  FeatureGridAdapter,
  FeatureGridProps,
  LifeSituationsGridAdapter,
  LifeSituationsGridProps,
  GuideSectionAdapter,
  GuideSectionProps,
  WorkspaceSectionAdapter,
  WorkspaceSectionProps,
  AiSectionAdapter,
  AiSectionProps,
  KnowledgeCenterAdapter,
  KnowledgeCenterProps,
  PrincipleSectionAdapter,
  PrincipleSectionProps,
  CtaGridAdapter,
  CtaGridProps,
  FooterCtaAdapter,
  FooterCtaProps,
} from './adapters/HomepageAdapters';

export function normalizePuckData(data: any): Data {
  if (!data || typeof data !== 'object') {
    return { content: [], root: { props: {} } };
  }
  const content = Array.isArray(data.content) ? data.content : [];
  const seenIds = new Set<string>();

  const normalizedContent = content.map((item: any, idx: number) => {
    if (!item || typeof item !== 'object') return item;
    const props = item.props && typeof item.props === 'object' ? { ...item.props } : {};
    let id = props.id || item.id;
    if (!id || typeof id !== 'string' || seenIds.has(id)) {
      id = `${item.type || 'Block'}-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 7)}`;
    }
    seenIds.add(id);
    return {
      ...item,
      props: {
        ...props,
        id,
      },
    };
  });

  return {
    ...data,
    content: normalizedContent,
    root: data.root && typeof data.root === 'object' ? data.root : { props: {} },
  };
}

export type Props = {
  HeroBlock: HeroAdapterProps;
  SituationSelectorBlock: SituationSelectorProps;
  ProcessTimelineBlock: ProcessTimelineProps;
  FeatureGridBlock: FeatureGridProps;
  LifeSituationsGridBlock: LifeSituationsGridProps;
  GuideSectionBlock: GuideSectionProps;
  WorkspaceSectionBlock: WorkspaceSectionProps;
  AiSectionBlock: AiSectionProps;
  KnowledgeCenterBlock: KnowledgeCenterProps;
  PrincipleSectionBlock: PrincipleSectionProps;
  CtaGridBlock: CtaGridProps;
  FooterCtaBlock: FooterCtaProps;
  TextBlock: TextAdapterProps;
  CallToAction: CtaAdapterProps;
  ColumnsBlock: ColumnsAdapterProps;
  ImageBlock: ImageAdapterProps;
  PollBlock: PollBlockProps;
  FormBlock: FormBlockProps;
  FaqFeedBlock: FaqFeedAdapterProps;
  ArticlesFeedBlock: ArticlesFeedAdapterProps;
};

export const puckConfig: Config<Props> = {
  components: {
    HeroBlock: {
      fields: {
        title: { type: 'text' },
        subtitle: { type: 'text' },
        description: { type: 'textarea' },
        badgeText: { type: 'text' },
        highlightBadge: { type: 'text' },
        ctaText: { type: 'text' },
        ctaUrl: { type: 'text' },
        secondaryCtaText: { type: 'text' },
        secondaryCtaUrl: { type: 'text' },
      },
      defaultProps: {
        title: 'Táta má právo',
        subtitle: 'Pomoc, když se rozpadá rodina. Podpora, když nechcete přijít o své dítě.',
        description: 'Rozchod rodičů nemusí znamenat konec vztahu otce s dítětem.\n\nNa jednom místě získáte přehled, co můžete udělat, jaká máte práva, jak postupovat vůči soudu a OSPOD, jak si připravit podklady a jak si dlouhodobě udržet přehled o péči o své dítě.',
        badgeText: 'Portál pro právní a psychologickou oporu otců v ČR',
        highlightBadge: 'Nejsme proti matkám. Jsme pro dítě a jeho právo mít oba rodiče.',
        ctaText: 'Začít podle mé situace',
        ctaUrl: '#situace',
        secondaryCtaText: 'Prozkoumat portál',
        secondaryCtaUrl: '#sekce',
      },
      render: (props) => <HeroAdapter {...props} />,
    },

    SituationSelectorBlock: {
      fields: {
        title: { type: 'text' },
        subtitle: { type: 'text' },
        cards: {
          type: 'array',
          getItemSummary: (item) => item.title || 'Karta',
          arrayFields: {
            title: { type: 'text' },
            description: { type: 'textarea' },
            ctaText: { type: 'text' },
            ctaUrl: { type: 'text' },
            icon: { type: 'text' },
            active: {
              type: 'select',
              options: [
                { label: 'Aktivní', value: 'true' },
                { label: 'Skrytá', value: 'false' },
              ],
            },
          },
        },
      },
      defaultProps: {
        title: 'Nevíte, kde začít?',
        subtitle: 'Vyberte, co právě řešíte.',
        cards: [],
      },
      render: (props) => <SituationSelectorAdapter {...props} />,
    },

    ProcessTimelineBlock: {
      fields: {
        title: { type: 'text' },
        subtitle: { type: 'text' },
        description: { type: 'textarea' },
        steps: {
          type: 'array',
          getItemSummary: (item, idx) => item.title || `Krok ${(idx ?? 0) + 1}`,
          arrayFields: {
            stepNumber: { type: 'text' },
            title: { type: 'text' },
            description: { type: 'textarea' },
          },
        },
      },
      defaultProps: {
        title: 'Vaše dítě. Vaše péče. Vaše práva.',
        subtitle: 'Portál, který spojuje informace, dokumenty a praktickou pomoc.',
        description: 'Táta má právo není jen databáze článků. Je to nástroj, který má otci pomoci projít celou cestou:',
        steps: [],
      },
      render: (props) => <ProcessTimelineAdapter {...props} />,
    },

    FeatureGridBlock: {
      fields: {
        title: { type: 'text' },
        subtitle: { type: 'text' },
        features: {
          type: 'array',
          getItemSummary: (item) => item.title || 'Funkce',
          arrayFields: {
            title: { type: 'text' },
            description: { type: 'textarea' },
            ctaText: { type: 'text' },
            ctaUrl: { type: 'text' },
            icon: { type: 'text' },
            active: {
              type: 'select',
              options: [
                { label: 'Aktivní', value: 'true' },
                { label: 'Skrytá', value: 'false' },
              ],
            },
          },
        },
      },
      defaultProps: {
        title: 'Co můžete na portálu dělat?',
        subtitle: 'Komplexní ekosystém nástrojů pro otce',
        features: [],
      },
      render: (props) => <FeatureGridAdapter {...props} />,
    },

    LifeSituationsGridBlock: {
      fields: {
        title: { type: 'text' },
        subtitle: { type: 'text' },
        situations: {
          type: 'array',
          getItemSummary: (item) => item.title || 'Situace',
          arrayFields: {
            title: { type: 'text' },
            description: { type: 'textarea' },
            ctaText: { type: 'text' },
            ctaUrl: { type: 'text' },
            icon: { type: 'text' },
            active: {
              type: 'select',
              options: [
                { label: 'Aktivní', value: 'true' },
                { label: 'Skrytá', value: 'false' },
              ],
            },
          },
        },
      },
      defaultProps: {
        title: 'Řešte svou situaci podle toho, co právě prožíváte',
        subtitle: 'Přímé vstupy do tematických modulů',
        situations: [],
      },
      render: (props) => <LifeSituationsGridAdapter {...props} />,
    },

    GuideSectionBlock: {
      fields: {
        title: { type: 'text' },
        text: { type: 'textarea' },
        ctaText: { type: 'text' },
        ctaUrl: { type: 'text' },
      },
      defaultProps: {
        title: 'Nevíte, co řešit jako první?',
        text: 'Použijte našeho průvodce. Odpovězte na několik jednoduchých otázek a portál vám sestaví orientační seznam oblastí, které mohou být pro vaši situaci důležité.',
        ctaText: 'Spustit průvodce',
        ctaUrl: '/ai-guide',
      },
      render: (props) => <GuideSectionAdapter {...props} />,
    },

    WorkspaceSectionBlock: {
      fields: {
        title: { type: 'text' },
        subtitle: { type: 'text' },
        itemsText: { type: 'textarea' },
        note: { type: 'text' },
        ctaText: { type: 'text' },
        ctaUrl: { type: 'text' },
      },
      defaultProps: {
        title: 'Vaše dokumenty nemusí být rozházené',
        subtitle: 'Vytvořte si vlastní opatrovnickou složku',
        itemsText: 'Rozhodnutí soudu\nNávrhy a vyjádření\nKomunikace rodičů\nDůležité události\nDůkazní materiály\nTermíny jednání\nÚdaje o dítěti\nPlán péče\nDůležitá judikatura\nVlastní poznámky',
        note: 'Jednou zadané údaje nemusíte zbytečně přepisovat do dalších částí portálu.',
        ctaText: 'Otevřít Moji pracovnu',
        ctaUrl: '/user-portal',
      },
      render: (props) => <WorkspaceSectionAdapter {...props} />,
    },

    AiSectionBlock: {
      fields: {
        title: { type: 'text' },
        subtitle: { type: 'text' },
        capabilitiesText: { type: 'textarea' },
        disclaimer: { type: 'textarea' },
        ctaText: { type: 'text' },
        ctaUrl: { type: 'text' },
      },
      defaultProps: {
        title: 'Nechte si pomoci s orientací',
        subtitle: 'AI průvodce',
        capabilitiesText: 'vytvořit stručné shrnutí rozsudku či podání\nvytáhnout důležité údaje a lhůty\nvytvořit seznam otázek na jednání OSPOD / soudu\nnajít související právní témata\npřipravit věcné podklady pro advokáta\nporovnat informace v různých dokumentech\nvysvětlit složitý právní text srozumitelněji',
        disclaimer: 'AI nenahrazuje advokáta ani soud. Je to nástroj pro orientaci, organizaci informací a přípravu.',
        ctaText: 'Vyzkoušet AI průvodce',
        ctaUrl: '/ai-guide',
      },
      render: (props) => <AiSectionAdapter {...props} />,
    },

    KnowledgeCenterBlock: {
      fields: {
        title: { type: 'text' },
        text: { type: 'textarea' },
        ctaText: { type: 'text' },
        ctaUrl: { type: 'text' },
      },
      defaultProps: {
        title: 'Ověřené informace místo chaosu',
        text: 'Cílem je, aby otec nemusel hledat odpověď na deseti různých místech.',
        ctaText: 'Prozkoumat znalostní centrum',
        ctaUrl: '/legal-wiki',
      },
      render: (props) => <KnowledgeCenterAdapter {...props} />,
    },

    PrincipleSectionBlock: {
      fields: {
        title: { type: 'text' },
        highlightTitle: { type: 'text' },
        body: { type: 'textarea' },
      },
      defaultProps: {
        title: 'Co je důležité?',
        highlightTitle: 'Dítě není předmět sporu.',
        body: 'Rozchod rodičů je situace dospělých.\n\nPro dítě je ale zásadní, aby mělo bezpečný vztah k oběma rodičům, pokud jsou oba rodiče schopni o něj řádně pečovat.\n\nProto nechceme stavět portál na boji: otec proti matce, ale na principu: dítě + oba rodiče + odpovědná péče.',
      },
      render: (props) => <PrincipleSectionAdapter {...props} />,
    },

    CtaGridBlock: {
      fields: {
        title: { type: 'text' },
        buttons: {
          type: 'array',
          getItemSummary: (item) => item.text || 'Tlačítko',
          arrayFields: {
            text: { type: 'text' },
            url: { type: 'text' },
          },
        },
      },
      defaultProps: {
        title: 'Začněte tam, kde právě jste',
        buttons: [],
      },
      render: (props) => <CtaGridAdapter {...props} />,
    },

    FooterCtaBlock: {
      fields: {
        title: { type: 'text' },
        subtitle: { type: 'text' },
        text: { type: 'textarea' },
        legalDisclaimer: { type: 'textarea' },
        ctaText: { type: 'text' },
        ctaUrl: { type: 'text' },
      },
      defaultProps: {
        title: 'Táta má právo',
        subtitle: 'Informace. Nástroje. Orientace. Podpora.',
        text: 'Projekt vzniká s cílem pomáhat rodičům lépe se orientovat v situacích spojených s rozchodem, péčí o dítě a opatrovnickým řízením.',
        legalDisclaimer: 'Informace na portálu mají informační charakter a nenahrazují individuální právní služby.',
        ctaText: 'Začít',
        ctaUrl: '/sos-plan',
      },
      render: (props) => <FooterCtaAdapter {...props} />,
    },

    TextBlock: {
      fields: {
        text: { type: 'textarea' },
        align: {
          type: 'select',
          options: [
            { label: 'Vlevo', value: 'left' },
            { label: 'Na střed', value: 'center' },
            { label: 'Vpravo', value: 'right' },
          ],
        },
        maxWidth: {
          type: 'select',
          options: [
            { label: 'Malý (sm)', value: 'sm' },
            { label: 'Střední (md)', value: 'md' },
            { label: 'Velký (lg)', value: 'lg' },
            { label: 'Extra velký (xl)', value: 'xl' },
            { label: 'Plná šířka', value: 'full' },
          ],
        },
        color: {
          type: 'select',
          options: [
            { label: 'Výchozí', value: 'default' },
            { label: 'Tlumený', value: 'muted' },
            { label: 'Hlavní/Větší', value: 'lead' },
          ],
        },
      },
      defaultProps: {
        text: 'Zde zadejte váš text. Můžete zde sdílet důležité informace, příběhy nebo podrobnosti o vašich službách.',
        align: 'left',
        maxWidth: 'lg',
        color: 'default',
      },
      render: (props) => <TextAdapter {...props} />,
    },

    CallToAction: {
      fields: {
        title: { type: 'text' },
        description: { type: 'textarea' },
        buttonText: { type: 'text' },
        buttonUrl: { type: 'text' },
        variant: {
          type: 'select',
          options: [
            { label: 'Primární', value: 'primary' },
            { label: 'Sekundární', value: 'secondary' },
            { label: 'Tmavý', value: 'dark' },
          ],
        },
      },
      defaultProps: {
        title: 'Připraveni začít?',
        description: 'Připojte se k nám ještě dnes a získejte přístup ke všem výhodám a funkcím.',
        buttonText: 'Zaregistrovat se',
        buttonUrl: '#',
        variant: 'primary',
      },
      render: (props) => <CtaAdapter {...props} />,
    },

    ColumnsBlock: {
      fields: {
        columnsCount: {
          type: 'select',
          options: [
            { label: '2 sloupce', value: '2' },
            { label: '3 sloupce', value: '3' },
            { label: '4 sloupce', value: '4' },
          ],
        },
        ratio: {
          type: 'select',
          options: [
            { label: 'Rovnoměrné (50/50, 33/33/33)', value: 'equal' },
            { label: 'Široký vlevo (70 / 30)', value: '70-30' },
            { label: 'Široký vpravo (30 / 70)', value: '30-70' },
            { label: 'Široký vlevo (60 / 40)', value: '60-40' },
            { label: 'Široký vpravo (40 / 60)', value: '40-60' },
          ],
        },
        gap: {
          type: 'select',
          options: [
            { label: 'Malá mezera', value: 'sm' },
            { label: 'Střední mezera', value: 'md' },
            { label: 'Velká mezera', value: 'lg' },
            { label: 'Extra velká mezera', value: 'xl' },
          ],
        },
        col1Title: { type: 'text' },
        col1Text: { type: 'textarea' },
        col1Image: { type: 'text' },
        col1ButtonText: { type: 'text' },
        col1ButtonUrl: { type: 'text' },

        col2Title: { type: 'text' },
        col2Text: { type: 'textarea' },
        col2Image: { type: 'text' },
        col2ButtonText: { type: 'text' },
        col2ButtonUrl: { type: 'text' },

        col3Title: { type: 'text' },
        col3Text: { type: 'textarea' },

        col4Title: { type: 'text' },
        col4Text: { type: 'textarea' },
      },
      defaultProps: {
        columnsCount: '2',
        ratio: 'equal',
        gap: 'md',
        col1Title: 'První sloupec',
        col1Text: 'Zde můžete sdílet detailní popis, výhody nebo klíčové body prvního bloku.',
        col2Title: 'Druhý sloupec',
        col2Text: 'Druhý blok vedle prvního pro přehledné porovnání a strukturování stránky.',
        col3Title: 'Třetí sloupec',
        col3Text: 'Volitelný třetí sloupec.',
        col4Title: 'Čtvrtý sloupec',
        col4Text: 'Volitelný čtvrtý sloupec.',
      },
      render: (props) => <ColumnsAdapter {...props} />,
    },

    ImageBlock: {
      fields: {
        url: { type: 'text' },
        alt: { type: 'text' },
        caption: { type: 'text' },
        aspectRatio: {
          type: 'select',
          options: [
            { label: 'Automatický (Původní)', value: 'auto' },
            { label: '16 : 9 (Širokoúhlý)', value: '16/9' },
            { label: '4 : 3 (Klasický)', value: '4/3' },
            { label: '1 : 1 (Čtverec)', value: '1/1' },
            { label: '21 : 9 (Kino)', value: '21/9' },
          ],
        },
        align: {
          type: 'select',
          options: [
            { label: 'Na střed', value: 'center' },
            { label: 'Vlevo', value: 'left' },
            { label: 'Vpravo', value: 'right' },
            { label: 'Plná šířka', value: 'full' },
          ],
        },
        maxWidth: {
          type: 'select',
          options: [
            { label: 'Malý (sm)', value: 'sm' },
            { label: 'Střední (md)', value: 'md' },
            { label: 'Velký (lg)', value: 'lg' },
            { label: 'Extra velký (xl)', value: 'xl' },
            { label: '100% Šířka', value: 'full' },
          ],
        },
        borderRadius: {
          type: 'select',
          options: [
            { label: 'Žádné', value: 'none' },
            { label: 'Jemné (sm)', value: 'sm' },
            { label: 'Střední (md)', value: 'md' },
            { label: 'Zaoblené (xl)', value: 'xl' },
            { label: 'Kruh / Pill', value: 'full' },
          ],
        },
        linkUrl: { type: 'text' },
      },
      defaultProps: {
        url: 'https://images.unsplash.com/photo-1544027993-37dbfe43562a?auto=format&fit=crop&q=80&w=1200',
        alt: 'Rodina a péče o děti',
        caption: 'Podpora komunitních projektů pro rodiny',
        aspectRatio: '16/9',
        align: 'center',
        maxWidth: 'lg',
        borderRadius: 'xl',
      },
      render: (props) => <ImageAdapter {...props} />,
    },

    PollBlock: {
      fields: {
        pollId: { type: 'text' },
        question: { type: 'text' },
        description: { type: 'textarea' },
        optionsText: { type: 'textarea' },
      },
      defaultProps: {
        pollId: 'anketa-01',
        question: 'Měly by úřady a soudy přednostně rozhodovat ve prospěch střídavé péče?',
        description: 'Vyberte jednu možnost a hlasujte v naší bleskové anketě.',
        optionsText: 'Ano, jednoznačně\nSpíše ano\nSpíše ne\nNe, vůbec\nNemám vyhraněný názor',
      },
      render: (props) => <PollComponent {...props} />,
    },

    FormBlock: {
      fields: {
        formId: { type: 'text' },
        formName: { type: 'text' },
        title: { type: 'text' },
        description: { type: 'textarea' },
        fieldsText: { type: 'textarea' },
        submitButtonText: { type: 'text' },
        successMessage: { type: 'text' },
      },
      defaultProps: {
        formId: 'kontakt-form-1',
        formName: 'Kontakt a Podněty',
        title: 'Máte dotaz nebo právní podnět?',
        description: 'Vyplňte kontaktní formulář. Naši pracovníci se vám ozvou zpět.',
        fieldsText: 'Jméno a příjmení | text | true\nE-mailová adresa | email | true\nTelefonní číslo | tel | false\nZpráva nebo dotaz | textarea | true',
        submitButtonText: 'Odeslat formulář',
        successMessage: 'Děkujeme, váš formulář byl úspěšně doručen. Ozveme se vám zpět.',
      },
      render: (props) => <FormComponent {...props} />,
    },

    FaqFeedBlock: {
      fields: {
        title: { type: 'text' },
        badgeText: { type: 'text' },
        limit: { type: 'number' },
        categoryFilter: { type: 'text' },
      },
      defaultProps: {
        title: 'Nejčastější otázky v opatrovnickém řízení',
        badgeText: 'Časté Dotazy (FAQ)',
        limit: 10,
        categoryFilter: '',
      },
      render: (props) => <FaqFeedAdapter {...props} />,
    },

    ArticlesFeedBlock: {
      fields: {
        title: { type: 'text' },
        subtitle: { type: 'textarea' },
        limit: { type: 'number' },
        categoryFilter: { type: 'text' },
      },
      defaultProps: {
        title: 'Opatrovnické právo v praxi',
        subtitle: 'Odborné články, judikáty Ústavního soudu a osvědčené postupy pro otce.',
        limit: 3,
        categoryFilter: '',
      },
      render: (props) => <ArticlesFeedAdapter {...props} />,
    },
  },
};

export default puckConfig;
