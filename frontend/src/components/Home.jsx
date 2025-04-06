import styled from "styled-components";
import { Link } from "react-router-dom";
import { useSelector } from "react-redux";
import { motion } from "framer-motion";
import { Canvas } from "@react-three/fiber";
import { Suspense } from "react";
import FloatingObjects from "./FloatingObjects";
import { OrbitControls } from "@react-three/drei";

const Home = () => {
  const auth = useSelector((state) => state.auth);

  return (
    <Wrapper>
      <CanvasWrapper>
        <Canvas camera={{ position: [0, 0, 15], fov: 45 }}>
          <ambientLight intensity={0.5} />
          <directionalLight position={[5, 5, 5]} intensity={1} />
          
          {/* Deshabilitamos los controles de órbita para que no afecten el movimiento */}
          <OrbitControls enableZoom={false} enablePan={false} enableRotate={false} />
          <Suspense fallback={null}>
            <FloatingObjects />
          </Suspense>
        </Canvas>
      </CanvasWrapper>

      <Overlay />

      <Content
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1 }}
      >
        <Title>¿Necesitas lavar?</Title>
        <Subtitle>Hazlo fácil. Sin cuenta, sin complicaciones.</Subtitle>

        <StartButton
          to="/cart"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          Empezar ahora
        </StartButton>

        {!auth._id && (
          <Note>
            ¿Quieres una experiencia más cómoda?{" "}
            <StyledLink to="/register">Crea una cuenta</StyledLink>
          </Note>
        )}
      </Content>
    </Wrapper>
  );
};

export default Home;

// Estilos
const Wrapper = styled.div`
  min-height: 100vh;
  background: #f0f4ff;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
  z-index:2;
`;

const CanvasWrapper = styled.div`
  position: fixed;
  inset: 0;
  z-index: 0;
  pointer-events: none; /* Deshabilita interacciones con el ratón */
`;

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  height: 100vh;
  background: rgba(255, 255, 255, 0.3);
  backdrop-filter: blur(1.5px);
  -webkit-backdrop-filter: blur(2px);
  will-change: transform;
  z-index: 1;
  pointer-events: none;
`;

const Content = styled(motion.div)`
  z-index: 2;
  text-align: center;
  max-width: 600px;
  padding: 2rem;
  background: white;
  border-radius: 20px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
  margin-top: -8rem;

  @media (max-width: 480px) {
    padding: 1.5rem;
    margin-top: -2rem; /* Ajuste más pequeño en móviles */
  }
`;

const Title = styled.h1`
  font-size: 3rem;
  color: #111;
  font-weight: 700;
`;

const Subtitle = styled.p`
  font-size: 1.2rem;
  color: #555;
  margin-bottom: 2rem;
`;

const StartButton = styled(motion(Link))`
  background: #007bff;
  color: white;
  padding: 1rem 2rem;
  font-size: 1.1rem;
  font-weight: 600;
  border-radius: 50px;
  text-decoration: none;
  box-shadow: 0 6px 20px rgba(0, 123, 255, 0.3);
  transition: background 0.3s ease;
  display: inline-block;

  &:hover {
    background: #0056b3;
  }
`;

const Note = styled.p`
  margin-top: 2rem;
  color: #666;
`;

const StyledLink = styled(Link)`
  color: #007bff;
  text-decoration: underline;

  &:hover {
    color: #0056b3;
  }
`;