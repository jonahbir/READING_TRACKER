import React from 'react';
import Hero from '../components/sections/Hero';
import HowItWorks from '../components/sections/HowItWorks';
import WhyJoin from '../components/sections/WhyJoin';
import ExploreBooks from '../components/sections/ExploreBooks';

const HomePage: React.FC = () => {
  return (
    <div className="relative">
      <Hero />
      <HowItWorks />
      <WhyJoin />
      <ExploreBooks />
    </div>
  );
};

export default HomePage;