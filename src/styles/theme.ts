// Определение цветов для темной темы по стилю black-dashboard-react
export const COLORS = {
  primary: "#1d8cf8",
  success: "#00f2c3",
  info: "#1d8cf8",
  warning: "#ff8d72",
  danger: "#fd5d93",
  backgroundColor: "#1e1e2f",
  cardBackground: "#27293d",
  textColor: "#ffffff",
  textColorSecondary: "#9a9a9a",
  borderColor: "#2b3553",
  chartColors: ["#1d8cf8", "#00f2c3", "#ff8d72", "#fd5d93", "#ba54f5"]
};

// Общие стили для компонентов
export const COMPONENT_STYLES = {
  card: {
    backgroundColor: COLORS.cardBackground,
    borderColor: COLORS.borderColor,
    boxShadow: "0 1px 20px 0 rgba(0,0,0,.1)"
  },
  text: {
    title: { color: COLORS.textColor },
    description: { color: COLORS.textColorSecondary }
  },
  chart: {
    grid: { stroke: COLORS.borderColor },
    tooltip: { 
      contentStyle: { 
        backgroundColor: COLORS.cardBackground, 
        borderColor: COLORS.borderColor,
        color: COLORS.textColor 
      }
    }
  },
  tabs: {
    list: {
      backgroundColor: COLORS.cardBackground,
      borderColor: COLORS.borderColor
    },
    trigger: {
      base: "text-sm px-4 py-2 rounded-md hover:bg-gray-800",
      active: "data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:font-medium"
    }
  },
  button: {
    primary: {
      backgroundColor: COLORS.primary,
      color: COLORS.textColor
    },
    outline: {
      borderColor: COLORS.borderColor,
      color: COLORS.primary
    },
    ghost: {
      color: COLORS.primary
    }
  }
};

export default COLORS; 