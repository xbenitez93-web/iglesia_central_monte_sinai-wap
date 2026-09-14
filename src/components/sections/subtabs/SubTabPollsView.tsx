import React from 'react';
import { CustomSectionSubTab, UserProfile, CustomSectionItem } from '../../../types';
import { PollsModuleView } from '../polls/PollsModuleView';

interface SubTabPollsViewProps {
  subTab: CustomSectionSubTab;
  onUpdateSubTab: (updatedSubTab: CustomSectionSubTab) => void;
  onShowToast: (message: string, type?: 'success' | 'danger' | 'info') => void;
  currentUser?: UserProfile | null;
  canEdit?: boolean;
}

export const SubTabPollsView: React.FC<SubTabPollsViewProps> = ({
  subTab,
  onUpdateSubTab,
  onShowToast,
  currentUser,
}) => {
  // Convert subTab into a virtual CustomSectionItem so PollsModuleView handles it with full functionality
  const virtualSection: CustomSectionItem = {
    id: subTab.id,
    name: subTab.name,
    slug: subTab.id,
    description: subTab.description || 'Encuestas y votaciones interactivas del departamento.',
    sectionType: 'polls',
    iconName: subTab.iconName || 'Vote',
    color: subTab.colorTheme || '#8b5cf6',
    enabled: true,
    order: subTab.order || 1,
    showInTopNav: false,
    banner: {
      title: subTab.name,
      subtitle: subTab.description || 'Votaciones con imágenes y conteo en tiempo real',
      primaryColor: subTab.colorTheme || '#8b5cf6',
      secondaryColor: '#4f46e5',
    },
    pollsData: subTab.pollsData || { polls: [] },
  };

  const handleUpdateVirtualSection = (updatedSec: CustomSectionItem) => {
    const updatedSubTab: CustomSectionSubTab = {
      ...subTab,
      pollsData: updatedSec.pollsData,
    };
    onUpdateSubTab(updatedSubTab);
  };

  return (
    <div className="space-y-4">
      <PollsModuleView
        section={virtualSection}
        currentUser={currentUser}
        onUpdateSectionData={handleUpdateVirtualSection}
        onShowToast={onShowToast}
      />
    </div>
  );
};
