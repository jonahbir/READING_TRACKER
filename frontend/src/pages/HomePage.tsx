import React from 'react';
import Hero from '../components/sections/Hero';
import HowItWorks from '../components/sections/HowItWorks';
import WhyJoin from '../components/sections/WhyJoin';

const HomePage: React.FC = () => {
  return (
    <div>
      <Hero />
      <HowItWorks />
      <WhyJoin />
    </div>
  );
};

export default HomePage;