import React, { useState } from 'react';
import { AlertTriangle, Stethoscope, FileText, CheckCircle2, Info, Activity, Phone, Scale } from 'lucide-react';
import { SeoHead } from '../SeoHead';

interface HealthcareGuideViewProps {
  onNavigate?: (path: string) => void;
}

export const HealthcareGuideView: React.FC<HealthcareGuideViewProps> = ({ onNavigate }) => {
  return (
    <div className="space-y-6 pt-4">
      <SeoHead
        title="Zdravotní péče o dítě a práva rodičů"
        description="Práva rodičů ve zdravotnictví: nahlížení do dokumentace, komunikace s pediatrem, psychologická péče a OČR."
        canonicalPath="/zdravotni-pece"
      />

      <div className="bg-gradient-to-br from-slate-900 via-teal-950 to-slate-900 rounded-3xl p-8 sm:p-10 text-white shadow-xl relative overflow-hidden">
        <div className="absolute -right-20 -bottom-20 w-96 h-96 bg-teal-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/30 text-xs font-bold mb-4">
            <Stethoscope className="w-4 h-4 text-teal-400" />
            <span>Zdravotnictví a lékaři</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight mb-4">
            Zdravotní péče o dítě
          </h1>
          <p className="text-slate-300 text-sm sm:text-base max-w-3xl leading-relaxed">
            Máte právo znát zdravotní stav svého dítěte a nahlížet do jeho zdravotnické dokumentace. Průvodce komunikací s pediatry, psychology a postupem při OČR.
          </p>
        </div>
      </div>

      <div className="bg-amber-50 rounded-2xl p-4 border border-amber-200 flex gap-3 text-xs text-amber-900">
        <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
        <p>
          <strong>Právní upozornění:</strong> Tento obsah má pouze informační charakter a nenahrazuje individuální právní poradenství. Nenahrazuje zdravotní péči ani individuální doporučení zdravotnického pracovníka.
        </p>
      </div>

      <section className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <h2 className="text-xl font-black text-slate-900 mb-4 flex items-center gap-2">
          <Scale className="w-5 h-5 text-teal-600" /> Práva rodiče ve zdravotní péči
        </h2>
        <div className="space-y-4 text-sm text-slate-700 leading-relaxed">
          <p>
            Rodičovská odpovědnost (a tedy i právo na informace o zdraví dítěte) <strong>náleží oběma rodičům bez ohledu na to, komu je dítě svěřeno do péče</strong> (pokud soud jednoho z rodičů tohoto práva výslovně nezbavil).
          </p>
          <ul className="list-disc pl-5 space-y-2">
            <li><strong>Přístup k informacím:</strong> Lékař (pediatr, specialista, nemocnice) má povinnost poskytovat informace o zdravotním stavu dítěte oběma rodičům.</li>
            <li><strong>Souhlas s péčí:</strong> K běžným vyšetřením stačí souhlas jednoho z rodičů (který zrovna dítě přivedl). K zásadním zákrokům s možným negativním následkem na zdraví (např. vážné operace, experimentální léčba) je nutný souhlas obou rodičů. Pokud se rodiče nedohodnou, rozhoduje soud.</li>
            <li><strong>Přítomnost u vyšetření:</strong> Rodič má právo být přítomen vyšetření svého nezletilého dítěte, nesmí však narušovat poskytování zdravotních služeb nebo provoz oddělení (např. na JIP mohou platit specifická pravidla).</li>
          </ul>
        </div>
      </section>

      <section className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <h2 className="text-xl font-black text-slate-900 mb-4 flex items-center gap-2">
          <FileText className="w-5 h-5 text-teal-600" /> Jak získat zdravotnickou dokumentaci
        </h2>
        <div className="space-y-4 text-sm text-slate-700 leading-relaxed">
          <p>
            Jako zákonný zástupce máte právo <strong>nahlížet do dokumentace, pořizovat si z ní výpisy a kopie</strong> (§ 65 zákona o zdravotních službách).
          </p>
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
            <h3 className="font-bold text-slate-900 mb-2">Postup, pokud lékař informace neposkytuje automaticky:</h3>
            <ol className="list-decimal pl-5 space-y-2">
              <li>Zašlete věcnou <strong>písemnou žádost</strong> pediatrovi (nebo specialistovi) s žádostí o pořízení kopie/výpisu.</li>
              <li>Lékař má na pořízení kopie lhůtu ze zákona (až 30 dnů). Může požadovat úhradu nákladů na pořízení kopie.</li>
              <li>Pokud lékař odmítá komunikovat (např. s odůvodněním "matka si to nepřeje"), upozorněte jej písemně, že <strong>souhlas druhého rodiče není k nahlížení do dokumentace potřeba</strong> a lékař porušuje zákon o zdravotních službách.</li>
              <li>Při přetrvávající obstrukci lze podat <strong>stížnost poskytovateli zdravotních služeb</strong> (vedení nemocnice/polikliniky), zřizovateli, krajskému úřadu nebo České lékařské komoře.</li>
            </ol>
          </div>
          <p className="text-xs text-slate-500 mt-2">
            TIP: Využijte sekci "AI Formuláře" na tomto portálu a vygenerujte si "Žádost o informace o zdravotním stavu" nebo "Žádost o kopii dokumentace".
          </p>
        </div>
      </section>

      <section className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <h2 className="text-xl font-black text-slate-900 mb-4 flex items-center gap-2">
          <Activity className="w-5 h-5 text-teal-600" /> Dětská psychologická a psychiatrická péče
        </h2>
        <div className="space-y-4 text-sm text-slate-700 leading-relaxed">
          <p>
            Psychická pohoda dítěte v opatrovnických sporech často trpí. Může vyvstat potřeba psychologické (terapie, poradenství) nebo psychiatrické péče (lékař, farmakoterapie).
          </p>
          <ul className="list-disc pl-5 space-y-2">
            <li>Obecně platí, že i k návštěvě psychologa by měl dát souhlas druhý rodič, případně by o tom měl být alespoň informován, nejde-li o akutní krizovou intervenci.</li>
            <li>Dětský psycholog neslouží k získávání "důkazů pro soud" proti druhému rodiči. Jeho primárním cílem je pomoci dítěti chránit jeho soukromí a psychické zdraví.</li>
            <li>Vyhněte se autodiagnostice dítěte i druhého rodiče. Např. termíny jako "syndrom zavrženého rodiče" (PAS) či jiné diagnózy může stanovovat výlučně kvalifikovaný odborník, nikoli rodič na základě článků na internetu.</li>
          </ul>
        </div>
      </section>

      <section className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-xl">
        <h2 className="text-2xl font-black mb-6 flex items-center gap-2">
          <Info className="w-6 h-6 text-teal-400" /> Ošetřovné (OČR) a péče o nemocné dítě
        </h2>
        <div className="space-y-4 text-sm text-slate-300">
          <p>
            Pokud dítě v době vašeho styku nebo péče onemocní, máte jako otec stejné právo na čerpání tzv. Ošetřovného člena rodiny (OČR) jako matka.
          </p>
          <div className="bg-slate-800 p-5 rounded-2xl border border-slate-700 space-y-4">
            <div>
              <strong className="text-teal-400 block mb-1">Základní podmínky (Zaměstnanci)</strong>
              Nárok má zaměstnanec, který nemůže pracovat z důvodu ošetřování nemocného dítěte mladšího 10 let (případně i staršího, pokud to stav vyžaduje). Musíte s dítětem žít ve společné domácnosti (při střídavé péči se tato podmínka považuje za splněnou u obou).
            </div>
            <div>
              <strong className="text-amber-400 block mb-1">Jak to zařídit</strong>
              Lékař vystaví tzv. "Rozhodnutí o potřebě ošetřování (péče)". Tento dokument předáte svému zaměstnavateli, který jej odešle na ČSSZ (Česká správa sociálního zabezpečení).
            </div>
            <div>
              <strong className="text-rose-400 block mb-1">Střídání se v péči</strong>
              Rodiče se mohou při ošetřování během jednoho případu onemocnění jednou vystřídat.
            </div>
          </div>
          <p className="text-xs text-slate-400 mt-2">
            Ověřte si aktuální podmínky u ČSSZ nebo u svého zaměstnavatele. Dlouhodobé ošetřovné (až 90 dnů) se řeší specificky u vážných zhoršení zdravotního stavu vyžadujících minimálně 4denní hospitalizaci.
          </p>
        </div>
      </section>

      <div className="pt-4 border-t border-slate-200 text-[10px] text-slate-400 leading-relaxed">
        <strong>Zdroje:</strong> Zákon č. 89/2012 Sb. (občanský zákoník), Zákon č. 372/2011 Sb. (o zdravotních službách), Zákon č. 187/2006 Sb. (o nemocenském pojištění). Ministerstvo zdravotnictví ČR, Česká správa sociálního zabezpečení (ČSSZ). Aktuálnost ověřena k: Srpen 2026.
      </div>
    </div>
  );
};
