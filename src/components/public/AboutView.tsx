import React from 'react';
import { SeoHead } from './SeoHead';
import { Heart, Scale, Users, Target, BookOpen, CheckCircle2, ShieldCheck, Info } from 'lucide-react';

interface AboutViewProps {
  onNavigate: (path: string) => void;
}

export const AboutView: React.FC<AboutViewProps> = ({ onNavigate }) => {
  return (
    <div className="py-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12 animate-in fade-in duration-500">
      <SeoHead
        title="O projektu • Táta má právo & tatovacesta.cz"
        description="Projekt Táta má právo nevzniká proto, aby stavěl otce proti matkám. Vzniká proto, že otec má být rodičem svého dítěte."
        canonicalPath="/o-nas"
      />

      {/* Hero Section */}
      <div className="max-w-4xl mx-auto space-y-6 text-left">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 text-blue-700 font-bold text-xs uppercase tracking-wider mb-2">
          <Heart className="w-4 h-4 text-rose-500" />
          <span>O projektu</span>
        </div>
        
        <h1 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tight">
          Proč vzniká Táta má právo
        </h1>
        
        <p className="text-lg md:text-xl text-slate-700 leading-relaxed font-medium">
          Projekt <strong className="text-slate-900">Táta má právo</strong> nevzniká proto, aby stavěl otce proti matkám. Nevzniká ani proto, aby útočil na soudy, OSPOD nebo jiné instituce.
        </p>
        
        <p className="text-lg md:text-xl text-slate-700 leading-relaxed">
          Vzniká z jednoduchého důvodu:
        </p>
        
        <blockquote className="bg-blue-50/50 border-l-4 border-blue-600 p-6 rounded-r-2xl my-8 shadow-sm">
          <p className="text-2xl md:text-3xl font-black text-blue-900 tracking-tight">
            Protože otec má být rodičem svého dítěte.
          </p>
        </blockquote>
        
        <div className="space-y-4 text-slate-600 text-lg leading-relaxed">
          <p>
            Rozchod rodičů může změnit partnerský vztah. Neměl by ale automaticky znamenat konec nebo zásadní omezení vztahu mezi otcem a dítětem.
          </p>
          <p>
            Přesto se mnoho otců v okamžiku rozpadu rodiny ocitne v situaci, kterou neznají. Nevědí, jak funguje opatrovnické řízení, na co mají právo, jak komunikovat s OSPOD, jak se připravit k soudu, jak pracovat s dokumenty nebo kde najít skutečně relevantní informace.
          </p>
          <p>
            Často hledají odpovědi na internetu a místo srozumitelné pomoci nacházejí směs právních rad, osobních zkušeností, emocí a neověřených informací.
          </p>
          <p className="font-bold text-slate-900 text-xl pt-2">
            Táta má právo chce tento problém změnit.
          </p>
        </div>
      </div>

      {/* Section: Chci vytvořit místo... */}
      <div className="max-w-4xl mx-auto bg-white rounded-3xl p-8 md:p-10 border border-slate-200 shadow-sm mt-12">
        <h2 className="text-2xl md:text-3xl font-black text-slate-900 mb-6">Chci vytvořit místo, kde se otec neztratí</h2>
        <div className="text-slate-700 leading-relaxed space-y-4 text-lg">
          <p>
            Cílem projektu je vytvořit přehledný a důvěryhodný český informační portál, který otci pomůže pochopit jeho situaci.
          </p>
          <p>
            Nechci mu říkat, co má udělat bez znalosti jeho konkrétní situace.
          </p>
          <p className="font-medium text-slate-900 pb-2">
            Chci mu dát informace, díky kterým bude schopný lépe porozumět:
          </p>
          
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-6">
            <li className="flex gap-3 items-start"><CheckCircle2 className="w-6 h-6 text-emerald-500 shrink-0" /> <span className="pt-0.5">svým právům a povinnostem,</span></li>
            <li className="flex gap-3 items-start"><CheckCircle2 className="w-6 h-6 text-emerald-500 shrink-0" /> <span className="pt-0.5">potřebám svého dítěte,</span></li>
            <li className="flex gap-3 items-start"><CheckCircle2 className="w-6 h-6 text-emerald-500 shrink-0" /> <span className="pt-0.5">fungování opatrovnického řízení,</span></li>
            <li className="flex gap-3 items-start"><CheckCircle2 className="w-6 h-6 text-emerald-500 shrink-0" /> <span className="pt-0.5">práci OSPOD,</span></li>
            <li className="flex gap-3 items-start"><CheckCircle2 className="w-6 h-6 text-emerald-500 shrink-0" /> <span className="pt-0.5">soudnímu procesu,</span></li>
            <li className="flex gap-3 items-start"><CheckCircle2 className="w-6 h-6 text-emerald-500 shrink-0" /> <span className="pt-0.5">možnostem péče o dítě,</span></li>
            <li className="flex gap-3 items-start"><CheckCircle2 className="w-6 h-6 text-emerald-500 shrink-0" /> <span className="pt-0.5">významu komunikace mezi rodiči,</span></li>
            <li className="flex gap-3 items-start"><CheckCircle2 className="w-6 h-6 text-emerald-500 shrink-0" /> <span className="pt-0.5">relevantní judikatuře,</span></li>
            <li className="flex gap-3 items-start"><CheckCircle2 className="w-6 h-6 text-emerald-500 shrink-0" /> <span className="pt-0.5">odborným a vědeckým poznatkům.</span></li>
          </ul>
          
          <p className="italic text-slate-600 bg-slate-50 p-4 rounded-xl border border-slate-100 font-medium">
            Protože informovaný rodič má mnohem větší šanci dělat rozumná rozhodnutí.
          </p>
        </div>
      </div>

      {/* Thematic Cards */}
      <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Card 1 */}
        <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm space-y-4 flex flex-col">
          <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold mb-2">
            <Heart className="w-7 h-7" />
          </div>
          <h3 className="text-xl font-black text-slate-900 leading-tight">Dítě nesmí být prostředníkem konfliktu</h3>
          <div className="space-y-3 text-slate-600 flex-grow">
            <p>
              Jedním z nejdůležitějších principů projektu je, že dítě nesmí být nástrojem konfliktu mezi rodiči.
            </p>
            <p>
              Táta má právo proto nechce vytvářet další prostor pro nenávist, pomstu nebo vzájemné obviňování. Naopak. Chci podporovat přístup, ve kterém je dítě v centru pozornosti a jeho potřeby jsou důležitější než konflikt dospělých.
            </p>
            <p>
              To ale neznamená, že má otec mlčet, když má pocit, že jsou jeho rodičovská práva neoprávněně omezována. Znamená to, že má hledat řešení věcně, zákonně a s ohledem na dítě.
            </p>
          </div>
        </div>

        {/* Card 2 */}
        <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm space-y-4 flex flex-col">
          <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold mb-2">
            <Users className="w-7 h-7" />
          </div>
          <h3 className="text-xl font-black text-slate-900 leading-tight">Proč právě otcové?</h3>
          <div className="space-y-3 text-slate-600 flex-grow">
            <p>
              Protože právě pro otce chybí jedno místo, kde by byly na jednom místě srozumitelně propojené informace o právu, péči o děti, psychologii, vědeckých poznatcích, judikatuře a praktických zkušenostech.
            </p>
            <p>
              Táta má právo chce tento prostor vytvořit. Ne proto, že by práva matek byla méně důležitá. Ale proto, že i otcové potřebují vědět, že jejich role v životě dítěte má význam.
            </p>
            <ul className="space-y-2 mt-4 bg-slate-50 p-4 rounded-xl">
              <li className="font-bold text-slate-800 flex gap-2"><span className="text-blue-500">•</span> Otec není návštěva.</li>
              <li className="font-bold text-slate-800 flex gap-2"><span className="text-blue-500">•</span> Otec není pouze plátce výživného.</li>
              <li className="font-bold text-slate-800 flex gap-2"><span className="text-blue-500">•</span> Otec není někdo, kdo má dítě „na víkend“.</li>
              <li className="font-bold text-slate-800 flex gap-2"><span className="text-blue-500">•</span> Otec je rodič.</li>
            </ul>
            <p className="pt-2">
              A pokud je to v nejlepším zájmu dítěte, má mít možnost být skutečnou a aktivní součástí jeho života.
            </p>
          </div>
        </div>

        {/* Card 3 */}
        <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm space-y-4 flex flex-col">
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold mb-2">
            <BookOpen className="w-7 h-7" />
          </div>
          <h3 className="text-xl font-black text-slate-900 leading-tight">Bez AI. Především skutečné informace.</h3>
          <div className="space-y-3 text-slate-600 flex-grow">
            <p>
              Projekt začíná znovu s jednoduchou filozofií. Nechci, aby jeho základem byla umělá inteligence.
            </p>
            <p>
              Základem budou informace, zdroje, databáze, judikatura, legislativa, odborné studie a kvalitně zpracovaný obsah. Každá informace má mít svůj původ a možnost ověření.
            </p>
            <p>
              Cílem není vytvořit systém, který bude rozhodovat za otce. Cílem je vytvořit systém, který mu pomůže lépe se orientovat.
            </p>
          </div>
        </div>
      </div>

      {/* Section: Co chci vybudovat */}
      <div className="max-w-4xl mx-auto bg-white rounded-3xl p-8 md:p-10 border border-slate-200 shadow-sm mt-12">
        <h2 className="text-2xl md:text-3xl font-black text-slate-900 mb-6">Co chci vybudovat</h2>
        <div className="text-slate-700 leading-relaxed space-y-4 text-lg">
          <p>
            Táta má právo má být dlouhodobě budovanou znalostní platformou. Místem, kde otec najde:
          </p>
          
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-6 mt-4">
            <li className="flex gap-3 items-start"><CheckCircle2 className="w-6 h-6 text-blue-500 shrink-0" /> <span className="pt-0.5">informace o svých právech,</span></li>
            <li className="flex gap-3 items-start"><CheckCircle2 className="w-6 h-6 text-blue-500 shrink-0" /> <span className="pt-0.5">průvodce jednotlivými životními situacemi,</span></li>
            <li className="flex gap-3 items-start"><CheckCircle2 className="w-6 h-6 text-blue-500 shrink-0" /> <span className="pt-0.5">databázi judikatury,</span></li>
            <li className="flex gap-3 items-start"><CheckCircle2 className="w-6 h-6 text-blue-500 shrink-0" /> <span className="pt-0.5">přehled právních předpisů,</span></li>
            <li className="flex gap-3 items-start"><CheckCircle2 className="w-6 h-6 text-blue-500 shrink-0" /> <span className="pt-0.5">odborné a vědecké studie,</span></li>
            <li className="flex gap-3 items-start"><CheckCircle2 className="w-6 h-6 text-blue-500 shrink-0" /> <span className="pt-0.5">praktické návody,</span></li>
            <li className="flex gap-3 items-start"><CheckCircle2 className="w-6 h-6 text-blue-500 shrink-0" /> <span className="pt-0.5">vzory dokumentů,</span></li>
            <li className="flex gap-3 items-start"><CheckCircle2 className="w-6 h-6 text-blue-500 shrink-0" /> <span className="pt-0.5">slovník právních pojmů,</span></li>
            <li className="flex gap-3 items-start"><CheckCircle2 className="w-6 h-6 text-blue-500 shrink-0" /> <span className="pt-0.5">informace o OSPOD a dalších institucích,</span></li>
            <li className="flex gap-3 items-start"><CheckCircle2 className="w-6 h-6 text-blue-500 shrink-0" /> <span className="pt-0.5">informace o psychologii dítěte,</span></li>
            <li className="flex gap-3 items-start"><CheckCircle2 className="w-6 h-6 text-blue-500 shrink-0" /> <span className="pt-0.5">prostor pro zkušenosti a komunitu.</span></li>
          </ul>
          
          <p className="font-bold text-slate-900 p-4 bg-blue-50 rounded-xl border border-blue-100">
            Nechci vytvořit web plný textu. Chci vytvořit nástroj, který má skutečný smysl pro člověka, který se právě ocitne v těžké životní situaci.
          </p>
        </div>
      </div>

      {/* Footer / Proč to dělám? CTA Area */}
      <div className="max-w-5xl mx-auto bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl p-8 md:p-14 text-white space-y-10 shadow-xl overflow-hidden relative">
        {/* Subtle decorative background circle */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>

        <div className="relative z-10 space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 text-blue-300 font-bold text-xs uppercase tracking-wider">
            <Target className="w-4 h-4" />
            <span>Naše vize</span>
          </div>
          
          <h2 className="text-3xl md:text-5xl font-black tracking-tight">
            Proč to dělám?
          </h2>
          
          <ul className="space-y-4 text-slate-300 text-lg md:text-xl pt-4">
            <li className="flex gap-4 items-start"><CheckCircle2 className="w-6 h-6 md:w-7 md:h-7 text-blue-400 shrink-0 mt-0.5" /> Protože věřím, že vztah dítěte s rodičem má hodnotu.</li>
            <li className="flex gap-4 items-start"><CheckCircle2 className="w-6 h-6 md:w-7 md:h-7 text-blue-400 shrink-0 mt-0.5" /> Protože věřím, že otec by měl znát svá práva i povinnosti.</li>
            <li className="flex gap-4 items-start"><CheckCircle2 className="w-6 h-6 md:w-7 md:h-7 text-blue-400 shrink-0 mt-0.5" /> Protože věřím, že konflikt rodičů nemusí znamenat konec rodičovství.</li>
            <li className="flex gap-4 items-start"><CheckCircle2 className="w-6 h-6 md:w-7 md:h-7 text-blue-400 shrink-0 mt-0.5" /> A protože věřím, že člověk, který hledá pomoc, by neměl nejprve bojovat s chaosem informací.</li>
          </ul>
        </div>

        <div className="relative z-10 pt-8 border-t border-white/10 space-y-6">
          <p className="text-2xl font-black text-white">Táta má právo vzniká proto, aby v tom otec nebyl sám.</p>
          <div className="text-slate-300 text-lg leading-relaxed max-w-3xl">
            <p>
              Nechci za něj rozhodovat. Nechci rozhodovat místo soudu. Nechci nahrazovat advokáta, psychologa ani jiné odborníky.
            </p>
            <p className="mt-4 font-bold text-white">
              Chci vytvořit místo, kde může začít hledat odpovědi.
            </p>
          </div>
        </div>

        <div className="relative z-10 pt-6 pb-2">
          <blockquote className="border-l-4 border-blue-500 pl-6 py-2">
            <p className="text-3xl md:text-4xl font-black text-white italic tracking-tight">
              Protože táta má právo být tátou.
            </p>
          </blockquote>
        </div>

        {/* Action Buttons */}
        <div className="relative z-10 pt-8 flex flex-wrap gap-4">
          <button
            onClick={() => onNavigate('/poradna')}
            className="px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-base transition-colors shadow-lg shadow-blue-600/30"
          >
            Vstoupit do Poradny
          </button>
          <button
            onClick={() => onNavigate('/komunita')}
            className="px-8 py-4 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl text-base transition-colors border border-white/20"
          >
            Připojit se ke Komunitě
          </button>
        </div>
      </div>
    </div>
  );
};

