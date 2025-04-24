// AddressCardList.js
import { useState } from "react";
import styled from "styled-components";
import AddressCard from "./AddressCard";

const AddressCardList = ({ addresses, cardThemes, onSelectAddress }) => {
  const [activeCardIndex, setActiveCardIndex] = useState(null);

  const handleCardClick = (index) => {
    setActiveCardIndex(index);
    onSelectAddress(index);
  };

  return (
    <CardListWrapper>
      {addresses.map((address, index) => {
        const reversedIndex = addresses.length - 1 - index; // Reverse the index
        return (
          <AddressCard
            key={address.id}
            address={address}
            theme={cardThemes[reversedIndex % cardThemes.length]} // Adjust theme assignment
            index={reversedIndex} // Use reversed index for positioning
            activeCardIndex={activeCardIndex}
            onClick={() => handleCardClick(index)} // Keep the original index for selection
          />
        );
      })}
    </CardListWrapper>
  );
};

export default AddressCardList;

const CardListWrapper = styled.div`
  position: relative;
  width: 100%;
  height: 150px;
`;