import styled from "styled-components";

const Widget = ({ data }) => {
  const percentage = Number.isFinite(data.percentage)
    ? Math.floor(data.percentage)
    : 0;

  return (
    <StyledWidget>
      <Icon color={data.color} bgcolor={data.bgColor}>
        {data.icon}
      </Icon>
      <Text>
        <h3>
          {data.digits === 0
            ? "No data"
            : data.isMoney
            ? "$" + data.digits.toLocaleString()
            : data.digits.toLocaleString()}
        </h3>
        <p>{data.title}</p>
      </Text>
      {percentage < 0 ? (
        <Percentage isPositive={false}>{percentage + "%"}</Percentage>
      ) : (
        <Percentage isPositive={true}>{percentage + "%"}</Percentage>
      )}
    </StyledWidget>
  );
};

export default Widget;

const StyledWidget = styled.div`
  display: flex;
  align-items: center;
`;

const Icon = styled.div`
  margin-right: 0.5rem;
  padding: 0.5rem;
  color: ${({ color }) => color};
  background: ${({ bgcolor }) => bgcolor};
  border-radius: 3px;
  font-size: 20px;
`;

const Text = styled.div`
  h3 {
    font-weight: 900;
  }
  p {
    font-size: 14px;
    color: rgb(234, 234, 255, 0.68);
  }
`;

const Percentage = styled.div`
  margin-left: 0.5rem;
  font-size: 14px;
  color: ${({ isPositive }) =>
    isPositive ? "rgb(114, 225, 40)" : "rgb(255, 77, 73)"};
`;