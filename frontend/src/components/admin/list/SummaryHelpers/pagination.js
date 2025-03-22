import React from "react";
import styled from "styled-components";

const Pagination = ({ currentPage, setCurrentPage, totalNotes, itemsPerPage }) => {
  const totalPages = Math.ceil(totalNotes / itemsPerPage);
  const maxVisiblePages = 4;

  const handlePageClick = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const startPage = Math.max(
    1,
    Math.min(
      currentPage - Math.floor(maxVisiblePages / 2),
      totalPages - maxVisiblePages + 1
    )
  );
  const endPage = Math.min(startPage + maxVisiblePages - 1, totalPages);

  return (
    <PaginationWrapper>
      {/* Botón para ir a la primera página */}
      <PageButton
        onClick={() => handlePageClick(1)}
        disabled={currentPage === 1}
      >
        «
      </PageButton>

      {/* Botón para página anterior */}
      <PageButton
        onClick={() => handlePageClick(currentPage - 1)}
        disabled={currentPage === 1}
      >
        ‹
      </PageButton>

      {/* Números de página visibles */}
      {Array.from(
        { length: endPage - startPage + 1 },
        (_, index) => startPage + index
      ).map((page) => (
        <PageNumber
          key={page}
          isActive={currentPage === page}
          onClick={() => handlePageClick(page)}
        >
          {page}
        </PageNumber>
      ))}

      {/* Botón para página siguiente */}
      <PageButton
        onClick={() => handlePageClick(currentPage + 1)}
        disabled={currentPage === totalPages}
      >
        ›
      </PageButton>

      {/* Botón para ir a la última página */}
      <PageButton
        onClick={() => handlePageClick(totalPages)}
        disabled={currentPage === totalPages}
      >
        »
      </PageButton>
    </PaginationWrapper>
  );
};

export default Pagination;

// Styled Components
const PaginationWrapper = styled.div`
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  align-items: center;
  gap: 1rem;
  margin: 2rem 0;
  padding: 0.5rem 1rem;
  background-color: #fff;
  border-radius: 12px;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.05);
  
  @media (max-width: 768px) {
    flex-wrap: wrap;
    padding: 0.5rem;
    gap: 0.5rem;
  }

  @media (max-width: 480px) {
    gap: 0.3rem;
  }
`;

const PageButton = styled.button`
  background-color: #f0f0f0;
  color: ${(props) => (props.disabled ? "#aaa" : "#007bff")};
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 50%;
  cursor: ${(props) => (props.disabled ? "not-allowed" : "pointer")};
  transition: all 0.2s ease;

  &:hover:not(:disabled) {
    background-color: #e6f0ff;
    transform: scale(1.1);
  }

  &:disabled {
    opacity: 0.5;
  }

  @media (max-width: 768px) {
    padding: 0.4rem 0.8rem;
  }

  @media (max-width: 480px) {
    padding: 0.3rem 0.6rem;
  }
`;

const PageNumber = styled.button`
  background-color: ${(props) => (props.isActive ? "#007bff" : "#f0f0f0")};
  color: ${(props) => (props.isActive ? "#fff" : "#007bff")};
  border: none;
  padding: 0.6rem 1rem;
  border-radius: 8px;
  cursor: pointer;
  font-size: 1rem;
  font-weight: ${(props) => (props.isActive ? "bold" : "normal")};
  transition: all 0.2s ease;

  &:hover {
    background-color: ${(props) =>
      props.isActive ? "#0056b3" : "#e6f0ff"};
    transform: translateY(-2px);
    box-shadow: 0px 6px 12px rgba(0, 0, 0, 0.1);
  }

  @media (max-width: 768px) {
    padding: 0.5rem 1rem;
    font-size: 0.9rem;
  }

  @media (max-width: 480px) {
    padding: 0.4rem 0.8rem;
    font-size: 0.8rem;
  }
`;
