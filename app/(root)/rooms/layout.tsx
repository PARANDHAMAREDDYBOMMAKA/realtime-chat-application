import ItemList from '@/components/shared/item-list/ItemList';
import { api } from '@/convex/_generated/api';
import React from 'react';

type Props = React.PropsWithChildren<{}>;

const RoomsLayout = ({ children }: Props) => {
  return (
    <>
      <ItemList title="Rooms" action={{
        label: "Create Room",
        onClick: () => {
          // TODO: Open create room modal
        }
      }}>
        {/* TODO: Add room list items */}
      </ItemList>
      {children}
    </>
  );
};

export default RoomsLayout;