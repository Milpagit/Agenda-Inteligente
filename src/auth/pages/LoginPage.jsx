import "./LoginPage.css";
import { useAuthStore, useForm } from "../../hooks";
import { useEffect } from "react";
import Swal from "sweetalert2";
import "sweetalert2/dist/sweetalert2.min.css";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 6;
const MAX_PASSWORD_LENGTH = 128;
const MAX_NAME_LENGTH = 60;

const loginFormFields = {
  loginEmail: "",
  loginPassword: "",
};

const registerFormFields = {
  registerName: "",
  registerEmail: "",
  registerPassword: "",
  registerPassword2: "",
};

const hasValidPasswordLength = (password) =>
  password.length >= MIN_PASSWORD_LENGTH &&
  password.length <= MAX_PASSWORD_LENGTH;

export const LoginPage = () => {
  const { startLogin, startRegister, errorMessage } = useAuthStore();

  const {
    loginEmail,
    loginPassword,
    onInputChange: onLoginInputChange,
  } = useForm(loginFormFields);

  const {
    registerName,
    registerEmail,
    registerPassword,
    registerPassword2,
    onInputChange: onRegisterInputChange,
  } = useForm(registerFormFields);

  const handleLoginSubmit = (event) => {
    event.preventDefault();

    const normalizedEmail = loginEmail.trim().toLowerCase();

    if (!EMAIL_REGEX.test(normalizedEmail)) {
      Swal.fire(
        "Error de inicio de sesión",
        "Ingresa un correo válido.",
        "error",
      );
      return;
    }

    if (!hasValidPasswordLength(loginPassword)) {
      Swal.fire(
        "Error de inicio de sesión",
        `La contraseña debe tener entre ${MIN_PASSWORD_LENGTH} y ${MAX_PASSWORD_LENGTH} caracteres.`,
        "error",
      );
      return;
    }

    startLogin({ email: normalizedEmail, password: loginPassword });
  };

  const handleRegisterSubmit = (event) => {
    event.preventDefault();

    const normalizedName = registerName.trim();
    const normalizedEmail = registerEmail.trim().toLowerCase();

    if (normalizedName.length < 2 || normalizedName.length > MAX_NAME_LENGTH) {
      Swal.fire(
        "Error de registro",
        `El nombre debe tener entre 2 y ${MAX_NAME_LENGTH} caracteres.`,
        "error",
      );
      return;
    }

    if (!EMAIL_REGEX.test(normalizedEmail)) {
      Swal.fire("Error de registro", "Ingresa un correo válido.", "error");
      return;
    }

    if (!hasValidPasswordLength(registerPassword)) {
      Swal.fire(
        "Error de registro",
        `La contraseña debe tener entre ${MIN_PASSWORD_LENGTH} y ${MAX_PASSWORD_LENGTH} caracteres.`,
        "error",
      );
      return;
    }

    if (registerPassword !== registerPassword2) {
      Swal.fire("Error de registro", "Las contraseñas no coinciden.", "error");
      return;
    }

    startRegister({
      name: normalizedName,
      email: normalizedEmail,
      password: registerPassword,
    });
  };

  useEffect(() => {
    if (errorMessage !== undefined) {
      Swal.fire("Error de autenticación", errorMessage, "error");
    }
  }, [errorMessage]);

  return (
    <div className="container login-container">
      <div className="row">
        <div className="col-md-6 login-form-1">
          <h3>Log In</h3>
          <form aria-label="login-form" onSubmit={handleLoginSubmit}>
            <div className="form-group mb-2">
              <input
                type="email"
                aria-label="loginEmail"
                value={loginEmail}
                className="form-control"
                placeholder="Email"
                onChange={onLoginInputChange}
                name="loginEmail"
                required
                maxLength={254}
              />
            </div>
            <div className="form-group mb-2">
              <input
                type="password"
                aria-label="loginPassword"
                value={loginPassword}
                className="form-control"
                placeholder="Password"
                onChange={onLoginInputChange}
                name="loginPassword"
                required
                minLength={MIN_PASSWORD_LENGTH}
                maxLength={MAX_PASSWORD_LENGTH}
              />
            </div>

            <div className="form-group mb-2">
              <input type="submit" className="btnSubmit" value="Login" />
            </div>
          </form>
        </div>

        <div className="col-md-6 login-form-2">
          <h3>Sign Up</h3>
          <form aria-label="register-form" onSubmit={handleRegisterSubmit}>
            <div className="form-group mb-2">
              <input
                type="text"
                aria-label="registerName"
                value={registerName}
                className="form-control"
                placeholder="Name"
                name="registerName"
                onChange={onRegisterInputChange}
                required
                minLength={2}
                maxLength={MAX_NAME_LENGTH}
              />
            </div>
            <div className="form-group mb-2">
              <input
                type="email"
                aria-label="registerEmail"
                value={registerEmail}
                className="form-control"
                placeholder="Email"
                name="registerEmail"
                onChange={onRegisterInputChange}
                required
                maxLength={254}
              />
            </div>
            <div className="form-group mb-2">
              <input
                type="password"
                aria-label="registerPassword"
                value={registerPassword}
                className="form-control"
                placeholder="Contraseña"
                name="registerPassword"
                onChange={onRegisterInputChange}
                required
                minLength={MIN_PASSWORD_LENGTH}
                maxLength={MAX_PASSWORD_LENGTH}
              />
            </div>

            <div className="form-group mb-2">
              <input
                type="password"
                aria-label="registerPassword2"
                value={registerPassword2}
                className="form-control"
                placeholder="Repeat Password"
                name="registerPassword2"
                onChange={onRegisterInputChange}
                required
                minLength={MIN_PASSWORD_LENGTH}
                maxLength={MAX_PASSWORD_LENGTH}
              />
            </div>

            <div className="form-group mb-2">
              <input type="submit" className="btnSubmit" value="Crear cuenta" />
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
