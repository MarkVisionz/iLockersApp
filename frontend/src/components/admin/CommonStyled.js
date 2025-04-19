import styled from "styled-components";

export const AdminHeaders = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
`;

export const PrimaryButton = styled.button`
  padding: 9px 12px;
  border-radius: 5px;
  font-weight: 400;
  letter-spacing: 1.15px;
  background-color: #4b70e2;
  color: #f9f9f9;
  border: none;
  outline: none;
  cursor: pointer;
  margin: 0.5rem 0;
`;

export const FloatingInput = styled.label`
  position: relative;
  display: flex;
  flex-direction: column;
  margin-top: 1.5rem;

  input,
  select,
  textarea {
    padding: 1.2rem 1rem 0.6rem;
    font-size: 1rem;
    border: 1px solid #ccc;
    border-radius: 10px;
    background: #fefefe;
    transition: border 0.3s;

    &:focus {
      border-color: #007bff;
      outline: none;
    }
  }

  label {
    position: absolute;
    top: 1rem;
    left: 1rem;
    font-size: 1rem;
    color: #999;
    background: #fefefee6;
    padding: 0 4px;
    transition: all 0.2s ease;
    pointer-events: none;
  }

  input:focus + label,
  select:focus + label,
  textarea:focus + label,
  .filled {
    top: -0.6rem;
    left: 0.8rem;
    font-size: 0.95rem;
    font-weight: 600;
    color: #007bff;
  }
`;

export const FloatingFileInput = styled.label`
  position: relative;
  display: inline-block;
  width: 100%;
  margin-top: 1rem;

  input {
    opacity: 0;
    width: 100%;
    height: 3.2rem;
    position: absolute;
    top: 0;
    left: 0;
    cursor: pointer;
    z-index: 2;
  }

  label {
    display: inline-block;
    width: 100%;
    padding: 0.85rem 1rem;
    border-radius: 8px;
    border: 2px solid ${({ isFilled }) => (isFilled ? "#007bff" : "#ccc")};
    background-color: #fefefe;
    font-size: 0.95rem;
    color: ${({ isFilled }) => (isFilled ? "#007bff" : "#666")};
    position: relative;
    z-index: 1;
    transition: all 0.3s ease;
    text-align: center;

    &:hover {
      background-color: ${({ isFilled }) => (isFilled ? "#e9f3ff" : "#f0f0f0")};
    }
  }
`;