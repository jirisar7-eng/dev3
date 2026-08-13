import dotenv from 'dotenv';
dotenv.config();

import { prisma, isPrismaAvailable } from '../src/db/prisma';
import { dbStore } from '../src/services/dbStore';
import { ensureSuperAdminAccount } from '../src/services/seedService';

export const realSubjektyData = [
  // --- OKRESNÍ / OBVODNÍ SOUDY ---
  {
    type: 'SOUD',
    name: 'Okresní soud v Pardubicích',
    position: 'Opatrovnický úsek',
    institution: 'Okresní soud',
    city: 'Pardubice',
    region: 'Pardubický kraj',
    address: 'Na Tříslovisšti 2034, 530 02 Pardubice',
    email: 'podatelna@osoud.pce.justice.cz',
    phone: '+420 466 023 111',
    website: 'https://www.justice.cz',
    isVerified: true,
  },
  {
    type: 'SOUD',
    name: 'Okresní soud v Hradci Králové',
    position: 'Opatrovnické oddělení',
    institution: 'Okresní soud',
    city: 'Hradec Králové',
    region: 'Královéhradecký kraj',
    address: 'Ignáta Herrmanna 227, 501 28 Hradec Králové',
    email: 'podatelna@osoud.hrk.justice.cz',
    phone: '+420 495 010 111',
    website: 'https://www.justice.cz',
    isVerified: true,
  },
  {
    type: 'SOUD',
    name: 'Obvodní soud pro Prahu 1',
    position: 'Opatrovnický úsek',
    institution: 'Obvodní soud',
    city: 'Praha',
    region: 'Hlavní město Praha',
    address: 'Ovocný trh 587/14, 110 00 Praha 1',
    email: 'podatelna@osoud.pha1.justice.cz',
    phone: '+420 221 093 111',
    website: 'https://www.justice.cz',
    isVerified: true,
  },
  {
    type: 'SOUD',
    name: 'Obvodní soud pro Prahu 2',
    position: 'Opatrovnické oddělení',
    institution: 'Obvodní soud',
    city: 'Praha',
    region: 'Hlavní město Praha',
    address: 'Francouzská 808/19, 120 00 Praha 2',
    email: 'podatelna@osoud.pha2.justice.cz',
    phone: '+420 221 552 111',
    website: 'https://www.justice.cz',
    isVerified: true,
  },
  {
    type: 'SOUD',
    name: 'Obvodní soud pro Prahu 3',
    position: 'Opatrovnický úsek',
    institution: 'Obvodní soud',
    city: 'Praha',
    region: 'Hlavní město Praha',
    address: 'Jagellonská 1062/5, 130 00 Praha 3',
    email: 'podatelna@osoud.pha3.justice.cz',
    phone: '+420 221 416 111',
    website: 'https://www.justice.cz',
    isVerified: true,
  },
  {
    type: 'SOUD',
    name: 'Obvodní soud pro Prahu 4',
    position: 'Opatrovnické oddělení',
    institution: 'Obvodní soud',
    city: 'Praha',
    region: 'Hlavní město Praha',
    address: '28. pluku 1533/29b, 100 83 Praha 10',
    email: 'podatelna@osoud.pha4.justice.cz',
    phone: '+420 221 553 111',
    website: 'https://www.justice.cz',
    isVerified: true,
  },
  {
    type: 'SOUD',
    name: 'Obvodní soud pro Prahu 5',
    position: 'Opatrovnický úsek',
    institution: 'Obvodní soud',
    city: 'Praha',
    region: 'Hlavní město Praha',
    address: 'Náměstí Kinských 602/2, 150 00 Praha 5',
    email: 'podatelna@osoud.pha5.justice.cz',
    phone: '+420 257 005 111',
    website: 'https://www.justice.cz',
    isVerified: true,
  },
  {
    type: 'SOUD',
    name: 'Obvodní soud pro Prahu 6',
    position: 'Opatrovnické oddělení',
    institution: 'Obvodní soud',
    city: 'Praha',
    region: 'Hlavní město Praha',
    address: '28. pluku 1533/29b, 100 83 Praha 10',
    email: 'podatelna@osoud.pha6.justice.cz',
    phone: '+420 221 555 111',
    website: 'https://www.justice.cz',
    isVerified: true,
  },
  {
    type: 'SOUD',
    name: 'Obvodní soud pro Prahu 7',
    position: 'Opatrovnický úsek',
    institution: 'Obvodní soud',
    city: 'Praha',
    region: 'Hlavní město Praha',
    address: 'Ovocný trh 587/14, 110 00 Praha 1',
    email: 'podatelna@osoud.pha7.justice.cz',
    phone: '+420 221 093 777',
    website: 'https://www.justice.cz',
    isVerified: true,
  },
  {
    type: 'SOUD',
    name: 'Obvodní soud pro Prahu 8',
    position: 'Opatrovnické oddělení',
    institution: 'Obvodní soud',
    city: 'Praha',
    region: 'Hlavní město Praha',
    address: 'Justiční areál Na Míčánkách, 28. pluku 1533/29b, 100 83 Praha 10',
    email: 'podatelna@osoud.pha8.justice.cz',
    phone: '+420 221 558 111',
    website: 'https://www.justice.cz',
    isVerified: true,
  },
  {
    type: 'SOUD',
    name: 'Obvodní soud pro Prahu 9',
    position: 'Opatrovnický úsek',
    institution: 'Obvodní soud',
    city: 'Praha',
    region: 'Hlavní město Praha',
    address: '28. pluku 1533/29b, 100 83 Praha 10',
    email: 'podatelna@osoud.pha9.justice.cz',
    phone: '+420 221 559 111',
    website: 'https://www.justice.cz',
    isVerified: true,
  },
  {
    type: 'SOUD',
    name: 'Obvodní soud pro Prahu 10',
    position: 'Opatrovnické oddělení',
    institution: 'Obvodní soud',
    city: 'Praha',
    region: 'Hlavní město Praha',
    address: '28. pluku 1533/29b, 100 83 Praha 10',
    email: 'podatelna@osoud.pha10.justice.cz',
    phone: '+420 221 551 000',
    website: 'https://www.justice.cz',
    isVerified: true,
  },
  {
    type: 'SOUD',
    name: 'Městský soud v Brně',
    position: 'Opatrovnický úsek',
    institution: 'Městský soud',
    city: 'Brno',
    region: 'Jihomoravský kraj',
    address: 'Polní 994/9, 608 01 Brno',
    email: 'podatelna@msoud.brn.justice.cz',
    phone: '+420 546 511 111',
    website: 'https://www.justice.cz',
    isVerified: true,
  },
  {
    type: 'SOUD',
    name: 'Okresní soud v Ostravě',
    position: 'Opatrovnické oddělení',
    institution: 'Okresní soud',
    city: 'Ostrava',
    region: 'Moravskoslezský kraj',
    address: 'U Soudu 6187/4, 708 00 Ostrava-Poruba',
    email: 'podatelna@osoud.ova.justice.cz',
    phone: '+420 596 972 111',
    website: 'https://www.justice.cz',
    isVerified: true,
  },
  {
    type: 'SOUD',
    name: 'Okresní soud v Olomouci',
    position: 'Opatrovnické oddělení',
    institution: 'Okresní soud',
    city: 'Olomouc',
    region: 'Olomoucký kraj',
    address: 'Tř. Svobody 685/16, 771 16 Olomouc',
    email: 'podatelna@osoud.olc.justice.cz',
    phone: '+420 585 512 111',
    website: 'https://www.justice.cz',
    isVerified: true,
  },
  {
    type: 'SOUD',
    name: 'Okresní soud Plzeň-město',
    position: 'Opatrovnický úsek',
    institution: 'Okresní soud',
    city: 'Plzeň',
    region: 'Plzeňský kraj',
    address: 'Nádražní 587/21, 306 17 Plzeň',
    email: 'podatelna@osoud.plzm.justice.cz',
    phone: '+420 377 868 111',
    website: 'https://www.justice.cz',
    isVerified: true,
  },
  {
    type: 'SOUD',
    name: 'Okresní soud v Českých Budějovicích',
    position: 'Opatrovnické oddělení',
    institution: 'Okresní soud',
    city: 'České Budějovice',
    region: 'Jihočeský kraj',
    address: 'Lidická tř. 132/20, 370 01 České Budějovice',
    email: 'podatelna@osoud.cbu.justice.cz',
    phone: '+420 386 798 111',
    website: 'https://www.justice.cz',
    isVerified: true,
  },
  {
    type: 'SOUD',
    name: 'Okresní soud v Liberci',
    position: 'Opatrovnický úsek',
    institution: 'Okresní soud',
    city: 'Liberec',
    region: 'Liberecký kraj',
    address: 'U Soudu 540/3, 460 01 Liberec',
    email: 'podatelna@osoud.lbc.justice.cz',
    phone: '+420 485 221 111',
    website: 'https://www.justice.cz',
    isVerified: true,
  },
  {
    type: 'SOUD',
    name: 'Okresní soud v Ústí nad Labem',
    position: 'Opatrovnické oddělení',
    institution: 'Okresní soud',
    city: 'Ústí nad Labem',
    region: 'Ústecký kraj',
    address: 'Kramoly 641/31, 400 01 Ústí nad Labem',
    email: 'podatelna@osoud.unl.justice.cz',
    phone: '+420 475 247 111',
    website: 'https://www.justice.cz',
    isVerified: true,
  },
  {
    type: 'SOUD',
    name: 'Okresní soud ve Zlíně',
    position: 'Opatrovnický úsek',
    institution: 'Okresní soud',
    city: 'Zlín',
    region: 'Zlínský kraj',
    address: 'Dlouhá 100, 760 01 Zlín',
    email: 'podatelna@osoud.zln.justice.cz',
    phone: '+420 577 004 111',
    website: 'https://www.justice.cz',
    isVerified: true,
  },
  {
    type: 'SOUD',
    name: 'Okresní soud v Jihlavě',
    position: 'Opatrovnické oddělení',
    institution: 'Okresní soud',
    city: 'Jihlava',
    region: 'Kraj Vysočina',
    address: 'Husova 1639/47, 586 01 Jihlava',
    email: 'podatelna@osoud.jhl.justice.cz',
    phone: '+420 567 101 111',
    website: 'https://www.justice.cz',
    isVerified: true,
  },
  {
    type: 'SOUD',
    name: 'Okresní soud v Karlových Varech',
    position: 'Opatrovnický úsek',
    institution: 'Okresní soud',
    city: 'Karlovy Vary',
    region: 'Karlovarský kraj',
    address: 'Moskevská 1009/17, 360 01 Karlovy Vary',
    email: 'podatelna@osoud.kva.justice.cz',
    phone: '+420 353 301 111',
    website: 'https://www.justice.cz',
    isVerified: true,
  },

  // --- PRACOVIŠTĚ OSPOD ---
  {
    type: 'OSPOD',
    name: 'OSPOD Magistrátu města Pardubic',
    position: 'Oddělení sociálně-právní ochrany dětí',
    institution: 'Magistrát města Pardubic',
    city: 'Pardubice',
    region: 'Pardubický kraj',
    address: 'Pernštýnské náměstí 1, 530 21 Pardubice',
    email: 'posta@mmp.cz',
    phone: '+420 466 859 111',
    website: 'https://www.pardubice.eu',
    isVerified: true,
  },
  {
    type: 'OSPOD',
    name: 'OSPOD Magistrátu města Hradec Králové',
    position: 'Oddělení sociálně-právní ochrany dětí',
    institution: 'Magistrát města Hradec Králové',
    city: 'Hradec Králové',
    region: 'Královéhradecký kraj',
    address: 'Čs. armády 408, 502 00 Hradec Králové',
    email: 'posta@mmhk.cz',
    phone: '+420 495 707 111',
    website: 'https://www.hradeckralove.org',
    isVerified: true,
  },
  {
    type: 'OSPOD',
    name: 'OSPOD ÚMČ Praha 1',
    position: 'Oddělení sociálně-právní ochrany dětí',
    institution: 'Úřad městské části Praha 1',
    city: 'Praha',
    region: 'Hlavní město Praha',
    address: 'Vodičkova 32, 115 68 Praha 1',
    email: 'posta@praha1.cz',
    phone: '+420 221 097 111',
    website: 'https://www.praha1.cz',
    isVerified: true,
  },
  {
    type: 'OSPOD',
    name: 'OSPOD ÚMČ Praha 4',
    position: 'Oddělení sociálně-právní ochrany dětí',
    institution: 'Úřad městské části Praha 4',
    city: 'Praha',
    region: 'Hlavní město Praha',
    address: 'Antala Staška 2059/80b, 140 46 Praha 4',
    email: 'ospod@praha4.cz',
    phone: '+420 261 192 111',
    website: 'https://www.praha4.cz',
    isVerified: true,
  },
  {
    type: 'OSPOD',
    name: 'OSPOD ÚMČ Praha 8',
    position: 'Oddělení sociálně-právní ochrany dětí',
    institution: 'Úřad městské části Praha 8',
    city: 'Praha',
    region: 'Hlavní město Praha',
    address: 'Zenklova 35, 180 48 Praha 8',
    email: 'podatelna@praha8.cz',
    phone: '+420 222 805 111',
    website: 'https://www.praha8.cz',
    isVerified: true,
  },
  {
    type: 'OSPOD',
    name: 'OSPOD ÚMČ Praha 10',
    position: 'Oddělení sociálně-právní ochrany dětí',
    institution: 'Úřad městské části Praha 10',
    city: 'Praha',
    region: 'Hlavní město Praha',
    address: 'Vršovická 1429/68, 101 38 Praha 10',
    email: 'posta@praha10.cz',
    phone: '+420 272 084 111',
    website: 'https://www.praha10.cz',
    isVerified: true,
  },
  {
    type: 'OSPOD',
    name: 'OSPOD Magistrátu města Brna',
    position: 'Oddělení sociálně-právní ochrany dětí',
    institution: 'Magistrát města Brna',
    city: 'Brno',
    region: 'Jihomoravský kraj',
    address: 'Malinovského nám. 3, 601 67 Brno',
    email: 'posta@brno.cz',
    phone: '+420 542 171 111',
    website: 'https://www.brno.cz',
    isVerified: true,
  },
  {
    type: 'OSPOD',
    name: 'OSPOD Magistrátu města Ostravy',
    position: 'Oddělení sociálně-právní ochrany dětí',
    institution: 'Magistrát města Ostravy',
    city: 'Ostrava',
    region: 'Moravskoslezský kraj',
    address: 'Prokešovo náměstí 1803/8, 729 30 Ostrava',
    email: 'info@ostrava.cz',
    phone: '+420 599 444 444',
    website: 'https://www.ostrava.cz',
    isVerified: true,
  },
  {
    type: 'OSPOD',
    name: 'OSPOD Magistrátu města Olomouce',
    position: 'Oddělení sociálně-právní ochrany dětí',
    institution: 'Magistrát města Olomouce',
    city: 'Olomouc',
    region: 'Olomoucký kraj',
    address: 'Hynaisova 10, 779 11 Olomouc',
    email: 'podatelna@olomouc.eu',
    phone: '+420 585 513 111',
    website: 'https://www.olomouc.eu',
    isVerified: true,
  },
  {
    type: 'OSPOD',
    name: 'OSPOD Magistrátu města Plzně',
    position: 'Oddělení sociálně-právní ochrany dětí',
    institution: 'Magistrát města Plzně',
    city: 'Plzeň',
    region: 'Plzeňský kraj',
    address: 'Martinská 2, 306 32 Plzeň',
    email: 'posta@plzen.eu',
    phone: '+420 378 031 111',
    website: 'https://www.plzen.eu',
    isVerified: true,
  },
  {
    type: 'OSPOD',
    name: 'OSPOD Magistrátu města České Budějovice',
    position: 'Oddělení sociálně-právní ochrany dětí',
    institution: 'Magistrát města České Budějovice',
    city: 'České Budějovice',
    region: 'Jihočeský kraj',
    address: 'Nám. Přemysla Otakara II. 1/1, 370 92 České Budějovice',
    email: 'podatelna@c-budejovice.cz',
    phone: '+420 386 801 111',
    website: 'https://www.c-budejovice.cz',
    isVerified: true,
  },
  {
    type: 'OSPOD',
    name: 'OSPOD Magistrátu města Liberec',
    position: 'Oddělení sociálně-právní ochrany dětí',
    institution: 'Magistrát města Liberec',
    city: 'Liberec',
    region: 'Liberecký kraj',
    address: 'Nám. Dr. E. Beneše 1/1, 460 59 Liberec',
    email: 'info@magistrat.liberec.cz',
    phone: '+420 485 243 111',
    website: 'https://www.liberec.cz',
    isVerified: true,
  },
  {
    type: 'OSPOD',
    name: 'OSPOD Magistrátu města Ústí nad Labem',
    position: 'Oddělení sociálně-právní ochrany dětí',
    institution: 'Magistrát města Ústí nad Labem',
    city: 'Ústí nad Labem',
    region: 'Ústecký kraj',
    address: 'Velká Hradební 2336/8, 400 01 Ústí nad Labem',
    email: 'podatelna@mestecko.cz',
    phone: '+420 475 271 111',
    website: 'https://www.usti-nad-labem.cz',
    isVerified: true,
  },
  {
    type: 'OSPOD',
    name: 'OSPOD Magistrátu města Zlína',
    position: 'Oddělení sociálně-právní ochrany dětí',
    institution: 'Magistrát města Zlína',
    city: 'Zlín',
    region: 'Zlínský kraj',
    address: 'Náměstí Míru 12, 760 01 Zlín',
    email: 'podatelna@zlin.eu',
    phone: '+420 577 630 111',
    website: 'https://www.zlin.eu',
    isVerified: true,
  },

  // --- KRIZOVÁ CENTRA & RODINNÉ PORADNY ---
  {
    type: 'PORADNA_CHARITA',
    name: 'Centrum LOCIKA, z.ú.',
    position: 'Centrum pro děti ohrožené domácím násilím',
    institution: 'LOCIKA z.ú.',
    city: 'Praha',
    region: 'Hlavní město Praha',
    address: 'U Průhonu 1588/12, 170 00 Praha 7',
    email: 'info@centrumlocika.cz',
    phone: '+420 734 441 233',
    website: 'https://www.centrumlocika.cz',
    isVerified: true,
  },
  {
    type: 'PORADNA_CHARITA',
    name: 'Krizové centrum Pardubice',
    position: 'Krizová intervence a rodinné poradenství',
    institution: 'SKP CENTRUM, o.p.s.',
    city: 'Pardubice',
    region: 'Pardubický kraj',
    address: 'Erno Košťála 981, 530 12 Pardubice',
    email: 'krizovecentrum@skpcentrum.cz',
    phone: '+420 466 303 123',
    website: 'https://www.skpcentrum.cz',
    isVerified: true,
  },
  {
    type: 'PORADNA_CHARITA',
    name: 'Dětské krizové centrum Praha',
    position: 'Ambulantní péče a krizová linka pro děti a rodiče',
    institution: 'Dětské krizové centrum, z.ú.',
    city: 'Praha',
    region: 'Hlavní město Praha',
    address: 'Vážská 1429/4, 142 00 Praha 4',
    email: 'dkc@dkc.cz',
    phone: '+420 241 480 511',
    website: 'https://www.dkc.cz',
    isVerified: true,
  },
  {
    type: 'PORADNA_CHARITA',
    name: 'Linka první psychické pomoci',
    position: 'Krizová linka a odborné sociálně-právní poradenství',
    institution: 'Cesta z krize z.ú.',
    city: 'Praha',
    region: 'Hlavní město Praha',
    address: 'Šimůnkova 1600/5, 182 00 Praha 8',
    email: 'info@cestazkrize.cz',
    phone: '116 123',
    website: 'https://www.linkaprvnipsychickepomoci.cz',
    isVerified: true,
  },
  {
    type: 'PORADNA_CHARITA',
    name: 'Poradna pro rodinu Pardubického kraje',
    position: 'Manželské a rodinné poradenství',
    institution: 'Příspěvková organizace Pardubického kraje',
    city: 'Pardubice',
    region: 'Pardubický kraj',
    address: 'Sukova třída 1260, 530 02 Pardubice',
    email: 'poradna@poradnapk.cz',
    phone: '+420 466 535 010',
    website: 'https://www.poradnapk.cz',
    isVerified: true,
  },
  {
    type: 'PORADNA_CHARITA',
    name: 'Centrum pro rodinu a sociální péči Brno',
    position: 'Rodinná mediace a poradenství',
    institution: 'CRSP Brno',
    city: 'Brno',
    region: 'Jihomoravský kraj',
    address: 'Josefská 1, 602 00 Brno',
    email: 'crsp@crsp.cz',
    phone: '+420 542 211 860',
    website: 'https://www.crsp.cz',
    isVerified: true,
  },
  {
    type: 'PORADNA_CHARITA',
    name: 'Krizové centrum pro děti a rodinu v Jihočeském kraji',
    position: 'Krizová intervence, psychologie a rodinná terapie',
    institution: 'Krizové centrum ČB',
    city: 'České Budějovice',
    region: 'Jihočeský kraj',
    address: 'Klasická 8, 370 01 České Budějovice',
    email: 'krizovecentrum@krizovecentrumcb.cz',
    phone: '+420 387 313 013',
    website: 'https://www.krizovecentrumcb.cz',
    isVerified: true,
  },
];

export async function runSeed() {
  console.log('[Prisma Seed] Spouštím kompletaci výchozích CMS a registračních dat...');

  try {
    // 0. Ujistit se o existenci účtu Super Admina a rolí
    await ensureSuperAdminAccount().catch(() => {});

    if (isPrismaAvailable()) {
      // 1. POLOŽKY NAVIGACE (7 kategorií, 33 modulů portálu + Domů)
      console.log('[Prisma Seed] Seedování položek navigace...');
      await prisma.navigationItem.deleteMany({}); // Vyčištění staré navigace

      // Samostatné tlačítko Domů
      await prisma.navigationItem.create({
        data: { id: 'nav-1', labelKey: 'Domů', url: '/', order: 1, target: '_self', isExternal: false },
      });

      const categoriesNav = [
        {
          id: 'cat-1',
          labelKey: '🚨 Krizová pomoc & Komunita',
          url: '#',
          order: 10,
          subItems: [
            { id: 'sub-1-1', labelKey: 'SOS plán', url: '/crisis', order: 11 },
            { id: 'sub-1-2', labelKey: 'Fórum', url: '/forum', order: 12 },
            { id: 'sub-1-3', labelKey: 'Příběhy', url: '/stories', order: 13 },
            { id: 'sub-1-4', labelKey: 'Memento', url: '/memento', order: 14 },
            { id: 'sub-1-5', labelKey: 'Právní poradna', url: '/advice', order: 15 },
            { id: 'sub-1-6', labelKey: 'Podpora', url: '/support', order: 16 },
          ],
        },
        {
          id: 'cat-2',
          labelKey: '⚖️ Opatrovnictví & Právo',
          url: '#',
          order: 20,
          subItems: [
            { id: 'sub-2-1', labelKey: 'Agenda', url: '/opatrovnicka-agenda', order: 21 },
            { id: 'sub-2-2', labelKey: 'Práva', url: '/rights', order: 22 },
            { id: 'sub-2-3', labelKey: 'Judikatura', url: '/judikatura', order: 23 },
            { id: 'sub-2-4', labelKey: 'Dokumenty', url: '/ke-stazeni', order: 24 },
            { id: 'sub-2-5', labelKey: 'Registr Subjektů', url: '/registr-subjektu', order: 25 },
          ],
        },
        {
          id: 'cat-3',
          labelKey: '🏛️ Státní data',
          url: '#',
          order: 30,
          subItems: [
            { id: 'sub-3-1', labelKey: 'e-Sbírka', url: '/state-laws', order: 31 },
            { id: 'sub-3-2', labelKey: 'Statistiky', url: '/state-statistics', order: 32 },
            { id: 'sub-3-3', labelKey: 'Databáze', url: '/pripadova-databaze', order: 33 },
          ],
        },
        {
          id: 'cat-4',
          labelKey: '🎓 Akademie',
          url: '#',
          order: 40,
          subItems: [
            { id: 'sub-4-1', labelKey: 'Studia', url: '/knihovna-studii', order: 41 },
            { id: 'sub-4-2', labelKey: 'Videotéka', url: '/videoteka', order: 42 },
            { id: 'sub-4-3', labelKey: 'Kvízy', url: '/vzdelavani', order: 43 },
            { id: 'sub-4-4', labelKey: 'Wiki', url: '/legal-wiki', order: 44 },
            { id: 'sub-4-5', labelKey: 'Zakladatel', url: '/cesta-zakladatele', order: 45 },
          ],
        },
        {
          id: 'cat-5',
          labelKey: '📂 Pracovna',
          url: '#',
          order: 50,
          subItems: [
            { id: 'sub-5-1', labelKey: 'Složka', url: '/user-portal', order: 51 },
            { id: 'sub-5-2', labelKey: 'Profil', url: '/profile', order: 52 },
            { id: 'sub-5-3', labelKey: 'CoParent', url: '/coparent-hub', order: 53 },
          ],
        },
        {
          id: 'cat-6',
          labelKey: '🤖 AI nástroje',
          url: '#',
          order: 60,
          subItems: [
            { id: 'sub-6-1', labelKey: 'Asistent', url: '/ai-assistant', order: 61 },
            { id: 'sub-6-2', labelKey: 'Průvodce', url: '/ai-guide', order: 62 },
            { id: 'sub-6-3', labelKey: 'Case manager', url: '/ai-case-manager', order: 63 },
            { id: 'sub-6-4', labelKey: 'Simulátor', url: '/plan-pece', order: 64 },
            { id: 'sub-6-5', labelKey: 'Formuláře', url: '/centrum-formularu', order: 65 },
          ],
        },
        {
          id: 'cat-7',
          labelKey: '🛠️ Systém',
          url: '#',
          order: 70,
          subItems: [
            { id: 'sub-7-1', labelKey: 'Novinky', url: '/news', order: 71 },
            { id: 'sub-7-2', labelKey: 'Hub', url: '/synthesis-hub', order: 72 },
            { id: 'sub-7-3', labelKey: 'AI admin', url: '/ai-admin', order: 73 },
            { id: 'sub-7-4', labelKey: 'Admin', url: '/admin', order: 74 },
            { id: 'sub-7-5', labelKey: 'Context', url: '/ai-context', order: 75 },
            { id: 'sub-7-6', labelKey: 'Nápověda', url: '/user-manual', order: 76 },
            { id: 'sub-7-7', labelKey: 'Architektura', url: '/sitemap', order: 77 },
          ],
        },
      ];

      for (const cat of categoriesNav) {
        const parent = await prisma.navigationItem.create({
          data: {
            id: cat.id,
            labelKey: cat.labelKey,
            url: cat.url,
            order: cat.order,
            target: '_self',
            isExternal: false,
          },
        });

        for (const sub of cat.subItems) {
          await prisma.navigationItem.create({
            data: {
              id: sub.id,
              labelKey: sub.labelKey,
              url: sub.url,
              order: sub.order,
              target: '_self',
              isExternal: false,
              parentId: parent.id,
            },
          });
        }
      }

      // 2. STRÁNKY (`Page` & `PageSection`)
      console.log('[Prisma Seed] Seedování základních stránek a sekcí...');
      const pagesData = [
        {
          slug: 'domu',
          title: 'Domů',
          content: JSON.stringify({
            heroTitle: 'Táta má právo. Dítě má právo na oba rodiče.',
            heroSubtitle: 'Komplexní opora pro otce v opatrovnických situacích.',
            published: true,
          }),
          sections: [
            {
              sectionKey: 'hero',
              title: 'Hlavní banner',
              content: 'Táta má právo. Dítě má právo na oba rodiče.',
              order: 1,
              config: JSON.stringify({ variant: 'primary' }),
            },
            {
              sectionKey: 'about_summary',
              title: 'O projektu',
              content: 'Všechna doporučení stavíme na nejlepším zájmu dítěte.',
              order: 2,
              config: JSON.stringify({ layout: 'centered' }),
            },
          ],
        },
        {
          slug: 'crisis',
          title: 'Krizová pomoc',
          content: JSON.stringify({
            heroTitle: '🚨 Krizový Akční Plán SOS',
            heroSubtitle: 'Okamžitá pomoc v akutních krizových situacích.',
            published: true,
          }),
          sections: [
            {
              sectionKey: 'sos_banner',
              title: 'Krizový SOS plán',
              content: 'První kroky při zamezení styku nebo krizové situaci s OSPOD.',
              order: 1,
              config: JSON.stringify({ alert: true }),
            },
          ],
        },
        {
          slug: 'opatrovnicka-agenda',
          title: 'Opatrovnictví',
          content: JSON.stringify({
            heroTitle: '⚖️ Opatrovnická agenda krok za krokem',
            heroSubtitle: 'Průvodce soudním řízením a jednáním s OSPOD.',
            published: true,
          }),
          sections: [
            {
              sectionKey: 'agenda_overview',
              title: 'Přehled řízení',
              content: 'Metodické postupy pro otce v opatrovnických sporech.',
              order: 1,
              config: JSON.stringify({ layout: 'grid' }),
            },
          ],
        },
        {
          slug: 'about',
          title: 'O nás',
          content: JSON.stringify({
            heroTitle: 'O projektu Táta má právo',
            heroSubtitle: 'Naše poslání, historie a tým.',
            published: true,
          }),
          sections: [
            {
              sectionKey: 'mission',
              title: 'Naše poslání',
              content: 'Obhajoba práva dítěte na rovnocennou péči obou rodičů.',
              order: 1,
              config: JSON.stringify({ variant: 'default' }),
            },
          ],
        },
        {
          slug: 'o-nas',
          title: 'O nás',
          content: JSON.stringify({
            heroTitle: 'O projektu Táta má právo',
            heroSubtitle: 'Obhajoba rovnocenné péče.',
            published: true,
          }),
          sections: [],
        },
      ];

      for (const p of pagesData) {
        const pageRecord = await prisma.page.upsert({
          where: { slug: p.slug },
          update: {
            title: p.title,
            content: p.content,
          },
          create: {
            title: p.title,
            slug: p.slug,
            content: p.content,
          },
        });

        await prisma.pageSection.deleteMany({ where: { pageId: pageRecord.id } });

        for (const sec of p.sections) {
          await prisma.pageSection.create({
            data: {
              pageId: pageRecord.id,
              sectionKey: sec.sectionKey,
              title: sec.title,
              content: sec.content,
              order: sec.order,
              config: sec.config,
            },
          });
        }
      }

      // 3. ZÁKLADNÍ KATEGORIE A FAQ
      console.log('[Prisma Seed] Seedování kategorií článků a FAQ...');
      const defaultCategories = [
        {
          slug: 'pravo',
          name: 'Právo',
          description: 'Právní výklady, rodinné právo, soudní judikatura a vyjádření.',
          type: 'article',
        },
        {
          slug: 'psychologie',
          name: 'Psychologie',
          description: 'Dětská psychologie, vazba k rodičům, prevence syndromu zavržení.',
          type: 'article',
        },
        {
          slug: 'metodika',
          name: 'Metodika',
          description: 'Metodické návody pro jednání s OSPOD, soudy a znalci.',
          type: 'article',
        },
      ];

      for (const cat of defaultCategories) {
        await prisma.category.upsert({
          where: { slug: cat.slug },
          update: {
            name: cat.name,
            description: cat.description,
            type: cat.type,
          },
          create: cat,
        });
      }

      const faqCategory = await prisma.category.findUnique({ where: { slug: 'pravo' } });
      const defaultFaqs = [
        {
          question: 'Co dělat, když mi matka bezdůvodně odpírá styk s dítětem?',
          answer: 'Okamžitě zdokumentujte každý neuskutečněný styk (SMS, e-mail, svědectví). Podejte návrh na vydání předběžného opatření a informujte OSPOD a příslušný okresní soud.',
          categoryName: 'Právo',
          categoryId: faqCategory?.id,
          order: 1,
          published: true,
        },
        {
          question: 'Jak se počítá výživné při střídavé péči?',
          answer: 'Při střídavé péči soud určuje výživné oběma rodičům podle jejich příjmů a rozsahu péče na základě doporučujících tabulek Ministerstva spravedlnosti ČR.',
          categoryName: 'Právo',
          categoryId: faqCategory?.id,
          order: 2,
          published: true,
        },
        {
          question: 'Má otec stejná práva na informace o zdravotním stavu a škole?',
          answer: 'Ano. Pokud nebyl otec zbaven rodičovské odpovědnosti nebo mu nebyla omezená, má plné právo nahlížet do zdravotní dokumentace dítěte a komunikovat se školou.',
          categoryName: 'Právo',
          categoryId: faqCategory?.id,
          order: 3,
          published: true,
        },
      ];

      await prisma.fAQ.deleteMany({});
      for (const f of defaultFaqs) {
        await prisma.fAQ.create({
          data: f,
        });
      }

      // 4. OPATROVNICKÉ SUBJEKTY ČR (Soudy, OSPOD, Krizová centra, Poradny)
      console.log('[Prisma Seed] Seedování opatrovnických subjektů ČR...');
      for (const s of realSubjektyData) {
        const existing = await prisma.subjekt.findFirst({
          where: {
            name: s.name,
            city: s.city,
          },
        });

        if (!existing) {
          await prisma.subjekt.create({
            data: {
              type: s.type as any,
              name: s.name,
              position: s.position,
              institution: s.institution,
              city: s.city,
              region: s.region,
              address: s.address,
              email: s.email,
              phone: s.phone,
              website: s.website,
              isVerified: s.isVerified,
              avgRating: 0.0,
              reviewCount: 0,
            },
          });
        } else {
          await prisma.subjekt.update({
            where: { id: existing.id },
            data: {
              type: s.type as any,
              position: s.position,
              institution: s.institution,
              region: s.region,
              address: s.address,
              email: s.email,
              phone: s.phone,
              website: s.website,
              isVerified: s.isVerified,
            },
          });
        }
      }

      console.log('[Prisma Seed] Úspěšně naseedován výchozí CMS i Registr Subjektů v PostgreSQL!');
    } else {
      console.log('[Prisma Seed] Databáze není připojena, plním in-memory dbStore.');
    }

    // Synchronizace do in-memory dbStore
    seedInMemoryDbStore();
  } catch (err) {
    console.error('[Prisma Seed Error]:', err);
    seedInMemoryDbStore();
  }
}

function seedInMemoryDbStore() {
  dbStore.categories = [
    { id: 'cat-pravo', slug: 'pravo', name: 'Právo', description: 'Právní výklady, rodinné právo', type: 'article' },
    { id: 'cat-psychologie', slug: 'psychologie', name: 'Psychologie', description: 'Dětská psychologie', type: 'article' },
    { id: 'cat-metodika', slug: 'metodika', name: 'Metodika', description: 'Metodické návody pro OSPOD', type: 'article' },
  ];

  dbStore.faqs = [
    {
      id: 'faq-1',
      question: 'Co dělat, když mi matka bezdůvodně odpírá styk s dítětem?',
      answer: 'Okamžitě zdokumentujte každý neuskutečněný styk (SMS, e-mail, svědectví). Podejte návrh na vydání předběžného opatření a informujte OSPOD a příslušný okresní soud.',
      category: 'Právo',
      order: 1,
      published: true,
    },
    {
      id: 'faq-2',
      question: 'Jak se počítá výživné při střídavé péči?',
      answer: 'Při střídavé péči soud určuje výživné oběma rodičům podle jejich příjmů a rozsahu péče na základě doporučujících tabulek Ministerstva spravedlnosti ČR.',
      category: 'Právo',
      order: 2,
      published: true,
    },
    {
      id: 'faq-3',
      question: 'Má otec stejná práva na informace o zdravotním stavu a škole?',
      answer: 'Ano. Pokud nebyl otec zbaven rodičovské odpovědnosti nebo mu nebyla omezená, má plné právo nahlížet do zdravotní dokumentace dítěte a komunikovat se školou.',
      category: 'Právo',
      order: 3,
      published: true,
    },
  ];

  for (const s of realSubjektyData) {
    const exists = dbStore.subjekty.some((item) => item.name === s.name && item.city === s.city);
    if (!exists) {
      dbStore.subjekty.push({
        id: 'subj-' + Math.random().toString(36).substring(2, 9),
        type: s.type as any,
        name: s.name,
        position: s.position,
        institution: s.institution,
        city: s.city,
        region: s.region,
        address: s.address,
        email: s.email,
        phone: s.phone,
        website: s.website,
        avgRating: 0.0,
        reviewCount: 0,
        isVerified: s.isVerified,
        createdAt: new Date(),
        reviews: [],
      });
    }
  }
}

// Podpora přímého spuštění přes CLI (`npx prisma db seed` / `tsx prisma/seed.ts`)
if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.endsWith('seed.ts')) {
  runSeed()
    .then(() => {
      console.log('[Prisma Seed CLI] Dokončeno.');
      process.exit(0);
    })
    .catch((err) => {
      console.error('[Prisma Seed CLI Error]:', err);
      process.exit(1);
    });
}

