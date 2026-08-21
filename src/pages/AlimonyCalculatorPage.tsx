import React from 'react';
import { AlimonyCalculatorView } from '../components/public/AlimonyCalculatorView';

interface AlimonyCalculatorPageProps {
  onNavigate: (path: string) => void;
}

export const AlimonyCalculatorPage: React.FC<AlimonyCalculatorPageProps> = ({ onNavigate }) => {
  return <AlimonyCalculatorView />;
};
