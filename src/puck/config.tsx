import React from 'react';
import type { Config, Data } from '@measured/puck';
import {
  PollComponent,
  PollBlockProps,
  FormComponent,
  FormBlockProps,
  ImageBlockComponent,
  ImageBlockProps,
  ColumnsBlockComponent,
  ColumnsBlockProps,
} from './PuckInteractiveBlocks';

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
  HeroBlock: {
    title: string;
    description: string;
    buttonText: string;
    buttonUrl?: string;
  };
  TextBlock: {
    text: string;
    align: 'left' | 'center' | 'right';
  };
  CallToAction: {
    title: string;
    description: string;
    buttonText: string;
    buttonUrl?: string;
    variant?: 'primary' | 'secondary' | 'dark';
  };
  ColumnsBlock: ColumnsBlockProps;
  ImageBlock: ImageBlockProps;
  PollBlock: PollBlockProps;
  FormBlock: FormBlockProps;
};

export const puckConfig: Config<Props> = {
  components: {
    HeroBlock: {
      fields: {
        title: { type: 'text' },
        description: { type: 'textarea' },
        buttonText: { type: 'text' },
        buttonUrl: { type: 'text' },
      },
      defaultProps: {
        title: 'Vítejte na naší stránce',
        description: 'Tohle je skvělý úvodní blok, který zaujme vaše návštěvníky na první pohled a přiměje je k akci.',
        buttonText: 'Prozkoumat nabídku',
        buttonUrl: '#',
      },
      render: ({ title, description, buttonText, buttonUrl }) => (
        <div className="py-16 px-6 md:px-12 bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl my-4 text-center shadow-xl">
          <h1 className="text-3xl md:text-5xl font-bold tracking-tight mb-4">{title}</h1>
          <p className="text-lg md:text-xl text-slate-300 max-w-2xl mx-auto mb-8 leading-relaxed">{description}</p>
          {buttonText && (
            <a
              href={buttonUrl || '#'}
              className="inline-block bg-indigo-600 hover:bg-indigo-500 text-white font-medium px-6 py-3 rounded-xl transition-all shadow-md hover:shadow-indigo-500/25 active:scale-95"
            >
              {buttonText}
            </a>
          )}
        </div>
      ),
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
      },
      defaultProps: {
        text: 'Zde zadejte váš text. Můžete zde sdílet důležité informace, příběhy nebo podrobnosti o vašich službách.',
        align: 'left',
      },
      render: ({ text, align }) => {
        const alignClass =
          align === 'center' ? 'text-center' : align === 'right' ? 'text-right' : 'text-left';
        return (
          <div className={`py-6 px-4 my-2 ${alignClass}`}>
            <p className="text-base md:text-lg text-slate-700 dark:text-slate-200 leading-relaxed whitespace-pre-wrap">
              {text}
            </p>
          </div>
        );
      },
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
      render: ({ title, description, buttonText, buttonUrl, variant }) => {
        let bannerStyle = 'bg-indigo-600 text-white';
        let btnStyle = 'bg-white text-indigo-700 hover:bg-slate-100';

        if (variant === 'secondary') {
          bannerStyle = 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700';
          btnStyle = 'bg-indigo-600 text-white hover:bg-indigo-500';
        } else if (variant === 'dark') {
          bannerStyle = 'bg-slate-900 text-white border border-slate-800';
          btnStyle = 'bg-indigo-500 text-white hover:bg-indigo-400';
        }

        return (
          <div className={`p-8 md:p-10 rounded-2xl my-6 flex flex-col md:flex-row items-center justify-between gap-6 shadow-md ${bannerStyle}`}>
            <div className="space-y-2 text-center md:text-left">
              <h3 className="text-2xl font-bold">{title}</h3>
              <p className="opacity-90 max-w-xl text-sm md:text-base">{description}</p>
            </div>
            {buttonText && (
              <a
                href={buttonUrl || '#'}
                className={`whitespace-nowrap font-semibold px-6 py-3 rounded-xl transition-all shadow-sm active:scale-95 shrink-0 ${btnStyle}`}
              >
                {buttonText}
              </a>
            )}
          </div>
        );
      },
    },

    // 1. Layoutové sloupce (bloky vedle sebe)
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
      render: (props) => <ColumnsBlockComponent {...props} />,
    },

    // 2. Obrázky
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
      render: (props) => <ImageBlockComponent {...props} />,
    },

    // 3. Ankety (Poll)
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

    // 4. Formuláře (Form)
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
  },
};

export default puckConfig;
