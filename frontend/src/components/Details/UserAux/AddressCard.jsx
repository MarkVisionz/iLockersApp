// AddressCard.js
import styled from "styled-components";
import { motion } from "framer-motion";

const AddressCard = ({ address, theme, index, activeCardIndex, onClick }) => {
  const { details } = address;

  return (
    <AddressCardVisual
      theme={theme}
      index={index}
      onClick={onClick}
      isActive={activeCardIndex === index}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <AddressLabel>
        {details.address?.split(",")[0] || details.customerName || "Unnamed"}
      </AddressLabel>
    </AddressCardVisual>
  );
};

export default AddressCard;

const AddressCardVisual = styled(motion.div)`
  background: ${({ theme }) => theme || "linear-gradient(45deg, #ff6200, #ff8c00)"};
  border-radius: 12px;
  width: 100%;
  height: 40px;
  position: absolute;
  top: ${({ index }) => `${35 + index * 30}px`}; /* Stack upwards: start from bottom */
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 0.5rem;
  color: #fff;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
  z-index: ${({ index }) => index}; /* Reverse z-index: higher index = higher z-index */
  cursor: pointer;
  opacity: ${({ isActive }) => (isActive ? 1 : 0.8)};
  transition: opacity 0.3s ease;

  &:hover {
    opacity: 1;
  }
`;

const AddressLabel = styled.div`
  font-size: 0.9rem;
  font-weight: bold;
  color: #fff;
  text-align: left;
  width: 100%;
`;