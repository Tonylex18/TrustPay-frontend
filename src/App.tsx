import React from "react";
import { ToastContainer } from "react-toastify";
import Routes from "./Routes";
import "react-toastify/dist/ReactToastify.css";
import { CurrencyProvider } from "./context/CurrencyContext";

const App: React.FC = () => {
  return (
    <>
      <CurrencyProvider>
        <Routes />
      </CurrencyProvider>
      <ToastContainer
        position="top-right"
        autoClose={4000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        pauseOnHover
        draggable
      />
    </>
  );
};

export default App;
