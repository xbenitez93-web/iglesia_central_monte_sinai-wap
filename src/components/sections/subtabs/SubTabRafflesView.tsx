import React from 'react';
import { CustomSectionSubTab, UserProfile, CustomSectionItem, ChurchConfig } from '../../../types';
import { RafflesModuleView } from '../raffles/RafflesModuleView';

interface SubTabRafflesViewProps {
  subTab: CustomSectionSubTab;
  onUpdateSubTab: (updatedSubTab: CustomSectionSubTab) => void;
  onShowToast: (message: string, type?: 'success' | 'danger' | 'info') => void;
  currentUser?: UserProfile | null;
  config?: ChurchConfig;
  canEdit?: boolean;
}

export const SubTabRafflesView: React.FC<SubTabRafflesViewProps> = ({
  subTab,
  onUpdateSubTab,
  onShowToast,
  currentUser,
  config,
}) => {
  // Convert subTab into a virtual CustomSectionItem so RafflesModuleView handles it with full functionality
  const virtualSection: CustomSectionItem = {
    id: subTab.id,
    name: subTab.name,
    slug: subTab.id,
    description: subTab.description || 'Sorteos y rifas pro-fondos con boletos numerados y tómbola digital.',
    sectionType: 'raffles',
    iconName: subTab.iconName || 'Ticket',
    color: subTab.colorTheme || '#d97706',
    enabled: true,
    order: subTab.order || 1,
    showInTopNav: false,
    banner: {
      title: subTab.name,
      subtitle: subTab.description || 'Sorteos con boletos numerados y tómbola interactiva',
      primaryColor: subTab.colorTheme || '#d97706',
      secondaryColor: '#ea580c',
    },
    rafflesData: subTab.rafflesData || { raffles: [] },
  };

  const handleUpdateVirtualSection = (updatedSec: CustomSectionItem) => {
    const updatedSubTab: CustomSectionSubTab = {
      ...subTab,
      rafflesData: updatedSec.rafflesData,
    };
    onUpdateSubTab(updatedSubTab);
  };

  return (
    <div className="space-y-4">
      <RafflesModuleView
        section={virtualSection}
        currentUser={currentUser}
        config={config}
        onUpdateSectionData={handleUpdateVirtualSection}
        onShowToast={onShowToast}
      />
    </div>
  );
};
