import { blue } from "@mui/material/colors";
import { createTheme } from "@mui/material/styles";

const theme = createTheme({
    palette: {
        primary: {
            light: blue["A100"],
            main: blue[500],
            dark: blue[800],
        },
        secondary: {
            main: blue[50],
        },
        contrastThreshold: 3,
        tonalOffset: 0.2,
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
});

export default theme;
