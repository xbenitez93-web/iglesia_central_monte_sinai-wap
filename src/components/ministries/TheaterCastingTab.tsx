import React from 'react';
import {
  TheaterCastingCall,
  TheaterPlay,
  TheaterActor,
  ChurchConfig,
} from '../../types';
import { MinistryCastingTab } from './MinistryCastingTab';

interface TheaterCastingTabProps {
  castings: TheaterCastingCall[];
  plays: TheaterPlay[];
  actors?: TheaterActor[];
  pageColor: string;
  config?: ChurchConfig;
  onAddCasting: (casting: Omit<TheaterCastingCall, 'id'>) => void;
  onUpdateCasting: (casting: TheaterCastingCall) => void;
  onDeleteCasting: (id: string) => void;
  onAddActor?: (actor: Omit<TheaterActor, 'id'>) => void;
}

export const TheaterCastingTab: React.FC<TheaterCastingTabProps> = ({
  castings,
  plays,
  pageColor,
  config,
  onAddCasting,
  onUpdateCasting,
  onDeleteCasting,
  onAddActor,
}) => {
  return (
    <MinistryCastingTab
      ministry="theater"
      ministryName="Ministerio de Teatro, Drama & Pantomima"
      castings={castings}
      referenceItems={plays.map((p) => ({ id: p.id, title: p.title }))}
      pageColor={pageColor}
      config={config}
      onAddCasting={onAddCasting}
      onUpdateCasting={onUpdateCasting}
      onDeleteCasting={onDeleteCasting}
      onAddActor={onAddActor}
    />
  );
};
