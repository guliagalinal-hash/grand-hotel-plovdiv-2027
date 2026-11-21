import { useSite } from './context';
import { Header, Hero, Advantages, Program } from './components/Top';
import { Offers } from './components/Prices';
import { RoomsSection, SpaSection, DiningSection, PlovdivSection, DinnerSection, TermsSection, ContactCard, Footer } from './components/Sections';
import { LeadForm } from './components/LeadForm';

export function App() {
  const { t } = useSite();
  return (
    <>
      <a className="skip" href="#main">{t.skip}</a>
      <Header />
      <main id="main">
        <Hero />
        <Offers />
        <Advantages />
        <Program />
        <RoomsSection />
        <SpaSection />
        <DiningSection />
        <PlovdivSection />
        <DinnerSection />
        <TermsSection />
        <section className="sec sec--dark" id="contact"><div className="wrap"><ContactCard /></div></section>
        <LeadForm />
      </main>
      <Footer />
    </>
  );
}
