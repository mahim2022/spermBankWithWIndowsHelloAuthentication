'use client';
import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  cssVariables: true,
  colorSchemes: { light: true, dark: true },
  palette: {
    mode: 'light',
    primary: { main: '#0e5aa7' },
    secondary: { main: '#6b9a3c' },
    error: { main: '#d32f2f' },
  },
  shape: { borderRadius: 12 },
  components: {
    MuiButton: { defaultProps: { disableElevation: true } },
    MuiContainer: { defaultProps: { maxWidth: 'lg' } },
  },
  typography: {
    fontFamily: `Inter, system-ui, -apple-system, Segoe UI, Roboto, Arial, "Helvetica Neue", sans-serif`,
  },
});

export default theme;
