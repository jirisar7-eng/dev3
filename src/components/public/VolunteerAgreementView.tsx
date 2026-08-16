import React from 'react';
import { VolunteerAgreementPage } from './VolunteerAgreementPage';

export const VolunteerAgreementView: React.FC<{ onNavigate?: (path: string) => void }> = (props) => {
  return <VolunteerAgreementPage {...props} />;
};

export default VolunteerAgreementView;
