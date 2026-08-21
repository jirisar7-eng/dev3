import { prisma } from '../src/lib/prisma';

export const helpArticles = [
  {
    slug: 'jak-zacit-s-aplikaci',
    title: 'Jak začít s aplikací',
    summary: 'Základní průvodce nastavením účtu a prvními kroky v aplikaci Táta má právo.',
    content: 'Vítejte v aplikaci Táta má právo. Pro začátek si prosím vyplňte profil, abychom vám mohli lépe pomoci s vaším případem. V sekci Můj případ můžete začít evidovat své dokumenty a poznámky.',
    categoryName: 'help-start'
  },
  {
    slug: 'jak-pracovat-s-dokumenty',
    title: 'Jak pracovat s dokumenty',
    summary: 'Návod k nahrávání a správě právních dokumentů a složek.',
    content: 'Dokumenty můžete nahrávat v sekci Můj případ -> Dokumenty. Podporujeme formáty PDF, DOCX a obrázky. Ke každému dokumentu můžete přidat štítky a poznámky pro snadnější vyhledávání.',
    categoryName: 'help-cases'
  },
  {
    slug: 'jak-evidovat-dukazy',
    title: 'Jak evidovat důkazy',
    summary: 'Správný postup pro evidenci a kategorizaci důkazních materiálů.',
    content: 'Evidujte důkazy chronologicky. Pokud jde o komunikaci, doporučujeme ukládat screenshoty i textové exporty. Každý důkaz jasně pojmenujte a připojte datum jeho vzniku.',
    categoryName: 'help-cases'
  },
  {
    slug: 'co-parent-hub',
    title: 'Jak používat Co-Parent Hub',
    summary: 'Sdílení informací s druhým rodičem, kalendář a komunikace.',
    content: 'Co-Parent Hub slouží k bezpečné a transparentní komunikaci s druhým rodičem. Můžete zde sdílet kalendář péče, výdaje a důležité dokumenty týkající se dítěte. Vše se zaznamenává s časovým razítkem.',
    categoryName: 'help-start'
  },
  {
    slug: 'sos-plan',
    title: 'Jak používat SOS plán',
    summary: 'Rychlá pomoc a postup v krizových situacích.',
    content: 'V případě nouze (např. neuskutečněné předání dítěte, ohrožení zdraví) otevřete SOS plán. Najdete zde rychlé kontakty na OSPOD, policii a krizová centra. Vždy jednejte s klidem a vše dokumentujte.',
    categoryName: 'help-support'
  },
  {
    slug: 'ai-nastroje',
    title: 'Jak používat AI nástroje',
    summary: 'Využití AI pro analýzu případu a generování podání.',
    content: 'Náš AI asistent vám pomůže s návrhy dokumentů (např. návrh na úpravu styku, stížnost). Vyplňte co nejvíce informací a AI vygeneruje základní koncept, který si před podáním na soud vždy pečlivě zkontrolujte.',
    categoryName: 'help-ai'
  },
  {
    slug: 'judikatura',
    title: 'Jak používat judikaturu',
    summary: 'Vyhledávání v relevantních soudních rozhodnutích.',
    content: 'V sekci Právo a judikatura můžete vyhledávat rozhodnutí Ústavního soudu a dalších soudů týkající se rodinného práva. Pro inspiraci k argumentaci zadejte klíčová slova týkající se vaší situace (např. "střídavá péče", "odcizení").',
    categoryName: 'help-start'
  },
  {
    slug: 'faq-podpora',
    title: 'FAQ - Nejčastější dotazy',
    summary: 'Odpovědi na nejčastější dotazy k používání aplikace.',
    content: 'Zde najdete odpovědi na časté otázky ohledně předplatného, smazání účtu, zabezpečení dat a exportu dokumentů. Pokud nenajdete odpověď, kontaktujte naši podporu přes vytvoření tiketu.',
    categoryName: 'help-support'
  }
];

export const newsItems = [
  {
    title: 'Spuštění sekce Právní asistent',
    summary: 'Představujeme nový nástroj pro generování dokumentů pomocí AI.',
    content: 'Náš nový AI asistent vám pomůže rychle vygenerovat základní osnovy pro podání na soud nebo komunikaci s OSPOD. K dispozici je pro všechny uživatele s aktivním profilem.',
    date: new Date('2026-08-15T10:00:00Z'),
    category: 'projekt',
    tags: ['AI', 'funkce', 'novinka'],
    published: true,
  },
  {
    title: 'Aktualizace soudní judikatury 2026',
    summary: 'Do naší databáze byla přidána nejnovější rozhodnutí Ústavního soudu ohledně střídavé péče.',
    content: 'Soudní praxe se vyvíjí. Přidali jsme více než 50 nových nálezů Ústavního soudu, které posilují právo na rovnoprávné rodičovství a střídavou péči jako výchozí řešení.',
    date: new Date('2026-08-10T14:30:00Z'),
    category: 'judikatura',
    source: 'Ústavní soud ČR',
    url: 'https://nalus.usoud.cz',
    tags: ['judikatura', 'střídavá péče', 'právo'],
    published: true,
  },
  {
    title: 'Metodika OSPOD a práva otců',
    summary: 'Vydali jsme nový metodický pokyn, jak komunikovat s OSPOD a bránit se neobjektivnímu přístupu.',
    content: 'Komunikace s orgány sociálně-právní ochrany dětí může být náročná. Připravili jsme podrobný návod, na co máte jako rodič právo a jak postupovat v případě podjatosti.',
    date: new Date('2026-08-01T09:15:00Z'),
    category: 'metodika',
    tags: ['OSPOD', 'práva', 'metodika'],
    published: true,
  },
  {
    title: 'Změny v občanském zákoníku 2026',
    summary: 'Novela občanského zákoníku přináší důležité změny v oblasti rodinného práva.',
    content: 'Shrnutí nejdůležitějších změn, které přinesla letošní novela občanského zákoníku (zákon č. 89/2012 Sb.). Změny se týkají především výpočtu výživného a definice domácího násilí.',
    date: new Date('2026-07-20T11:00:00Z'),
    category: 'legislativa',
    source: 'Sbírka zákonů',
    url: 'https://www.zakonyprolidi.cz',
    tags: ['legislativa', 'výživné', 'zákon'],
    published: true,
  }
];

export async function runHelpNewsSeed() {
  console.log('[Prisma Seed] Spouštím seedování News a Help Center...');

  try {
    for (const article of helpArticles) {
      await prisma.article.upsert({
        where: { slug: article.slug },
        update: {
          title: article.title,
          summary: article.summary,
          content: article.content,
          categoryName: article.categoryName,
        },
        create: {
          slug: article.slug,
          title: article.title,
          summary: article.summary,
          content: article.content,
          categoryName: article.categoryName,
          published: true,
        },
      });
    }
    console.log(`[Prisma Seed] Úspěšně naseedováno ${helpArticles.length} Help Center článků.`);

    for (const news of newsItems) {
      const existing = await prisma.newsItem.findFirst({
        where: { title: news.title }
      });
      if (existing) {
        await prisma.newsItem.update({
          where: { id: existing.id },
          data: {
            summary: news.summary,
            content: news.content,
            category: news.category,
            date: news.date,
            source: news.source,
            url: news.url,
            tags: news.tags,
          }
        });
      } else {
        await prisma.newsItem.create({
          data: news
        });
      }
    }
    console.log(`[Prisma Seed] Úspěšně naseedováno ${newsItems.length} News položek.`);
  } catch (error) {
    console.error('[Prisma Seed] Chyba při seedování News a Help:', error);
  }
}

// Support direct run
if (process.argv[1]?.endsWith('seed-help-news.ts')) {
  runHelpNewsSeed()
    .then(() => {
      console.log('[Prisma Seed CLI] Dokončeno.');
      process.exit(0);
    })
    .catch((err) => {
      console.error('[Prisma Seed CLI Error]:', err);
      process.exit(1);
    });
}
