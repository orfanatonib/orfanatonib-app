import React from 'react';
import PrioritiesIntro from './PrioritiesIntro';
import PriorityLadder from './PriorityLadder';

const PrioritiesSection: React.FC = () => {
    return (
        <>
            <PrioritiesIntro />
            <PriorityLadder />
        </>
    );
};

export default PrioritiesSection;
