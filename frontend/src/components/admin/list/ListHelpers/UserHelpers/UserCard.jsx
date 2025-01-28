import React from "react";
import styled from "styled-components";
import moment from "moment";

const UserCard = ({ user, onDelete, onView }) => {
  return (
    <CardContainer onClick={() => onView(user._id)}>
      <UserInfo>
        <UserId>ID: {user._id}</UserId>
        <UserName>Name: {user.name}</UserName>
        <UserEmail>Email: {user.email}</UserEmail>
        <UserRole>
          {user.isAdmin ? <Admin>Admin</Admin> : <Customer>Customer</Customer>}
        </UserRole>
        <UserDate>Signed In: {moment(user.createdAt).format("YYYY-MM-DD HH:mm")}</UserDate>
      </UserInfo>
      <Actions>
        <DeleteButton onClick={(e) => {
          e.stopPropagation();
          onDelete(user._id);
        }}>
          Delete
        </DeleteButton>
        <ViewButton onClick={(e) => {
          e.stopPropagation();
          onView(user._id);
        }}>
          View
        </ViewButton>
      </Actions>
    </CardContainer>
  );
};

export default UserCard;

// Styled Components
const CardContainer = styled.div`
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 1.5rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  margin-bottom: 1.5rem;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  cursor: pointer;
  transition: box-shadow 0.3s ease, transform 0.2s ease;
  background-color: white;

  &:hover {
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
    transform: translateY(-2px);
  }

  @media (max-width: 768px) {
    flex-direction: column;
  }
`;

const UserInfo = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1;
`;

const UserId = styled.p`
  margin: 0 0 0.5rem;
  font-weight: bold;
  color: #007bff;
`;

const UserName = styled.p`
  margin: 0 0 0.5rem;
  font-size: 1.2rem;
`;

const UserEmail = styled.p`
  margin: 0 0 0.5rem;
  font-size: 1.1rem;
`;

const UserRole = styled.p`
  margin: 0 0 0.5rem;
  display: flex;
  align-items: center;
  font-weight: bold;
`;

const UserDate = styled.p`
  margin: 0;
  font-size: 1rem;
`;

const Actions = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-left: 1rem;

  @media (max-width: 768px) {
    margin-left: 0;
    margin-top: 1rem;
    flex-direction: row;
  }
`;

const DeleteButton = styled.button`
  background-color: rgb(255, 77, 73);
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: background-color 0.3s ease, transform 0.2s ease;

  &:hover {
    background-color: rgb(230, 70, 65);
    transform: scale(1.05);
  }

  &:focus {
    outline: none;
  }
`;

const ViewButton = styled.button`
  background-color: rgb(38, 198, 249);
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: background-color 0.3s ease, transform 0.2s ease;

  &:hover {
    background-color: rgb(0, 180, 249);
    transform: scale(1.05);
  }

  &:focus {
    outline: none;
  }
`;

const Admin = styled.span`
  color: rgb(253, 181, 40);
  background: rgba(253, 181, 40, 0.12);
  padding: 0.3rem 0.5rem;
  border-radius: 3px;
  font-size: 1rem;
`;

const Customer = styled.span`
  color: rgb(102, 108, 255);
  background-color: rgba(102, 108, 255, 0.12);
  padding: 0.3rem 0.5rem;
  border-radius: 3px;
  font-size: 1rem;
`;