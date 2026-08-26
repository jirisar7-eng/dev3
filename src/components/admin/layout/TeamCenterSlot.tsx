import React from 'react';
import { TeamCenterDashboard } from '../../team/TeamCenterDashboard';

export const TeamCenterSlot: React.FC<{ onNavigate?: (path: string) => void }> = ({ onNavigate }) => {
  return <TeamCenterDashboard isEmbedded={true} onNavigate={onNavigate} />;
};

export default TeamCenterSlot;
