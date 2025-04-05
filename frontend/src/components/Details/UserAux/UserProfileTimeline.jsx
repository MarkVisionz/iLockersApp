// UserProfileTimeline.js
import React from "react";
import styled, { keyframes } from "styled-components";
import { BsClock, BsTruck, BsCheckCircle } from "react-icons/bs";

const TimelineView = ({ order }) => {
  const statusSteps = [
    { label: "Pending", icon: <BsClock /> },
    { label: "Dispatched", icon: <BsTruck /> },
    { label: "Delivered", icon: <BsCheckCircle /> },
  ];

  const currentStatusIndex = statusSteps.findIndex(
    (step) => step.label.toLowerCase() === order.delivery_status
  );

  return (
    <>
      <TimelineContainer>
        {statusSteps.map((step, index) => (
          <Step key={step.label}>
            {index !== 0 && (
              <Line
                active={index <= currentStatusIndex}
                color={getColor(index <= currentStatusIndex, order.delivery_status)}
              />
            )}
            <CircleWrapper>
              <IconCircle
                active={index <= currentStatusIndex}
                color={getColor(index <= currentStatusIndex, order.delivery_status)}
              >
                {step.icon}
              </IconCircle>
            </CircleWrapper>
            <StepLabel>{step.label}</StepLabel>
          </Step>
        ))}
      </TimelineContainer>
      {order.delivery_status === "delivered" && (
        <DeliveryNote>
          Tu orden ha sido entregada el día {new Date(order.updatedAt).toLocaleDateString()} a las {new Date(order.updatedAt).toLocaleTimeString()}
        </DeliveryNote>
      )}
    </>
  );
};

const getColor = (active, status) => {
  if (!active) return "#ccc";
  if (status === "delivered") return "#28a745";
  if (status === "dispatched") return "#007bff";
  return "#fcbf1e";
};

export default TimelineView;

const TimelineContainer = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  margin-top: 1rem;
  position: relative;
`;

const Step = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
  flex: 1;
`;

const CircleWrapper = styled.div`
  position: relative;
  z-index: 1;
`;

const IconCircle = styled.div`
  background-color: ${({ color }) => color};
  color: white;
  border-radius: 50%;
  padding: 0.5rem;
  font-size: 1.1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2.4rem;
  height: 2.4rem;
`;

const StepLabel = styled.span`
  font-size: 0.85rem;
  color: #444;
  text-transform: capitalize;
  margin-top: 0.25rem;
`;

const growLine = keyframes`
  from {
    width: 0;
  }
  to {
    width: 100%;
  }
`;

const Line = styled.div`
  position: absolute;
  top: 1.2rem;
  left: -50%;
  width: 100%;
  height: 2px;
  background: ${({ color }) => color};
  z-index: 0;
  animation: ${growLine} 0.6s ease forwards;
`;

const DeliveryNote = styled.div`
  text-align: center;
  font-size: 0.9rem;
  color: #28a745;
  margin-top: 1rem;
`;