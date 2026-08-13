/**
 * Systémové Puck Šablony (Puck Template Engine)
 */

export const CRISIS_CARD_SYSTEM_TEMPLATE = {
  id: 'tpl-crisis-card-1',
  name: 'Šablona: Krizová Karta & SOS Poradna',
  category: 'FORM',
  description: 'Krizový algoritmus 4 kroků, krizové kontakty, rozcestník fóra a okamžitá právní první pomoc pro otce v opatrovnické krizi.',
  isSystem: true,
  thumbnailUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=600',
  puckDataJson: JSON.stringify({
    content: [
      {
        type: 'HeroBlock',
        props: {
          title: '🚨 Krizová Karta: Prvních 72 hodin opatrovnické krize',
          description: 'Okamžitá krizová intervence, pravidlo BIFF komunikace, návod pro jednání s OSPOD a právní první pomoc.',
          buttonText: 'Zavolat Krizovou Linku 116 123',
          buttonUrl: 'tel:116123',
        },
      },
      {
        type: 'ColumnsBlock',
        props: {
          columnsCount: '2',
          ratio: 'equal',
          gap: 'lg',
          col1Title: '1. Emoční STOP & BIFF 🛑',
          col1Text: 'Neodpovídejte v afektu. Odložte odpověď o 24h. Pište výhradně v BIFF tónu (Stručně, Informativně, Slušně, Rázně).',
          col2Title: '2. Evidence & Archivace 📁',
          col2Text: 'Zálohujte SMS, WhatsApp a e-maily. Při bránění ve styku vyhotovte věcný záznam v klidu a bez scén.',
        },
      },
      {
        type: 'ColumnsBlock',
        props: {
          columnsCount: '2',
          ratio: 'equal',
          gap: 'lg',
          col1Title: '3. Konstruktivní OSPOD 🤝',
          col1Text: 'Podávejte věcné podněty písemně bez očerňování matky. Důraz klaďte výhradně na zájem a potřeby dítěte.',
          col2Title: '4. Právní Obrana ⚖️',
          col2Text: 'Při bránění ve styku podejte návrh na předběžné opatření (§ 452 z.ř.s.) s odkazem na judikaturu Ústavního soudu.',
        },
      },
      {
        type: 'FormBlock',
        props: {
          formId: 'crisis-sos-request-form',
          formName: 'Žádost o akutní krizovou asistenci',
          title: 'Požádat o vrstevnickou krizovou pomoc (Táta-Parťák)',
          description: 'Zanechte kontakt a náš mentor se vám ozve pro věcnou konzultaci.',
          fieldsText: 'Jméno / Přezdívka | text | true\nE-mail | email | true\nTelefonní číslo | text | false\nAkutní popis situace (bez osobních údajů třetích osob) | textarea | true',
          submitButtonText: 'Odeslat žádost mentorovi',
          successMessage: 'Vaše žádost byla doručena. Náš mentor se vám ozve v nejkratší možné době.',
        },
      },
      {
        type: 'CallToAction',
        props: {
          title: 'Potřebujete vyhledat konkrétní rozsudek Ústavního soudu?',
          description: 'Prohledejte naši databázi judikátů nebo se zeptejte v komunitním fóru.',
          buttonText: 'Vstoupit do Fóra',
          buttonUrl: '/forum',
          variant: 'primary',
        },
      },
    ],
    root: { props: { title: 'Krizová Karta & SOS Poradna' } },
  }),
};
