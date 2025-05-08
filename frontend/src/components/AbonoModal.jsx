import React, { useState } from 'react';
import styled from 'styled-components';
import PaymentMethodModal from './PaymentMethodModal';
import { FiDollarSign, FiX } from 'react-icons/fi';
import { toast } from 'react-toastify';

const AbonoModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  currentNote,
  onPaymentMethodSelect 
}) => {
  const [abonoAmount, setAbonoAmount] = useState('');
  const [abonoPaymentMethod, setAbonoPaymentMethod] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (!abonoAmount || parseFloat(abonoAmount) <= 0) {
      toast.error("Ingresa una cantidad válida", { background: '#dc3545' });
      return;
    }
    if (!abonoPaymentMethod) {
      toast.error("Selecciona un método de pago", { background: '#dc3545' });
      return;
    }
    onConfirm(parseFloat(abonoAmount), abonoPaymentMethod);
  };

  const handlePaymentMethodSelect = (method) => {
    setAbonoPaymentMethod(method);
    onPaymentMethodSelect(method);
    setShowPaymentModal(false);
  };

  const totalAbonado = currentNote?.abonos?.reduce((acc, ab) => acc + ab.amount, 0) || 0;
  const restante = currentNote?.total - totalAbonado;

  return (
    <ModalOverlay>
      <ModalContent>
        <CloseButton onClick={onClose} aria-label="Cerrar modal">
          <FiX size={20} />
        </CloseButton>
        <ModalTitle>Agregar Abono</ModalTitle>
        
        <InputGroup>
          <FloatingInput>
            <input
              type="number"
              value={abonoAmount}
              onChange={(e) => setAbonoAmount(e.target.value)}
              min="0"
              max={restante}
              step="0.01"
              placeholder=" "
            />
            <label className={abonoAmount ? "filled" : ""}>
              Cantidad a Abonar (Máx: ${restante.toFixed(2)})
            </label>
          </FloatingInput>
        </InputGroup>

        <PaymentMethodContainer>
          <PaymentMethodButton 
            onClick={() => setShowPaymentModal(true)}
            hasMethod={!!abonoPaymentMethod}
          >
            <FiDollarSign size={18} />
            {abonoPaymentMethod ? `Método: ${abonoPaymentMethod}` : "Seleccionar Método de Pago"}
          </PaymentMethodButton>
        </PaymentMethodContainer>

        <ActionButtons>
          <ConfirmButton onClick={handleConfirm}>
            Confirmar
          </ConfirmButton>
          <CancelButton onClick={onClose}>
            Cancelar
          </CancelButton>
        </ActionButtons>

        <PaymentMethodModal
          isOpen={showPaymentModal}
          onClose={() => setShowPaymentModal(false)}
          onSelect={handlePaymentMethodSelect}
          onCancel={() => setShowPaymentModal(false)}
          title="Selecciona el Método de Pago"
        />
      </ModalContent>
    </ModalOverlay>
  );
};

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  backdrop-filter: blur(4px);
`;

const ModalContent = styled.div`
  position: relative;
  background-color: #fff;
  padding: 2rem;
  border-radius: 12px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
  width: 90%;
  max-width: 500px;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  animation: slideIn 0.3s ease-out;

  @keyframes slideIn {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
  }
`;

const CloseButton = styled.button`
  position: absolute;
  top: 1rem;
  right: 1rem;
  background: none;
  border: none;
  color: #64748b;
  cursor: pointer;
  transition: color 0.3s ease;

  &:hover {
    color: #1e293b;
  }
`;

const ModalTitle = styled.h3`
  margin: 0;
  font-size: 1.5rem;
  font-weight: 600;
  color: #1e293b;
  text-align: center;
`;

const InputGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const FloatingInput = styled.div`
  position: relative;
  margin-bottom: 1.5rem;

  input {
    width: 100%;
    padding: 0.75rem;
    font-size: 1rem;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    outline: none;
    transition: border-color 0.3s ease, box-shadow 0.3s ease;

    &:focus {
      border-color: transparent;
      box-shadow: 0 0 0 2px #007bff;
    }

    &:not(:placeholder-shown) + label {
      top: -0.2rem;
      font-size: 0.75rem;
      color: #007bff;
    }
  }

  label {
    position: absolute;
    top: 50%;
    left: 0.75rem;
    transform: translateY(-50%);
    font-size: 1rem;
    color: #64748b;
    transition: all 0.3s ease;
    background: #fff;
    padding: 0 0.25rem;
    pointer-events: none;
  }

  label.filled {
    top: -0.5rem;
    font-size: 0.75rem;
    color: #007bff;
  }
`;

const PaymentMethodContainer = styled.div`
  display: flex;
  justify-content: center;
`;

const PaymentMethodButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background: linear-gradient(135deg, ${props => props.hasMethod ? '#28a745' : '#007bff'} 0%, ${props => props.hasMethod ? '#218838' : '#0056b3'} 100%);
  color: #fff;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);

  &:hover {
    transform: scale(1.05);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
  }
`;

const ActionButtons = styled.div`
  display: flex;
  justify-content: center;
  gap: 1rem;
  margin-top: 1rem;
`;

const ConfirmButton = styled.button`
  padding: 0.75rem 1.5rem;
  background: linear-gradient(135deg, #28a745 0%, #218838 100%);
  color: #fff;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);

  &:hover {
    transform: scale(1.05);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
  }
`;

const CancelButton = styled.button`
  padding: 0.75rem 1.5rem;
  background: linear-gradient(135deg, #dc3545 0%, #c82333 100%);
  color: #fff;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);

  &:hover {
    transform: scale(1.05);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
  }
`;

export default AbonoModal;