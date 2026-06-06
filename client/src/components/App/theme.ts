import { createTheme } from "@mui/material/styles";

const theme = createTheme({
  palette: {
    primary: {
      main:         "#2263a9",
      light:        "#4d8ec4",
      dark:         "#174f8a",
      contrastText: "#ffffff",
    },
    secondary: {
      main:         "#87a652",
      light:        "#a3bf70",
      dark:         "#5f7a35",
      contrastText: "#ffffff",
    },
    success: {
      main:         "#88cc22",
      contrastText: "#ffffff",
    },
    text: {
      primary:   "#010202",
      secondary: "#5a5a5a",
    },
    divider: "#b4b4b3",
    background: {
      default: "#ffffff",
      paper:   "#ffffff",
    },
  },
  typography: {
    fontFamily: [
      "Roboto",
      '"Helvetica Neue"',
      "Arial",
      "sans-serif",
      '"Segoe UI Emoji"',
      '"Segoe UI Symbol"',
    ].join(","),
  },
  components: {
    // Chip: outline sottile — elegante, non invade
    MuiChip: {
      defaultProps: {
        variant: "outlined",
      },
    },

    // ToggleButton: stesso stile delle chip outlined primary
    MuiToggleButton: {
      styleOverrides: {
        root: ({ theme }) => ({
          color:       theme.palette.primary.main,
          borderColor: theme.palette.primary.light,

          "&:hover": {
            backgroundColor: `${theme.palette.primary.light}14`, // ~8% opacity
          },

          "&.Mui-selected": {
            color:           theme.palette.primary.contrastText,
            backgroundColor: theme.palette.primary.main,
            "&:hover": {
              backgroundColor: theme.palette.primary.dark,
            },
          },
        }),
      },
    },
  },
});

export default theme;
