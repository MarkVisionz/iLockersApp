import styled from "styled-components";

const Widget = ({ data }) => {
  if (!data) {
    console.warn("Widget received no data");
    return null;
  }

  const { icon, digits = 0, isMoney, title, color, bgColor, percentage = 0 } = data;

  return (
    <StyledWidget>
      <Icon color={color} bgColor={bgColor}>
        {icon}
      </Icon>
      <Text>
        <h3>
          {isMoney
            ? `$${digits.toLocaleString("es-MX")}`
            : digits.toLocaleString()}
        </h3>
        <p>{title}</p>
      </Text>
      <Percentage isPositive={percentage >= 0}>
        {percentage >= 0
          ? `+${Math.floor(percentage)}%`
          : `${Math.floor(percentage)}%`}
      </Percentage>
    </StyledWidget>
  );
};

const StyledWidget = styled.div`
  display: flex;
  align-items: center;
  background: #fff;
  padding: 1rem;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  flex: 1;
  min-width: 200px;
  @media (max-width: 768px) {
    min-width: 100%;
  }
`;

const Icon = styled.div`
  margin-right: 0.75rem;
  padding: 0.5rem;
  color: ${({ color }) => color};
  background: ${({ bgColor }) => bgColor};
  border-radius: 4px;
  font-size: 1.5rem;
`;

const Text = styled.div`
  flex: 1;
  h3 {
    font-size: 1.25rem;
    font-weight: 700;
    color: #333;
    margin: 0;
  }
  p {
    font-size: 0.9rem;
    color: #666;
    margin: 0.25rem 0 0;
  }
`;

const Percentage = styled.div`
  font-size: 0.9rem;
  font-weight: 600;
  color: ${({ isPositive }) => (isPositive ? "#00d532" : "#dc3545")};
`;

export default Widget;