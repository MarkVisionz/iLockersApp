import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams, useNavigate } from "react-router-dom";
import styled from "styled-components";
import moment from "moment";
import { toast } from "react-toastify";
import Widget from "../admin/laundry-components/Widget";
import Transactions from "../admin/laundry-components/Transactions";
import AllTimeData from "../admin/laundry-components/AllTimeData";
import NotesSummary from "../admin/list/NotesSummary";
import {
  notesFetch,
  fetchNotesStats,
  fetchIncomeStats,
  resetNotes,
  resetError,
} from "../../features/notesSlice";
import { setAuthFromUserData } from "../../features/authSlice";
import { fetchAuthUser } from "../../features/authUserSlice";
import { fetchBusiness } from "../../features/businessSlice";
import { ErrorMessage, LoadingSpinner } from "../LoadingAndError";
import { FaClipboard, FaChartBar } from "react-icons/fa";
import { useMemo } from "react";

const LocalSummary = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { businessId: paramBusinessId } = useParams();
  const {
    stats = { notes: [], income: [] },
    status,
    statsStatus,
    error,
    items = [],
  } = useSelector((state) => state.notes);
  const {
    businesses,
    _id: userId,
    role,
    token,
    loading: authLoading,
    defaultBusiness,
  } = useSelector((state) => state.auth);
  const {
    business,
    status: businessStatus,
    error: businessError,
  } = useSelector((state) => state.business);
  const [isBusinessValid, setIsBusinessValid] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const businessId = paramBusinessId || defaultBusiness?._id || defaultBusiness;

  console.log("LocalSummary inicial:", {
    businessId,
    userId,
    role,
    token: token ? "Presente" : "Ausente",
    businesses: businesses.map((b) => b._id || b),
    authLoading,
    defaultBusiness,
  });

  useEffect(() => {
    const initialize = async () => {
      try {
        if (authLoading) {
          console.log("Esperando a que authLoading sea false");
          return;
        }

        if (!token || !userId) {
          console.warn("No hay token o userId, redirigiendo a login");
          toast.error("Sesión no válida, por favor inicia sesión de nuevo");
          navigate("/login");
          return;
        }

        if (!businessId) {
          console.warn("No se proporcionó un ID de negocio válido");
          setIsBusinessValid(false);
          setIsLoading(false);
          toast.error("Negocio no especificado");
          navigate("/");
          return;
        }

        let normalizedBusinesses = businesses
          .map((b) => ({
            _id: typeof b === "string" ? b : b._id ? b._id.toString() : null,
          }))
          .filter((b) => b._id);

        console.log("Negocios normalizados iniciales:", normalizedBusinesses);

        if (!normalizedBusinesses.length && userId && !authLoading) {
          let storedBusinesses = JSON.parse(
            localStorage.getItem("businesses") || "[]"
          );
          normalizedBusinesses = storedBusinesses
            .map((b) => ({
              _id: typeof b === "string" ? b : b._id ? b._id.toString() : null,
            }))
            .filter((b) => b._id);

          console.log(
            "Negocios normalizados desde localStorage:",
            normalizedBusinesses
          );

          if (!normalizedBusinesses.length) {
            console.log(`Despachando fetchAuthUser para userId: ${userId}`);
            const action = await dispatch(fetchAuthUser(userId));
            if (fetchAuthUser.fulfilled.match(action)) {
              normalizedBusinesses = (action.payload.businesses || [])
                .map((b) => ({
                  _id:
                    typeof b === "string" ? b : b._id ? b._id.toString() : null,
                }))
                .filter((b) => b._id);
              dispatch(
                setAuthFromUserData({
                  ...action.payload,
                  businesses: action.payload.businesses || [],
                })
              );
              localStorage.setItem(
                "businesses",
                JSON.stringify(action.payload.businesses || [])
              );
              console.log(
                "Negocios normalizados desde fetchAuthUser:",
                normalizedBusinesses
              );
            } else {
              console.error("Error al cargar auth user:", action.payload);
              setIsBusinessValid(false);
              setIsLoading(false);
              toast.error("Error al cargar datos del usuario");
              navigate("/");
              return;
            }
          }
        }

        const isValid = normalizedBusinesses.some(
          (b) => b._id === businessId || b._id.toString() === businessId
        );
        setIsBusinessValid(isValid);

        if (!isValid) {
          console.warn(
            `Negocio ${businessId} no válido para el usuario ${userId}`
          );
          toast.error("Negocio no válido o no autorizado", { autoClose: 3000 });
          setIsLoading(false);
          navigate("/");
          return;
        }

        console.log(`Despachando fetchBusiness para businessId: ${businessId}`);
        dispatch(fetchBusiness(businessId));

        setIsLoading(false);
      } catch (err) {
        console.error("Error inicializando LocalSummary:", err.message);
        setIsBusinessValid(false);
        setIsLoading(false);
        toast.error("Error al cargar el negocio");
        navigate("/");
      }
    };

    initialize();
  }, [
    businessId,
    userId,
    role,
    businesses,
    token,
    authLoading,
    defaultBusiness,
    dispatch,
    navigate,
  ]);

  useEffect(() => {
    if (
      isLoading ||
      !userId ||
      !token ||
      !businessId ||
      isBusinessValid === false
    ) {
      return;
    }

    console.log(
      "LocalSummary useEffect - Fetching data for businessId:",
      businessId
    );

    // Limpiar estado de notas antes de cargar nuevas
    dispatch(resetNotes());
    dispatch(notesFetch({ businessId }));
    dispatch(fetchNotesStats({ businessId }));
    dispatch(fetchIncomeStats({ businessId }));
  }, [businessId, userId, token, isBusinessValid, isLoading, dispatch]);

  const handleRetry = () => {
    console.log(`Reintentando carga de datos para businessId: ${businessId}`);
    dispatch(resetError());
    dispatch(resetNotes());
    dispatch(notesFetch({ businessId }));
    dispatch(fetchNotesStats({ businessId }));
    dispatch(fetchIncomeStats({ businessId }));
    toast.info("Reintentando cargar datos...");
  };

  const calculatePercentage = (current, previous) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  };

  const currentMonth = moment().month() + 1;
  const currentYear = moment().year();
  const previousMonth = currentMonth === 1 ? 12 : currentMonth - 1;
  const previousYear = currentMonth === 1 ? currentYear - 1 : currentYear;

  const notesCurrent = useMemo(() => {
    const note = stats.notes.find(
      (item) =>
        item._id?.month === currentMonth && item._id?.year === currentYear
    );
    console.log("notesCurrent calculation:", { note, count: note?.count || 0 });
    return note?.count || 0;
  }, [stats.notes, currentMonth, currentYear]);

  const notesPrevious = useMemo(() => {
    const note = stats.notes.find(
      (item) =>
        item._id?.month === previousMonth && item._id?.year === previousYear
    );
    console.log("notesPrevious calculation:", {
      note,
      count: note?.count || 0,
    });
    return note?.count || 0;
  }, [stats.notes, previousMonth, previousYear]);

  const incomeCurrent = useMemo(() => {
    const income = stats.income.find(
      (item) =>
        item._id?.month === currentMonth && item._id?.year === currentYear
    );
    console.log("incomeCurrent calculation:", {
      income,
      total: income?.total || 0,
    });
    return income?.total || 0;
  }, [stats.income, currentMonth, currentYear]);

  const incomePrevious = useMemo(() => {
    const income = stats.income.find(
      (item) =>
        item._id?.month === previousMonth && item._id?.year === previousYear
    );
    console.log("incomePrevious calculation:", {
      income,
      total: income?.total || 0,
    });
    return income?.total || 0;
  }, [stats.income, previousMonth, previousYear]);

  const notesPercentage = useMemo(
    () => calculatePercentage(notesCurrent, notesPrevious),
    [notesCurrent, notesPrevious]
  );
  const incomePercentage = useMemo(
    () => calculatePercentage(incomeCurrent, incomePrevious),
    [incomeCurrent, incomePrevious]
  );

  const data = useMemo(
    () => [
      {
        icon: <FaClipboard />,
        digits: notesCurrent,
        isMoney: false,
        title: "Notas",
        color: "#00d532",
        bgColor: "rgba(0, 255, 115, 0.12)",
        percentage: notesPercentage,
      },
      {
        icon: <FaChartBar />,
        digits: incomeCurrent,
        isMoney: true,
        title: "Ventas",
        color: "rgb(253, 181, 40)",
        bgColor: "rgba(253, 181, 40, 0.12)",
        percentage: incomePercentage,
      },
    ],
    [notesCurrent, incomeCurrent, notesPercentage, incomePercentage]
  );

  console.log("Renderizando LocalSummary:", {
    businessId,
    notesCount: items.length,
    statsNotes: stats.notes,
    statsIncome: stats.income,
    status,
    statsStatus,
    error,
  });

  if (isLoading || authLoading) {
    return <LoadingSpinner message="Cargando datos del negocio..." />;
  }

  if (!token) {
    return (
      <ErrorContainer>
        <ErrorMessage>Debes iniciar sesión para ver esta página</ErrorMessage>
      </ErrorContainer>
    );
  }

  if (!businessId) {
    return (
      <ErrorContainer>
        <ErrorMessage>No se proporcionó un ID de negocio válido</ErrorMessage>
      </ErrorContainer>
    );
  }

  if (isBusinessValid === false) {
    return (
      <ErrorContainer>
        <ErrorMessage>Negocio no encontrado o no autorizado</ErrorMessage>
      </ErrorContainer>
    );
  }

  if (businessStatus === "failed") {
    return (
      <ErrorContainer>
        <ErrorMessage>
          Error: {businessError || "No se pudo cargar el negocio"}
        </ErrorMessage>
      </ErrorContainer>
    );
  }

  if (
    statsStatus === "pending" ||
    status === "pending" ||
    businessStatus === "loading"
  ) {
    return <LoadingSpinner message="Cargando estadísticas..." />;
  }

  if (statsStatus === "rejected" || status === "rejected") {
    console.warn("Data fetch rejected, showing zeroed data:", error);
    return (
      <StyledSummary>
        <MainStats>
          <Overview>
            <Title>
              <h2>
                Resumen -{" "}
                {business?.name ||
                  businesses.find((b) => (b._id || b) === businessId)?.name ||
                  "Negocio"}
              </h2>
              <p>Estadísticas de tu lavandería</p>
            </Title>
            <WidgetWrapper>
              {data.map((item, index) => (
                <Widget key={index} data={item} />
              ))}
            </WidgetWrapper>
          </Overview>
          <NotesSummary businessId={businessId} />
        </MainStats>
        <SideStats>
          <Transactions businessId={businessId} />
          <AllTimeData businessId={businessId} />
        </SideStats>
        <NoDataMessage>
          <p>
            Error al cargar datos: {error || "Intenta de nuevo"}. Mostrando
            valores iniciales.
          </p>
          <RetryButton onClick={handleRetry}>Reintentar</RetryButton>
        </NoDataMessage>
      </StyledSummary>
    );
  }

  return (
    <StyledSummary>
      <MainStats>
        <Overview>
          <Title>
            <h2>
              Resumen -{" "}
              {business?.name ||
                businesses.find((b) => (b._id || b) === businessId)?.name ||
                "Negocio"}
            </h2>
            <p>Estadísticas de tu lavandería</p>
          </Title>
          <WidgetWrapper>
            {data.map((item, index) => (
              <Widget key={index} data={item} />
            ))}
          </WidgetWrapper>
        </Overview>
        <NotesSummary businessId={businessId} />
      </MainStats>
      <SideStats>
        <Transactions businessId={businessId} />
        <AllTimeData businessId={businessId} />
      </SideStats>
    </StyledSummary>
  );
};

const StyledSummary = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 2rem;
  padding: 1rem;
  width: 100%;
  @media (max-width: 768px) {
    flex-direction: column;
    gap: 1rem;
  }
`;

const ErrorContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
`;

const RetryButton = styled.button`
  padding: 0.5rem 1rem;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  &:hover {
    background-color: #0056b3;
  }
`;

const MainStats = styled.div`
  flex: 2;
  width: 100%;
  @media (max-width: 768px) {
    flex: 1;
  }
`;

const Title = styled.div`
  h2 {
    color: #ffffff;
    margin-bottom: 0.5rem;
  }
  p {
    font-size: 14px;
    color: #ffffff;
  }
`;

const Overview = styled.div`
  background: linear-gradient(45deg, #4b70e2, #3a5bb8);
  color: #ffffff;
  padding: 1.5rem;
  border-radius: 15px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  margin-bottom: 2rem;
  @media (max-width: 768px) {
    margin-bottom: 1rem;
    padding: 1rem;
  }
`;

const WidgetWrapper = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  width: 100%;
  margin-top: 1rem;
  justify-content: space-around;
  @media (max-width: 768px) {
    justify-content: center;
  }
`;

const SideStats = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2rem;
  width: 100%;
  @media (max-width: 768px) {
    flex: 1;
    margin-top: 1rem;
  }
`;

const NoDataMessage = styled.div`
  text-align: center;
  color: #666;
  margin: 2rem 0;
  width: 100%;
`;

export default LocalSummary;
