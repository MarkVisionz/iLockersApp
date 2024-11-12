// Helpers/dateUtils.js
import moment from "moment";

export const getPeriodDates = (period, reportStartDate, reportEndDate) => {
  const now = moment();
  let startDate, endDate;

  switch (period) {
    case "daily":
      startDate = now.clone().startOf("day");
      endDate = now.clone().endOf("day");
      break;
    case "weekly":
      startDate = now.clone().startOf("isoWeek"); // Comienza el lunes
      endDate = now.clone().endOf("isoWeek"); // Termina el domingo
      break;
    case "monthly":
      startDate = now.clone().startOf("month"); // Comienza el primer día del mes
      endDate = now.clone().endOf("month"); // Termina el último día del mes
      break;
    case "custom":
      startDate = moment(reportStartDate);
      endDate = moment(reportEndDate);
      break;
    default:
      startDate = now.clone().startOf("day");
      endDate = now.clone().endOf("day");
  }

  return { startDate, endDate };
};