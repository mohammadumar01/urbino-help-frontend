import Navbar from "../components/layout/Navbar";
import Hero from "../components/home/Hero";
import Categories from "../components/home/Categories";
import PopularServices from "../components/home/PopularServices";
import HowItWorks from "../components/home/HowItWorks";
import ServiceCategories from "../components/home/ServiceCategories";
import TrustedProviders from "../components/home/TrustedProviders";
import WhyUrbino from "../components/home/WhyUrbino";
import Testimonials from "../components/home/Testimonials";
import FinalCTA from "../components/home/FinalCTA";
import Footer from "../components/layout/Footer";

export default function Home() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <Categories />
        <PopularServices />
        <HowItWorks />
        <ServiceCategories />
        <TrustedProviders />
        <WhyUrbino />
        <Testimonials />
        <FinalCTA />
      </main>
      <Footer />
    </>
  );
}