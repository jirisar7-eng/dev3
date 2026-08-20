import React from 'react';
import { SeoHead } from './SeoHead';
import { Handshake, Server, Globe, ShieldCheck, ArrowUpRight, MapPin, Building2 } from 'lucide-react';

interface SponsorItem {
  id: string;
  name: string;
  tier: string;
  badge: string;
  description: string;
  website: string;
  websiteUrl: string;
  location: string;
  isPrimary: boolean;
  slug: string;
}

const SPONSORS_DATA: SponsorItem[] = [
  {
    id: 'algotech',
    name: 'ALGOTECH a.s.',
    tier: 'Sponzor Cloud VPS',
    badge: '★ Nejdůležitější sponzor',
    description: 'Společnost ALGOTECH a.s. se stala třetím klíčovým sponzorem projektu a poskytla bezplatný vysokovýkonný Cloud VPS server pro spolehlivý chod backendových mikroslužeb, databází a AI asistentů.',
    website: 'ALGOTECH.cz',
    websiteUrl: 'https://www.algotech.cz',
    location: 'Česko / Praha',
    isPrimary: true,
    slug: 'algotech-sponzor-cloud-vps',
  },
  {
    id: 'vedos',
    name: 'VEDOS Internet, a.s.',
    tier: 'Sponzor Webhostingu',
    badge: '★ Webhosting NoLimit',
    description: 'Společnost VEDOS Internet, a.s. poskytla projektu „Táta má právo“ bezplatnou technologickou podporu a profesionální webhosting NoLimit pro rychlý, bezpečný a stabilní chod.',
    website: 'VEDOS.cz',
    websiteUrl: 'https://www.vedos.cz',
    location: 'Česko / Hluboká n. Vlt.',
    isPrimary: false,
    slug: 'vedos-sponzor-hosting',
  },
  {
    id: 'forpsi',
    name: 'FORPSI (Internet CZ, a.s.)',
    tier: 'Sponzor Domény',
    badge: '★ Doména tatovacesta.cz',
    description: 'Společnost FORPSI (Internet CZ, a.s.) se stala oficiálním sponzorem doménové infrastruktury a věnovala bezplatnou registraci domény tatovacesta.cz pro náš projekt.',
    website: 'FORPSI.com',
    websiteUrl: 'https://www.forpsi.com',
    location: 'Česko / Ktiš',
    isPrimary: false,
    slug: 'forpsi-partner-domeny',
  }
];

export const PartnersView: React.FC = () => {
  return (
    <div className="py-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10 animate-in fade-in duration-500">
      <SeoHead
        title="Partneři a sponzoři • Táta má právo"
        description="Představujeme partnery a sponzory, díky kterým můžeme udržovat portál Táta má právo v chodu."
        canonicalPath="/sponzori"
      />

      <div className="text-center max-w-3xl mx-auto space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-700 font-bold text-xs uppercase tracking-wider">
          <Handshake className="w-4 h-4" />
          <span>Naši partneři a sponzoři</span>
        </div>
        <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">
          Podporují nás
        </h1>
        <p className="text-sm md:text-base text-slate-600 leading-relaxed">
          Zajištění dostupnosti poradenských materiálů, článků a vzorů právních podání 24 hodin denně, 7 dní v týdnu je pro otce v krizových situacích klíčové. Děkujeme těmto technologickým partnerům za jejich podporu, bez kterých by tento portál nemohl existovat.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
        {SPONSORS_DATA.map((sponsor) => {
          let IconComponent = Building2;
          if (sponsor.id === 'algotech') IconComponent = Server;
          if (sponsor.id === 'vedos') IconComponent = Globe;
          if (sponsor.id === 'forpsi') IconComponent = ShieldCheck;

          return (
            <div
              key={sponsor.id}
              className={`bg-white rounded-2xl border p-6 flex flex-col justify-between transition-all duration-300 relative ${
                sponsor.isPrimary
                  ? 'border-amber-300 shadow-md ring-1 ring-amber-200/50 hover:shadow-lg'
                  : 'border-slate-200 shadow-sm hover:shadow-md'
              }`}
            >
              {sponsor.isPrimary && (
                <div className="absolute top-0 right-0 bg-amber-500 text-white text-[10px] font-black uppercase px-3 py-1 rounded-bl-xl tracking-wider">
                  Nejdůležitější sponzor
                </div>
              )}

              <div>
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-5 border ${
                  sponsor.isPrimary
                    ? 'bg-amber-50 text-amber-700 border-amber-100'
                    : 'bg-slate-50 text-blue-600 border-slate-100'
                }`}>
                  <IconComponent className="w-6 h-6" />
                </div>

                <div className="space-y-1 mb-3">
                  <h3 className="text-lg font-bold text-slate-900 leading-snug">
                    {sponsor.name}
                  </h3>
                  <div className="flex flex-col gap-1">
                    <span className={`text-xs font-semibold ${sponsor.isPrimary ? 'text-amber-800' : 'text-slate-500'}`}>
                      {sponsor.tier}
                    </span>
                    <span className="text-[11px] font-bold text-emerald-600">
                      {sponsor.badge}
                    </span>
                  </div>
                </div>

                <p className="text-sm text-slate-600 mb-6 leading-relaxed">
                  {sponsor.description}
                </p>

                <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-6 font-medium">
                  <MapPin className="w-3.5 h-3.5" />
                  <span>{sponsor.location}</span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                <a
                  href={sponsor.websiteUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs font-bold text-slate-700 hover:text-slate-950 transition-colors"
                >
                  <span>{sponsor.website}</span>
                  <ArrowUpRight className="w-3 h-3" />
                </a>

                <a
                  href={`/clanky/${sponsor.slug}`}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-800 transition-colors"
                >
                  <span>Celý článek</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
