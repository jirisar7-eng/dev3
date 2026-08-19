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
        description: { type: 'textarea' },
        badgeText: { type: 'text' },
        ctaText: { type: 'text' },
        ctaUrl: { type: 'text' },
        secondaryCtaText: { type: 'text' },
        secondaryCtaUrl: { type: 'text' },
      },
      defaultProps: {
        title: 'Táta má právo. Dítě má právo na oba rodiče.',
        description: 'Komplexní opora pro otce v opatrovnických situacích. Právní orientace, psychologická podpora a spravedlivá péče.',
        badgeText: 'Portál pro právní a psychologickou oporu otců v ČR',
        ctaText: 'Prozkoumat poradnu',
        ctaUrl: '#poradna',
        secondaryCtaText: 'Přehled modulů',
        secondaryCtaUrl: '#moduly',
      },
      render: (props) => <HeroAdapter {...props} />,
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
