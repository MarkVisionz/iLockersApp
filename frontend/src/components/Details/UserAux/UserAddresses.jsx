import React from "react";
import styled from "styled-components";
import { motion, AnimatePresence } from "framer-motion";
import AddressCardList from "./AddressCardList";

const CARD_THEMES = [
  "linear-gradient(45deg, #ff6200, #ff8c00)",
  "linear-gradient(45deg, #1a3c34, #2a5d53)",
  "linear-gradient(45deg, #004d7a, #008793)",
  "linear-gradient(45deg, #4b2e2e, #6b4e4e)",
];

const UserAddresses = ({
  orders,
  userId,
  authEmail,
  selectedAddress,
  currentIndex,
  onSelectAddress,
  onSetDefault,
}) => {
  const addressesFromOrders = React.useMemo(() => {
    const allOrders =
      orders?.filter(
        (order) =>
          order?.userId?.toString() === userId ||
          (order?.contact?.email === authEmail && order?.isGuestOrder)
      ) || [];

    const uniqueAddresses = [];
    const seenAddresses = new Set();

    allOrders.forEach((order) => {
      if (
        !order?.shipping ||
        !order.shipping.line1 ||
        !order.shipping.city ||
        !order.shipping.postal_code
      ) {
        return;
      }
      const addressKey = `${order.shipping.line1}-${order.shipping.city}-${order.shipping.postal_code}`;
      if (!seenAddresses.has(addressKey)) {
        seenAddresses.add(addressKey);
        uniqueAddresses.push({
          id: `address-${uniqueAddresses.length}`,
          details: {
            customerName: order.contact?.name || "Cliente",
            address: `${order.shipping.line1}${
              order.shipping.line2 ? `, ${order.shipping.line2}` : ""
            }`,
            city: order.shipping.city,
            postalCode: order.shipping.postal_code,
            phone: order.contact?.phone || "Sin teléfono",
          },
          rawDetails: JSON.stringify(order.shipping),
        });
      }
    });
    return uniqueAddresses;
  }, [orders, userId, authEmail]);

  return (
    <WalletHolder>
      <WalletSlot />
      <AddressTitle>Direcciones Guardadas</AddressTitle>
      {addressesFromOrders.length === 0 ? (
        <EmptyState>No se encontraron direcciones.</EmptyState>
      ) : (
        <>
          <AddressCardList
            addresses={addressesFromOrders}
            cardThemes={CARD_THEMES}
            onSelectAddress={onSelectAddress}
          />
          <AnimatePresence mode="wait">
            <AddressDetails
              key={currentIndex}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
            >
              <DetailsColumn>
                <DetailItem>
                  {addressesFromOrders[currentIndex]?.details.customerName}
                </DetailItem>
                <DetailItem>
                  {addressesFromOrders[currentIndex]?.details.address}
                </DetailItem>
                <DetailItem>
                  {addressesFromOrders[currentIndex]?.details.city},{" "}
                  {addressesFromOrders[currentIndex]?.details.postalCode}
                </DetailItem>
                <DetailItem>
                  {addressesFromOrders[currentIndex]?.details.phone}
                </DetailItem>
              </DetailsColumn>
              <SetDefaultButton
                onClick={() =>
                  onSetDefault(addressesFromOrders[currentIndex]?.rawDetails)
                }
                selected={
                  selectedAddress ===
                  addressesFromOrders[currentIndex]?.rawDetails
                }
              >
                {selectedAddress ===
                addressesFromOrders[currentIndex]?.rawDetails
                  ? "✓ Dirección Predeterminada"
                  : "Establecer como Predeterminada"}
              </SetDefaultButton>
            </AddressDetails>
          </AnimatePresence>
        </>
      )}
    </WalletHolder>
  );
};

// Estilos (iguales a los del original)
const WalletHolder = styled.div`
  background: #1c2526;
  border-radius: 16px;
  width: 100%;
  min-height: 300px;
  position: relative;
  padding: 0.5rem;
  margin-bottom: 1.2rem;
`;

const WalletSlot = styled.div`
  background: #2a2a2a;
  width: 100%;
  height: 20%;
  position: absolute;
  top: 0;
  left: 0;
  border-top-left-radius: 16px;
  border-top-right-radius: 16px;
`;

const AddressTitle = styled.div`
  font-size: 1.2rem;
  font-weight: bold;
  color: #fff;
  margin-bottom: 0.5rem;
  text-align: center;
  position: absolute;
  top: 10px;
  left: 0;
  width: 100%;
`;

const EmptyState = styled.p`
  text-align: center;
  color: #86868b;
  font-size: 0.95rem;
  margin: 1rem 0;
`;

const AddressDetails = styled(motion.div)`
  padding: 0.5rem 1rem;
  width: 100%;
  margin-top: 1.5rem;
  color: #fff;
  position: absolute;
  left: 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const DetailsColumn = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1;
`;

const DetailItem = styled.p`
  font-size: 0.85rem;
  margin: 0.2rem 0;
  line-height: 1.3;
`;

const SetDefaultButton = styled.button`
  padding: 0.5rem 1rem;
  background: ${({ selected }) => (selected ? "#34c759" : "#007aff")};
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  margin-top: 4rem;

  &:hover {
    background: ${({ selected }) => (selected ? "#2d9e4b" : "#005bb5")};
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }

  &:active {
    transform: translateY(0);
  }
`;

export default UserAddresses;
