import React from "react";
import styled from "styled-components";

const Pagination = ({ currentPage, setCurrentPage, totalNotes, itemsPerPage }) => {
  const totalPages = Math.ceil(totalNotes / itemsPerPage);

  return (
    <PaginationContainer>
      <Button onClick={() => setCurrentPage(1)} disabled={currentPage === 1}>
        First
      </Button>
      <Button onClick={() => setCurrentPage((page) => Math.max(page - 1, 1))} disabled={currentPage === 1}>
        Previous
      </Button>
      <PageNumber>{currentPage}</PageNumber>
      <Button onClick={() => setCurrentPage((page) => Math.min(page + 1, totalPages))} disabled={currentPage === totalPages}>
        Next
      </Button>
      <Button onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages}>
        Last
      </Button>
    </PaginationContainer>
  );
};

export default Pagination;

// Styled Components
const PaginationContainer = styled.div`
  display: flex;
  justify-content: center;
  margin-top: 2rem;
  flex-wrap: wrap;
  gap: 1rem;
`;

const Button = styled.button`
  background-color: #007bff;
  color: white;
  border: none;
  padding: 0.6rem 1.2rem;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1rem;
  min-width: 100px;
  transition: background-color 0.3s ease;

  &:disabled {
    background-color: #ddd;
    cursor: not-allowed;
  }

  &:hover:not(:disabled) {
    background-color: #0056b3;
  }

  &:focus {
    outline: none;
  }
`;

const PageNumber = styled.span`
  display: flex;
  align-items: center;
  font-size: 1rem;
  font-weight: bold;
`;